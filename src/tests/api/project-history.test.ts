import { GET } from "@/app/api/projects/[id]/history/route";
import { POST } from "@/app/api/projects/status/route";
import { auth } from "@/auth";
import { setTestDb } from "@/db";
import { ApiError } from "@/lib/api-error";
import type { StatusHistory } from "@/types/db";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanDb, createTestDb, seedTestData } from "../utils/test-db";

// Mock auth.js with a valid session
vi.mock("@/auth", () => ({
  auth: vi.fn(() =>
    Promise.resolve({
      user: { email: "test@example.com" },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
  ),
}));

describe("Project History API", () => {
  let db: any;

  beforeEach(() => {
    // Reset auth mock before each test
    vi.mocked(auth).mockClear();
    // Setup test database
    db = createTestDb();
    setTestDb(db);
    seedTestData(db);
  });

  afterEach(() => {
    cleanDb(db);
    setTestDb(null);
  });

  describe("GET /api/projects/[id]/history", () => {
    it("should return 401 for unauthenticated requests", async () => {
      // Mock auth to return no session
      vi.mocked(auth).mockResolvedValueOnce(undefined);

      const req = new Request("http://localhost/api/projects/1/history");
      try {
        await GET(req, { params: { id: "1" } });
        throw new Error("Expected error not thrown");
      } catch (error) {
        if (error instanceof ApiError) {
          expect(error.statusCode).toBe(401);
        } else {
          throw error;
        }
      }
    });

    it("should return 404 for non-existent project", async () => {
      const req = new Request("http://localhost/api/projects/999/history");
      try {
        await GET(req, { params: { id: "999" } });
        throw new Error("Expected error not thrown");
      } catch (error) {
        if (error instanceof ApiError) {
          expect(error.statusCode).toBe(404);
        } else {
          throw error;
        }
      }
    });

    it("should return 404 for project owned by another user", async () => {
      // Mock different user
      vi.mocked(auth).mockResolvedValueOnce({
        user: { email: "other@example.com" },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      const req = new Request("http://localhost/api/projects/1/history");
      try {
        await GET(req, { params: { id: "1" } });
        throw new Error("Expected error not thrown");
      } catch (error) {
        if (error instanceof ApiError) {
          expect(error.statusCode).toBe(404);
        } else {
          throw error;
        }
      }
    });

    it("should return more history after set status", async () => {
      const req = new Request("http://localhost/api/projects/1/history");
      const response = await GET(req, { params: { id: "1" } });
      const data = (await response.json()) as { history: StatusHistory[] };

      expect(response.status).toBe(200);
      const prevHistory = data.history;

      const req2 = new Request("http://localhost/api/projects/status", {
        method: "POST",
        body: JSON.stringify({
          id: "1",
          status: "degraded",
          message: "Performance issues",
        }),
      });
      const response2 = await POST(req2);
      expect(response2.status).toBe(200);

      const req3 = new Request("http://localhost/api/projects/1/history");
      const response3 = await GET(req3, { params: { id: "1" } });
      const data3 = (await response3.json()) as { history: StatusHistory[] };
      const newHistory = data3.history;

      expect(response3.status).toBe(200);
      expect(newHistory.length).toEqual(prevHistory.length + 1);
    });
  });
});
