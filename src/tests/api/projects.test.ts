import { GET as GET_PROJECT } from "@/app/api/projects/[id]/route";
import { GET } from "@/app/api/projects/route";
import { setTestDb } from "@/db";
import type { ProjectWithStatus } from "@/types/db";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanDb, createTestDb, seedTestData } from "../utils/test-db";

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
    it("should list active projects", async () => {
      const req = new Request("http://localhost/api/projects");
      const response = await GET(req);
      const data = (await response.json()) as ProjectWithStatus[];

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1); // Only active project
      expect(data[0]).toMatchObject({
        id: "1",
        name: "Active Project",
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
    });

    it("should handle invalid query parameters gracefully", async () => {
      const req = new Request("http://localhost/api/projects?invalid=true");
      const response = await GET(req);
      const data = (await response.json()) as ProjectWithStatus[];

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(1); // Only active project
    });
  });

  describe("GET /api/projects/[id]", () => {
    it("should return project details", async () => {
      const req = new Request("http://localhost/api/projects/1");
      const response = await GET_PROJECT(req, { params: { id: "1" } });
      const data = (await response.json()) as ProjectWithStatus;

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        id: "1",
        name: "Active Project",
        status: "operational",
      });
    });

    it("should return 404 for non-existent project", async () => {
      const req = new Request("http://localhost/api/projects/999");
      const response = await GET_PROJECT(req, { params: { id: "999" } });
      const data = (await response.json()) as ErrorResponse;

      expect(response.status).toBe(404);
      expect(data.error.message).toBe("Project not found");
    });

    it("should return deleted project when it exists", async () => {
      const req = new Request("http://localhost/api/projects/2");
      const response = await GET_PROJECT(req, { params: { id: "2" } });
      const data = (await response.json()) as ProjectWithStatus;

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        id: "2",
        name: "Deleted Project",
        status: "operational",
      });
    });

    it("should handle invalid project IDs gracefully", async () => {
      const req = new Request("http://localhost/api/projects/invalid-id");
      const response = await GET_PROJECT(req, { params: { id: "invalid-id" } });
      const data = (await response.json()) as ErrorResponse;

      expect(response.status).toBe(404);
      expect(data.error.message).toBe("Project not found");
    });
  });
});
