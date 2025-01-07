import type { Project, ServiceStatus } from "@/types/db";
import { http, HttpResponse } from "msw";

// Mock data
const mockProjects: Project[] = [
  {
    id: "test-project-1",
    name: "Test Project 1",
    created_at: Date.now(),
    updated_at: Date.now(),
  },
];

export const handlers = [
  // GET /api/projects
  http.get("http://localhost/api/projects", () => {
    return HttpResponse.json(mockProjects);
  }),

  // POST /api/projects/:id/status
  http.post("http://localhost/api/projects/:id/status", async ({ params, request }) => {
    const { id } = params;
    const body = await request.json();
    const { status, message } = body as { status: ServiceStatus; message?: string };

    const project = mockProjects.find((p) => p.id === id);
    if (!project) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json({ success: true });
  }),
];
