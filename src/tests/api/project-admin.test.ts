import { DELETE, PATCH } from "@/app/api/projects/[id]/route";
import { GET as GET_LIST } from "@/app/api/projects/route";
import { auth } from "@/auth";
import { setTestDb } from "@/db";
import { ApiError } from "@/lib/api-error";
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

interface ErrorResponse {
  error: {
    message: string;
  };
}

describe("Project Admin Operations", () => {
  let db: any;
  let mockSession: any;
  let testData: { activeProject: ProjectRow; deletedProject: ProjectRow };

  beforeEach(() => {
    db = createTestDb();
    setTestDb(db);
    testData = seedTestData(db) as { activeProject: ProjectRow; deletedProject: ProjectRow };
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
        try {
          const response = await DELETE(request, context);
          expect(response.status).toBe(401);
        } catch (error) {
          if (error instanceof ApiError) {
            expect(error.statusCode).toBe(401);
          } else {
            throw error;
          }
        }
      });

      it("should soft delete a project", async () => {
        const request = new Request("http://localhost/api/projects/1", {
          method: "DELETE",
        });
        const context = { params: { id: "1" } };
        const response = await DELETE(request, context);
        expect(response.status).toBe(200);

        // Verify through GET API
        const listResponse = await GET_LIST(new Request("http://localhost/api/projects?include_deleted=true"));
        const projects = (await listResponse.json()) as (ProjectWithStatus & { deleted: number })[];
        const deleted = projects.find((p) => p.id === "1");
        expect(deleted?.deleted).toBe(1);
      });

      it("should return 404 for non-existent project", async () => {
        const request = new Request("http://localhost/api/projects/999", {
          method: "DELETE",
        });
        const context = { params: { id: "999" } };
        try {
          const response = await DELETE(request, context);
          expect(response.status).toBe(404);
        } catch (error) {
          if (error instanceof ApiError) {
            expect(error.statusCode).toBe(404);
          } else {
            throw error;
          }
        }
      });

      it("should not allow deleting other user's project", async () => {
        // Mock different user
        (auth as any).mockResolvedValueOnce({
          user: { email: "other@example.com" }
        });

        const request = new Request("http://localhost/api/projects/1", {
          method: "DELETE",
        });
        const context = { params: { id: "1" } };
        try {
          const response = await DELETE(request, context);
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

    describe("PATCH /api/projects/[id]", () => {
      it("should require authentication", async () => {
        (auth as any).mockResolvedValue(null);
        const request = new Request("http://localhost/api/projects/2", {
          method: "PATCH",
        });
        const context = { params: { id: "2" } };
        try {
          const response = await PATCH(request, context);
          expect(response.status).toBe(401);
        } catch (error) {
          if (error instanceof ApiError) {
            expect(error.statusCode).toBe(401);
          } else {
            throw error;
          }
        }
      });

      it("should restore a deleted project", async () => {
        const request = new Request("http://localhost/api/projects/2", {
          method: "PATCH",
        });
        const context = { params: { id: "2" } };
        const response = await PATCH(request, context);
        expect(response.status).toBe(200);

        // Verify through GET API
        const listResponse = await GET_LIST(new Request("http://localhost/api/projects"));
        const projects = (await listResponse.json()) as (ProjectWithStatus & { deleted: number })[];
        expect(projects.length).toBe(2); // Both projects are now active
        const restored = projects.find((p) => p.id === "2");
        expect(restored?.deleted).toBe(0);
      });

      it("should return 404 for non-existent project", async () => {
        const request = new Request("http://localhost/api/projects/999", {
          method: "PATCH",
        });
        const context = { params: { id: "999" } };
        try {
          const response = await PATCH(request, context);
          expect(response.status).toBe(404);
        } catch (error) {
          if (error instanceof ApiError) {
            expect(error.statusCode).toBe(404);
          } else {
            throw error;
          }
        }
      });

      it("should return 400 for non-deleted project", async () => {
        const request = new Request("http://localhost/api/projects/1", {
          method: "PATCH",
        });
        const context = { params: { id: "1" } };
        try {
          const response = await PATCH(request, context);
          expect(response.status).toBe(400);
        } catch (error) {
          if (error instanceof ApiError) {
            expect(error.statusCode).toBe(400);
          } else {
            throw error;
          }
        }
      });

      it("should not allow restoring other user's project", async () => {
        // Mock different user
        (auth as any).mockResolvedValueOnce({
          user: { email: "other@example.com" }
        });

        const request = new Request("http://localhost/api/projects/2", {
          method: "PATCH",
        });
        const context = { params: { id: "2" } };
        try {
          const response = await PATCH(request, context);
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
});
