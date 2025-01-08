import { GET } from "@/app/api/projects/[id]/history/route";
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

    it("should return empty history for new project", async () => {
      const req = new Request("http://localhost/api/projects/1/history");
      const response = await GET(req, { params: { id: "1" } });
      const data = (await response.json()) as { history: StatusHistory[] };

      expect(response.status).toBe(200);
      expect(data.history).toEqual([]);
    });

    it("should return status history in reverse chronological order", async () => {
      const req = new Request("http://localhost/api/projects/1/history");
      const response = await GET(req, { params: { id: "1" } });
      const data = (await response.json()) as { history: StatusHistory[] };

      expect(response.status).toBe(200);
      expect(data.history).toHaveLength(3);
      expect(data.history[0].status).toBe("major_outage");
      expect(data.history[1].status).toBe("degraded");
      expect(data.history[2].status).toBe("operational");
    });

    it("should respect limit parameter", async () => {
      const req = new Request("http://localhost/api/projects/1/history?limit=2");
      const response = await GET(req, { params: { id: "1" } });
      const data = (await response.json()) as { history: StatusHistory[] };

      expect(response.status).toBe(200);
      expect(data.history).toHaveLength(2);
      expect(data.history[0].status).toBe("major_outage");
      expect(data.history[1].status).toBe("degraded");
    });
  });
});
