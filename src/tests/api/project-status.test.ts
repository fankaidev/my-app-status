import { GET as GET_PROJECT } from "@/app/api/projects/[id]/route";
import { POST } from "@/app/api/projects/status/route";
import { describe, expect, it, vi } from "vitest";

// Mock auth
vi.mock("@/auth", () => ({
  auth: vi.fn(),
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
      id: "test-project-1",
      status: "operational",
      message: "All systems operational",
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    const data = (await response.json()) as SuccessResponse;
    expect(data).toEqual({ success: true });

    // Verify through GET API
    const getResponse = await GET_PROJECT(new Request(`http://localhost/api/projects/test-project-1`), {
      params: { id: "test-project-1" },
    });
    expect(getResponse.status).toBe(200);
    const project = await getResponse.json();
    expect(project).toMatchObject({
      id: "test-project-1",
      status: "operational",
      message: "All systems operational",
    });
  });

  it("should update existing project by name", async () => {
    const req = createUpdateStatusRequest({
      name: "Test Project",
      status: "degraded",
      message: "Performance issues",
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    const data = (await response.json()) as SuccessResponse;
    expect(data).toEqual({ success: true, projectId: "test-project-1" });

    // Verify through GET API
    const getResponse = await GET_PROJECT(new Request(`http://localhost/api/projects/test-project-1`), {
      params: { id: "test-project-1" },
    });
    expect(getResponse.status).toBe(200);
    const project = await getResponse.json();
    expect(project).toMatchObject({
      id: "test-project-1",
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
    expect(data).toHaveProperty("projectId");

    // Verify through GET API
    const getResponse = await GET_PROJECT(new Request(`http://localhost/api/projects/${data.projectId}`), {
      params: { id: data.projectId! },
    });
    expect(getResponse.status).toBe(200);
    const project = await getResponse.json();
    expect(project).toMatchObject({
      id: data.projectId,
      name: "New Project",
      status: "maintenance",
      message: "Scheduled maintenance",
    });
  });

  it("should use id when both id and name are provided", async () => {
    const req = createUpdateStatusRequest({
      id: "test-project-1",
      name: "Different Name",
      status: "outage",
      message: "System down",
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    const data = (await response.json()) as SuccessResponse;
    expect(data).toEqual({ success: true });

    // Verify through GET API
    const getResponse = await GET_PROJECT(new Request(`http://localhost/api/projects/test-project-1`), {
      params: { id: "test-project-1" },
    });
    expect(getResponse.status).toBe(200);
    const project = await getResponse.json();
    expect(project).toMatchObject({
      id: "test-project-1",
      name: "Test Project", // Name should not change
      status: "outage",
      message: "System down",
    });
  });

  describe("Error cases", () => {
    it("should return 400 when neither id nor name is provided", async () => {
      const req = createUpdateStatusRequest({
        status: "operational",
      });

      const response = await POST(req);
      expect(response.status).toBe(400);
      const data = (await response.json()) as ErrorResponse;
      expect(data.error.message).toBe("Either id or name must be provided");
    });

    it("should return 400 for invalid status value", async () => {
      const req = createUpdateStatusRequest({
        id: "test-project-1",
        status: "invalid-status",
      });

      const response = await POST(req);
      expect(response.status).toBe(400);
      const data = (await response.json()) as ErrorResponse;
      expect(data.error.message).toMatch(/Status must be one of:/);
    });

    it("should return 400 for invalid message type", async () => {
      const req = createUpdateStatusRequest({
        id: "test-project-1",
        status: "operational",
        message: 123, // Should be string
      });

      const response = await POST(req);
      expect(response.status).toBe(400);
      const data = (await response.json()) as ErrorResponse;
      expect(data.error.message).toBe("Message must be a string");
    });

    it("should return 404 for non-existent project id", async () => {
      const req = createUpdateStatusRequest({
        id: "non-existent",
        status: "operational",
      });

      const response = await POST(req);
      expect(response.status).toBe(404);
      const data = (await response.json()) as ErrorResponse;
      expect(data.error.message).toBe("Project not found");
    });
  });
});
