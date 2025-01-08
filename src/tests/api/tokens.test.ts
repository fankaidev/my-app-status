import { DELETE } from "@/app/api/tokens/[id]/route";
import { GET, POST } from "@/app/api/tokens/route";
import { auth } from "@/auth";
import { setTestDb } from "@/db";
import { ApiError } from "@/lib/api-error";
import { UserToken, generateToken, hashToken } from "@/lib/token-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDb } from "../utils/test-db";

// Mock auth
vi.mock("@/auth", () => ({
    auth: vi.fn(),
}));

// Mock session type
type MockSession = {
    user: { email: string };
    expires: string;
};

describe("Token Management API", () => {
    let db: any;
    let mockSession: MockSession;
    let testToken: UserToken;
    let testTokenId: string;
    let testTokenValue: string;

    beforeEach(async () => {
        db = createTestDb();
        setTestDb(db);

        // Create test tables
        await db.batch([
            db.prepare(`
        CREATE TABLE user_tokens (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          token TEXT NOT NULL,
          name TEXT NOT NULL,
          created_at INTEGER NOT NULL DEFAULT (unixepoch()),
          last_used_at INTEGER,
          revoked_at INTEGER,
          UNIQUE(token)
        )
      `),
        ]);

        // Setup mock session
        mockSession = {
            user: {
                email: "test@example.com",
            },
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
        vi.mocked(auth).mockResolvedValue(mockSession as any);

        // Create a test token
        testTokenId = crypto.randomUUID();
        testTokenValue = generateToken();
        const hashedToken = hashToken(testTokenValue);

        const result = await db
            .prepare(
                `INSERT INTO user_tokens (id, user_id, token, name, created_at)
         VALUES (?, ?, ?, ?, unixepoch())
         RETURNING *`
            )
            .bind(testTokenId, "test@example.com", hashedToken, "Test Token")
            .first();
        testToken = result as UserToken;
    });

    afterEach(() => {
        setTestDb(null);
        vi.clearAllMocks();
    });

    describe("GET /api/tokens", () => {
        it("should require authentication", async () => {
            vi.mocked(auth).mockResolvedValueOnce(null);

            try {
                await GET(new Request("http://localhost/api/tokens"));
            } catch (error) {
                if (error instanceof ApiError) {
                    expect(error.statusCode).toBe(401);
                } else {
                    throw error;
                }
            }
        });

        it("should list user's tokens", async () => {
            const response = await GET(new Request("http://localhost/api/tokens"));
            const tokens = (await response.json()) as UserToken[];

            expect(response.status).toBe(200);
            expect(Array.isArray(tokens)).toBe(true);
            expect(tokens.length).toBe(1);
            expect(tokens[0]).toMatchObject({
                id: testTokenId,
                user_id: "test@example.com",
                name: "Test Token",
            });
        });

        it("should not return tokens from other users", async () => {
            // Mock different user
            vi.mocked(auth).mockResolvedValueOnce({
                user: { email: "other@example.com" },
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            } as any);

            const response = await GET(new Request("http://localhost/api/tokens"));
            const tokens = (await response.json()) as UserToken[];

            expect(response.status).toBe(200);
            expect(tokens.length).toBe(0);
        });
    });

    describe("POST /api/tokens", () => {
        it("should require authentication", async () => {
            vi.mocked(auth).mockResolvedValueOnce(null);

            try {
                await POST(
                    new Request("http://localhost/api/tokens", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name: "New Token" }),
                    })
                );
            } catch (error) {
                if (error instanceof ApiError) {
                    expect(error.statusCode).toBe(401);
                } else {
                    throw error;
                }
            }
        });

        it("should require token name", async () => {
            try {
                await POST(
                    new Request("http://localhost/api/tokens", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({}),
                    })
                );
            } catch (error) {
                if (error instanceof ApiError) {
                    expect(error.statusCode).toBe(400);
                    expect(error.message).toBe("Token name is required");
                } else {
                    throw error;
                }
            }
        });

        it("should create new token", async () => {
            const response = await POST(
                new Request("http://localhost/api/tokens", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: "New Token" }),
                })
            );

            const data = (await response.json()) as { token: string; id: string };
            expect(response.status).toBe(201);
            expect(data).toHaveProperty("token");
            expect(data).toHaveProperty("id");
            expect(typeof data.token).toBe("string");
            expect(data.token).toMatch(/^ast_/); // Check token format
        });
    });

    describe("DELETE /api/tokens/[id]", () => {
        it("should require authentication", async () => {
            vi.mocked(auth).mockResolvedValueOnce(null);

            try {
                await DELETE(
                    new Request(`http://localhost/api/tokens/${testTokenId}`, {
                        method: "DELETE",
                    }),
                    { params: { id: testTokenId } }
                );
            } catch (error) {
                if (error instanceof ApiError) {
                    expect(error.statusCode).toBe(401);
                } else {
                    throw error;
                }
            }
        });

        it("should revoke token", async () => {
            const response = await DELETE(
                new Request(`http://localhost/api/tokens/${testTokenId}`, {
                    method: "DELETE",
                }),
                { params: { id: testTokenId } }
            );

            expect(response.status).toBe(200);

            // Verify token is revoked
            const token = await db
                .prepare("SELECT * FROM user_tokens WHERE id = ?")
                .bind(testTokenId)
                .first();
            expect((token as UserToken).revoked_at).toBeTruthy();
        });

        it("should not allow revoking other user's token", async () => {
            // Mock different user
            vi.mocked(auth).mockResolvedValueOnce({
                user: { email: "other@example.com" },
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            } as any);

            try {
                await DELETE(
                    new Request(`http://localhost/api/tokens/${testTokenId}`, {
                        method: "DELETE",
                    }),
                    { params: { id: testTokenId } }
                );
            } catch (error) {
                if (error instanceof ApiError) {
                    expect(error.statusCode).toBe(404);
                } else {
                    throw error;
                }
            }

            // Verify token is not revoked
            const token = await db
                .prepare("SELECT * FROM user_tokens WHERE id = ?")
                .bind(testTokenId)
                .first();
            expect((token as UserToken).revoked_at).toBeFalsy();
        });

        it("should return 404 for non-existent token", async () => {
            try {
                await DELETE(
                    new Request("http://localhost/api/tokens/non-existent", {
                        method: "DELETE",
                    }),
                    { params: { id: "non-existent" } }
                );
            } catch (error) {
                if (error instanceof ApiError) {
                    expect(error.statusCode).toBe(404);
                } else {
                    throw error;
                }
            }
        });
    });
});