import { POST } from "@/app/api/projects/[id]/status/route";
import { GET } from "@/app/api/projects/route";
import type { Project } from "@/types/db";
import { describe, expect, it } from "vitest";

describe("Projects API", () => {
  it("should list projects", async () => {
    const req = new Request("http://localhost/api/projects");
    const response = await GET(req);
    const data = (await response.json()) as Project[];

    expect(response.status).toBe(200);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(1);
    expect(data[0]).toHaveProperty("id");
    expect(data[0]).toHaveProperty("name");
  });

  it("should update project status", async () => {
    const req = new Request("http://localhost/api/projects/test-project-1/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "operational",
        message: "All systems operational",
      }),
    });

    const response = await POST(req, { params: { id: "test-project-1" } } as any);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ success: true });
  });

  it("should return 404 for non-existent project", async () => {
    const req = new Request("http://localhost/api/projects/non-existent/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "operational",
        message: "All systems operational",
      }),
    });

    const response = await POST(req, { params: { id: "non-existent" } } as any);
    expect(response.status).toBe(404);
  });
});
