import { GET as GET_PROJECT } from "@/app/api/projects/[id]/route";
import { POST } from "@/app/api/projects/status/route";
import { auth } from "@/auth";
import { setTestDb } from "@/db";
import { ApiError } from "@/lib/api-error";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanDb, createTestDb, seedTestData } from "../utils/test-db";

// Mock auth with a valid session
vi.mock("@/auth", () => ({
  auth: vi.fn(() =>
    Promise.resolve({
      user: { email: "test@example.com" },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
  ),
}));

interface SuccessResponse {
  success: true;
  projectId?: string;
}

interface ErrorResponse {
  error: {
    message: string;
  };
}

describe("Project Status API", () => {
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

  // Helper function to create request
  function createUpdateStatusRequest(body: any) {
    return new Request("http://localhost/api/projects/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  }

  it("should update existing project by id", async () => {
    const req = createUpdateStatusRequest({
      id: "1", // Use seeded project id
      status: "operational",
      message: "All systems operational",
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    const data = (await response.json()) as SuccessResponse;
    expect(data).toEqual({ success: true, projectId: "1" });

    // Verify through GET API
    const getResponse = await GET_PROJECT(new Request("http://localhost/api/projects/1"), {
      params: { id: "1" },
    });
    expect(getResponse.status).toBe(200);
    const project = await getResponse.json();
    expect(project).toMatchObject({
      id: "1",
      name: "Active Project",
      owner_id: "test@example.com",
      status: "operational",
      message: "All systems operational",
    });
  });

  it("should update existing project by name", async () => {
    const req = createUpdateStatusRequest({
      name: "Active Project",
      status: "degraded",
      message: "Performance issues",
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    const data = (await response.json()) as SuccessResponse;
    expect(data).toEqual({ success: true, projectId: "1" });

    // Verify through GET API
    const getResponse = await GET_PROJECT(new Request("http://localhost/api/projects/1"), {
      params: { id: "1" },
    });
    expect(getResponse.status).toBe(200);
    const project = await getResponse.json();
    expect(project).toMatchObject({
      id: "1",
      name: "Active Project",
      owner_id: "test@example.com",
      status: "degraded",
      message: "Performance issues",
    });
  });

  it("should create new project when updating by non-existing name", async () => {
    const req = createUpdateStatusRequest({
      name: "New Project",
      status: "maintenance",
      message: "Scheduled maintenance",
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    const data = (await response.json()) as SuccessResponse;
    expect(data).toHaveProperty("success", true);

    // Verify through GET API
    const getResponse = await GET_PROJECT(new Request(`http://localhost/api/projects/${data.projectId}`), {
      params: { id: data.projectId! },
    });
    expect(getResponse.status).toBe(200);
    const project = await getResponse.json();
    expect(project).toMatchObject({
      id: data.projectId,
      name: "New Project",
      owner_id: "test@example.com",
      status: "maintenance",
      message: "Scheduled maintenance",
    });
  });

  it("should use id when both id and name are provided", async () => {
    const req = createUpdateStatusRequest({
      id: "1",
      name: "Different Name",
      status: "outage",
      message: "System down",
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    const data = (await response.json()) as SuccessResponse;
    expect(data).toEqual({ success: true, projectId: "1" });

    // Verify through GET API
    const getResponse = await GET_PROJECT(new Request("http://localhost/api/projects/1"), {
      params: { id: "1" },
    });
    expect(getResponse.status).toBe(200);
    const project = await getResponse.json();
    expect(project).toMatchObject({
      id: "1",
      name: "Active Project", // Name should not change
      owner_id: "test@example.com",
      status: "outage",
      message: "System down",
    });
  });

  describe("Error cases", () => {
    it("should return 400 when neither id nor name is provided", async () => {
      const req = createUpdateStatusRequest({
        status: "operational",
      });
      try {
        await POST(req);
      } catch (error) {
        if (error instanceof ApiError) {
          expect(error.statusCode).toBe(400);
        } else {
          throw error;
        }
      }
    });

    it("should return 400 for invalid status value", async () => {
      const req = createUpdateStatusRequest({
        id: "1",
        status: "invalid-status",
      });

      try {
        await POST(req);
      } catch (error) {
        if (error instanceof ApiError) {
          expect(error.statusCode).toBe(400);
        } else {
          throw error;
        }
      }
    });

    it("should return 400 for invalid message type", async () => {
      const req = createUpdateStatusRequest({
        id: "1",
        status: "operational",
        message: 123, // Should be string
      });

      try {
        await POST(req);
      } catch (error) {
        if (error instanceof ApiError) {
          expect(error.statusCode).toBe(400);
        } else {
          throw error;
        }
      }
    });

    it("should return 404 for non-existent project id", async () => {
      const req = createUpdateStatusRequest({
        id: "non-existent",
        status: "operational",
      });

      try {
        await POST(req);
      } catch (error) {
        if (error instanceof ApiError) {
          expect(error.statusCode).toBe(404);
        } else {
          throw error;
        }
      }
    });

    it("should return 401 when not authenticated", async () => {
      // Mock auth to return no session
      vi.mocked(auth).mockResolvedValueOnce(undefined);

      const req = createUpdateStatusRequest({
        id: "1",
        status: "operational",
      });

      try {
        await POST(req);
      } catch (error) {
        if (error instanceof ApiError) {
          expect(error.statusCode).toBe(401);
        } else {
          throw error;
        }
      }
    });

    it("should return 401 when trying to update another user's project", async () => {
      // Mock auth to return a different user
      vi.mocked(auth).mockResolvedValueOnce({
        user: { email: "other@example.com" },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      const req = createUpdateStatusRequest({
        id: "1",
        status: "operational",
      });

      try {
        await POST(req);
      } catch (error) {
        if (error instanceof ApiError) {
          expect(error.statusCode).toBe(401);
        } else {
          throw error;
        }
      }
    });

    it("should return 401 when trying to update another user's project by name", async () => {
      // Mock auth to return a different user
      vi.mocked(auth).mockResolvedValueOnce({
        user: { email: "other@example.com" },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      const req = createUpdateStatusRequest({
        name: "Active Project",
        status: "operational",
      });

      try {
        await POST(req);
      } catch (error) {
        if (error instanceof ApiError) {
          expect(error.statusCode).toBe(401);
        } else {
          throw error;
        }
      }
    });
  });
});
