import type { Project } from "@/types/db";
import { describe, expect, it } from "vitest";

describe("Projects API", () => {
  it("should list projects", async () => {
    const response = await fetch("http://localhost/api/projects");
    const data = (await response.json()) as Project[];

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
    expect(data[0]).toHaveProperty("id");
    expect(data[0]).toHaveProperty("name");
  });

  it("should update project status", async () => {
    const response = await fetch("http://localhost/api/projects/test-project-1/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "operational",
        message: "All systems operational",
      }),
    });

    expect(response.status).toBe(200);
    const data = (await response.json()) as { success: boolean };
    expect(data).toEqual({ success: true });
  });

  it("should return 404 for non-existent project", async () => {
    const response = await fetch("http://localhost/api/projects/non-existent/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "operational",
        message: "All systems operational",
      }),
    });

    expect(response.status).toBe(404);
  });
});
