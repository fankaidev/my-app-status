import { GET as GET_PROJECT } from "@/app/api/projects/[id]/route";
import { GET } from "@/app/api/projects/route";
import { auth } from "@/auth";
import { setTestDb } from "@/db";
import { ApiError } from "@/lib/api-error";
import type { ProjectWithStatus } from "@/types/db";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanDb, createTestDb, seedTestData } from "../utils/test-db";

// Mock auth.js
vi.mock("@/auth", () => ({
  auth: vi.fn(() => Promise.resolve({ user: { email: "test@example.com" } })),
}));

interface ErrorResponse {
  error: {
    message: string;
  };
}

describe("Projects API", () => {
  let db: any;

  beforeEach(() => {
    db = createTestDb();
    setTestDb(db);
    seedTestData(db);
  });

  afterEach(() => {
    cleanDb(db);
    setTestDb(null);
  });

  describe("GET /api/projects", () => {
    it("should list active projects for authenticated user", async () => {
      const req = new Request("http://localhost/api/projects");
      const response = await GET(req);
      const data = (await response.json()) as ProjectWithStatus[];

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1); // Only active project
      expect(data[0]).toMatchObject({
        id: "1",
        name: "Active Project",
        owner_id: "test@example.com",
        status: "operational",
      });
    });

    it("should include deleted projects when requested", async () => {
      const req = new Request("http://localhost/api/projects?include_deleted=true");
      const response = await GET(req);
      const data = (await response.json()) as ProjectWithStatus[];

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2); // Both active and deleted projects
      expect(data.some((p) => p.name === "Active Project")).toBe(true);
      expect(data.some((p) => p.name === "Deleted Project")).toBe(true);
      // All projects should belong to test user
      expect(data.every((p) => p.owner_id === "test@example.com")).toBe(true);
    });

    it("should handle invalid query parameters gracefully", async () => {
      const req = new Request("http://localhost/api/projects?invalid=true");
      const response = await GET(req);
      const data = (await response.json()) as ProjectWithStatus[];

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1); // Only active project
      expect(data[0].owner_id).toBe("test@example.com");
    });

    it("should not return projects from other users", async () => {
      // Mock different user
      vi.mocked(auth).mockResolvedValueOnce({
        user: { email: "other@example.com" }
      });

      const req = new Request("http://localhost/api/projects");
      const response = await GET(req);
      const data = (await response.json()) as ProjectWithStatus[];

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0); // No projects for other user
    });
  });

  describe("GET /api/projects/[id]", () => {
    it("should return project details for owner", async () => {
      const req = new Request("http://localhost/api/projects/1");
      const response = await GET_PROJECT(req, { params: { id: "1" } });
      const data = (await response.json()) as ProjectWithStatus;

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        id: "1",
        name: "Active Project",
        owner_id: "test@example.com",
        status: "operational",
      });
    });

    it("should return 404 for non-existent project", async () => {
      const req = new Request("http://localhost/api/projects/999");
      try {
        const response = await GET_PROJECT(req, { params: { id: "999" } });
        expect(response.status).toBe(404);
      } catch (error) {
        if (error instanceof ApiError) {
          expect(error.statusCode).toBe(404);
        } else {
          throw error;
        }
      }
    });

    it("should return deleted project when it exists and owned by user", async () => {
      const req = new Request("http://localhost/api/projects/2");
      const response = await GET_PROJECT(req, { params: { id: "2" } });
      const data = (await response.json()) as ProjectWithStatus;

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        id: "2",
        name: "Deleted Project",
        owner_id: "test@example.com",
        status: "operational",
      });
    });

    it("should handle invalid project IDs gracefully", async () => {
      const req = new Request("http://localhost/api/projects/invalid-id");
      try {
        const response = await GET_PROJECT(req, { params: { id: "invalid-id" } });
        expect(response.status).toBe(404);
      } catch (error) {
        if (error instanceof ApiError) {
          expect(error.statusCode).toBe(404);
        } else {
          throw error;
        }
      }
    });

    it("should not allow access to other user's project", async () => {
      // Mock different user
      vi.mocked(auth).mockResolvedValueOnce({
        user: { email: "other@example.com" }
      });

      const req = new Request("http://localhost/api/projects/1");
      try {
        const response = await GET_PROJECT(req, { params: { id: "1" } });
        expect(response.status).toBe(404);
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
