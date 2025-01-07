import { DELETE, PATCH } from "@/app/api/projects/[id]/route";
import { GET as GET_LIST } from "@/app/api/projects/route";
import { auth } from "@/auth";
import { setTestDb } from "@/db";
import { deleteProject, getProjects, restoreProject } from "@/db/operations";
import { ProjectWithStatus } from "@/types/db";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanDb, createTestDb, seedTestData } from "../utils/test-db";

// Mock auth
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

interface ProjectRow extends ProjectWithStatus {
  deleted: number;
}

describe("Project Admin Operations", () => {
  let db: any;
  let mockSession: any;
  let testData: { activeProject: ProjectRow; deletedProject: ProjectRow };

  beforeEach(() => {
    db = createTestDb();
    setTestDb(db);
    testData = seedTestData(db);
    mockSession = {
      user: {
        email: "test@example.com",
      },
    };
    // Mock auth to return session
    (auth as any).mockResolvedValue(mockSession);
  });

  afterEach(() => {
    cleanDb(db);
    setTestDb(null);
    vi.clearAllMocks();
  });

  describe("Database Operations", () => {
    it("should soft delete a project", async () => {
      await deleteProject(db, "1");
      const projects = await getProjects(db, { includeDeleted: true });
      const deletedProject = projects.find((p) => p.id === "1") as ProjectRow;
      expect(deletedProject?.deleted).toBe(1);
    });

    it("should restore a deleted project", async () => {
      await restoreProject(db, "2");
      const projects = await getProjects(db, { includeDeleted: true });
      const restoredProject = projects.find((p) => p.id === "2") as ProjectRow;
      expect(restoredProject?.deleted).toBe(0);
    });

    it("should filter out deleted projects by default", async () => {
      const projects = await getProjects(db);
      expect(projects.length).toBe(1);
      expect(projects[0].id).toBe("1");
    });

    it("should include deleted projects when requested", async () => {
      const projects = await getProjects(db, { includeDeleted: true });
      expect(projects.length).toBe(2);
    });

    it("should throw error when deleting non-existent project", async () => {
      await expect(deleteProject(db, "999")).rejects.toThrow("Project not found");
    });

    it("should throw error when restoring non-existent project", async () => {
      await expect(restoreProject(db, "999")).rejects.toThrow("Project not found");
    });

    it("should throw error when restoring non-deleted project", async () => {
      await expect(restoreProject(db, "1")).rejects.toThrow("Project is not deleted");
    });
  });

  describe("API Endpoints", () => {
    describe("GET /api/projects", () => {
      it("should return only active projects by default", async () => {
        const request = new Request("http://localhost/api/projects");
        const response = await GET_LIST(request);
        expect(response.status).toBe(200);
        const data = (await response.json()) as ProjectWithStatus[];
        expect(data.length).toBe(1);
        expect(data[0].id).toBe("1");
      });

      it("should return all projects when include_deleted=true", async () => {
        const request = new Request("http://localhost/api/projects?include_deleted=true");
        const response = await GET_LIST(request);
        expect(response.status).toBe(200);
        const data = (await response.json()) as ProjectWithStatus[];
        expect(data.length).toBe(2);
      });
    });

    describe("DELETE /api/projects/[id]", () => {
      it("should require authentication", async () => {
        (auth as any).mockResolvedValue(null);
        const request = new Request("http://localhost/api/projects/1", {
          method: "DELETE",
        });
        const context = { params: { id: "1" } };
        await expect(DELETE(request, context)).rejects.toThrow("Authentication required");
      });

      it("should soft delete a project", async () => {
        const request = new Request("http://localhost/api/projects/1", {
          method: "DELETE",
        });
        const context = { params: { id: "1" } };
        const response = await DELETE(request, context);
        expect(response.status).toBe(200);

        const projects = await getProjects(db);
        expect(projects.length).toBe(0); // All projects are now deleted
      });
    });

    describe("PATCH /api/projects/[id]", () => {
      it("should require authentication", async () => {
        (auth as any).mockResolvedValue(null);
        const request = new Request("http://localhost/api/projects/2", {
          method: "PATCH",
        });
        const context = { params: { id: "2" } };
        await expect(PATCH(request, context)).rejects.toThrow("Authentication required");
      });

      it("should restore a deleted project", async () => {
        const request = new Request("http://localhost/api/projects/2", {
          method: "PATCH",
        });
        const context = { params: { id: "2" } };
        const response = await PATCH(request, context);
        expect(response.status).toBe(200);

        const projects = await getProjects(db);
        expect(projects.length).toBe(2); // Both projects are now active
      });
    });
  });
});
