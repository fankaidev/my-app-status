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
});
