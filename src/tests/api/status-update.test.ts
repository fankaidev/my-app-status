import type { ServiceStatus } from "@/types/db";
import { describe, expect, it } from "vitest";

describe("Status Update API", () => {
  const updateStatus = async (projectId: string, status: ServiceStatus, message: string) => {
    return fetch(`http://localhost/api/projects/${projectId}/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status, message }),
    });
  };

  it("should successfully update status for existing project", async () => {
    const response = await updateStatus("test-project-1", "operational", "Systems running normally");

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ success: true });
  });

  it("should handle different status types", async () => {
    const statuses: ServiceStatus[] = ["operational", "degraded", "outage", "maintenance", "unknown"];

    for (const status of statuses) {
      const response = await updateStatus("test-project-1", status, `System is ${status}`);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ success: true });
    }
  });

  it("should reject invalid project id", async () => {
    const response = await updateStatus("non-existent-project", "operational", "This should fail");

    expect(response.status).toBe(404);
  });

  it("should handle empty message", async () => {
    const response = await updateStatus("test-project-1", "operational", "");

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ success: true });
  });
});
