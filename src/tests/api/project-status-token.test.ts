import { POST } from "@/app/api/projects/status/route";
import { auth } from "@/auth";
import { setTestDb } from "@/db";
import { ApiError } from "@/lib/api-error";
import { generateToken, hashToken } from "@/lib/token-utils";
import { Project } from "@/types/db";
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

describe("Project Status API with Token Auth", () => {
    let db: any;
    let testProject: Project;
    let testToken: string;
    let hashedToken: string;

    beforeEach(async () => {
        db = createTestDb();
        setTestDb(db);

        // Create test tables
        await db.batch([
            db.prepare(`
        CREATE TABLE projects (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          owner_id TEXT NOT NULL,
          created_at INTEGER NOT NULL DEFAULT (unixepoch()),
          updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
          deleted BOOLEAN NOT NULL DEFAULT 0
        )
      `),
            db.prepare(`
        CREATE TABLE status_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id TEXT NOT NULL,
          status TEXT NOT NULL,
          message TEXT,
          created_at INTEGER NOT NULL DEFAULT (unixepoch()),
          FOREIGN KEY (project_id) REFERENCES projects(id)
        )
      `),
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

        // Create test project
        const result = await db
            .prepare(
                `INSERT INTO projects (id, name, owner_id)
         VALUES (?, ?, ?)
         RETURNING *`
            )
            .bind("test-project-1", "Test Project", "test@example.com")
            .first();
        testProject = result as Project;

        // Create test token
        testToken = generateToken();
        hashedToken = hashToken(testToken);
        await db
            .prepare(
                `INSERT INTO user_tokens (id, user_id, token, name)
         VALUES (?, ?, ?, ?)`
            )
            .bind(
                "test-token-1",
                "test@example.com",
                hashedToken,
                "Test Token"
            )
            .run();
    });

    afterEach(() => {
        setTestDb(null);
        vi.clearAllMocks();
    });

    it("should accept valid token in Authorization header", async () => {
        const response = await POST(
            new Request("http://localhost/api/projects/status", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${testToken}`,
                },
                body: JSON.stringify({
                    id: testProject.id,
                    status: "operational",
                }),
            })
        );

        expect(response.status).toBe(200);

        // Verify status is updated
        const status = await db
            .prepare(
                `SELECT status FROM status_history
         WHERE project_id = ?
         ORDER BY created_at DESC
         LIMIT 1`
            )
            .bind(testProject.id)
            .first();
        expect((status as { status: string })?.status).toBe("operational");

        // Verify last_used_at is updated
        const token = await db
            .prepare("SELECT last_used_at FROM user_tokens WHERE token = ?")
            .bind(hashedToken)
            .first();
        expect((token as { last_used_at: number })?.last_used_at).toBeTruthy();
    });

    it("should reject invalid token format", async () => {
        try {
            await POST(
                new Request("http://localhost/api/projects/status", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer invalid_token",
                    },
                    body: JSON.stringify({
                        id: testProject.id,
                        status: "operational",
                    }),
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

    it("should reject revoked token", async () => {
        // Revoke token
        await db
            .prepare("UPDATE user_tokens SET revoked_at = unixepoch() WHERE token = ?")
            .bind(hashedToken)
            .run();

        try {
            await POST(
                new Request("http://localhost/api/projects/status", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${testToken}`,
                    },
                    body: JSON.stringify({
                        id: testProject.id,
                        status: "operational",
                    }),
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

    it("should fallback to session auth if no token provided", async () => {
        // Mock session auth
        vi.mocked(auth).mockResolvedValueOnce({
            user: { email: "test@example.com" },
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        } as MockSession);

        const response = await POST(
            new Request("http://localhost/api/projects/status", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: testProject.id,
                    status: "operational",
                }),
            })
        );

        expect(response.status).toBe(200);
    });

    it("should reject if both auth methods fail", async () => {
        // Mock session auth to fail
        vi.mocked(auth).mockResolvedValueOnce(null);

        try {
            await POST(
                new Request("http://localhost/api/projects/status", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        id: testProject.id,
                        status: "operational",
                    }),
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
});