import { POST } from "@/app/api/projects/status/route";
import { getDB } from "@/db";
import { describe, expect, it } from "vitest";

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
  function createRequest(body: any) {
    return new Request("http://localhost/api/projects/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  }

  it("should update existing project by id", async () => {
    const req = createRequest({
      id: "test-project-1",
      status: "operational",
      message: "All systems operational",
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    const data = (await response.json()) as SuccessResponse;
    expect(data).toEqual({ success: true });

    // Verify status was updated
    const db = await getDB();
    const result = await db
      .prepare(
        `SELECT status, message FROM status_history
         WHERE project_id = ?
         ORDER BY created_at DESC
         LIMIT 1`
      )
      .bind("test-project-1")
      .first();
    expect(result).toMatchObject({
      status: "operational",
      message: "All systems operational",
    });
  });

  it("should update existing project by name", async () => {
    const req = createRequest({
      name: "Test Project",
      status: "degraded",
      message: "Performance issues",
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    const data = (await response.json()) as SuccessResponse;
    expect(data).toEqual({ success: true, projectId: "test-project-1" });

    // Verify status was updated
    const db = await getDB();
    const result = await db
      .prepare(
        `SELECT status, message FROM status_history
         WHERE project_id = ?
         ORDER BY created_at DESC
         LIMIT 1`
      )
      .bind("test-project-1")
      .first();
    expect(result).toMatchObject({
      status: "degraded",
      message: "Performance issues",
    });
  });

  it("should create new project when updating by non-existing name", async () => {
    const req = createRequest({
      name: "New Project",
      status: "maintenance",
      message: "Scheduled maintenance",
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    const data = (await response.json()) as SuccessResponse;
    expect(data).toHaveProperty("success", true);
    expect(data).toHaveProperty("projectId");

    // Verify project was created
    const db = await getDB();
    const project = await db.prepare("SELECT name FROM projects WHERE id = ?").bind(data.projectId).first();
    expect(project).toMatchObject({ name: "New Project" });

    // Verify status was set
    const status = await db
      .prepare(
        `SELECT status, message FROM status_history
         WHERE project_id = ?
         ORDER BY created_at DESC
         LIMIT 1`
      )
      .bind(data.projectId)
      .first();
    expect(status).toMatchObject({
      status: "maintenance",
      message: "Scheduled maintenance",
    });
  });

  it("should use id when both id and name are provided", async () => {
    const req = createRequest({
      id: "test-project-1",
      name: "Different Name",
      status: "outage",
      message: "System down",
    });

    const response = await POST(req);
    expect(response.status).toBe(200);
    const data = (await response.json()) as SuccessResponse;
    expect(data).toEqual({ success: true });

    // Verify status was updated for the correct project
    const db = await getDB();
    const result = await db
      .prepare(
        `SELECT p.name, sh.status, sh.message
         FROM projects p
         JOIN status_history sh ON p.id = sh.project_id
         WHERE p.id = ?
         ORDER BY sh.created_at DESC
         LIMIT 1`
      )
      .bind("test-project-1")
      .first();
    expect(result).toMatchObject({
      name: "Test Project", // Name should not change
      status: "outage",
      message: "System down",
    });
  });

  describe("Error cases", () => {
    it("should return 400 when neither id nor name is provided", async () => {
      const req = createRequest({
        status: "operational",
      });

      const response = await POST(req);
      expect(response.status).toBe(400);
      const data = (await response.json()) as ErrorResponse;
      expect(data.error.message).toBe("Either id or name must be provided");
    });

    it("should return 400 for invalid status value", async () => {
      const req = createRequest({
        id: "test-project-1",
        status: "invalid-status",
      });

      const response = await POST(req);
      expect(response.status).toBe(400);
      const data = (await response.json()) as ErrorResponse;
      expect(data.error.message).toMatch(/Status must be one of:/);
    });

    it("should return 400 for invalid message type", async () => {
      const req = createRequest({
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
      const req = createRequest({
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
