import { auth } from "@/auth";
import { createProject, getDB, getProject, getProjects } from "@/db";
import { ApiError, ApiErrors } from "@/lib/api-error";

export const runtime = "edge";

interface CreateProjectRequest {
  name: string;
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      throw ApiErrors.Unauthorized();
    }

    const url = new URL(request.url);
    const includeDeleted = url.searchParams.get("include_deleted") === "true";
    const db = await getDB();

    // Only return projects owned by the current user
    const projects = await getProjects(db, {
      includeDeleted,
      owner_id: session.user.email
    });

    return Response.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw ApiErrors.BadRequest("Failed to fetch projects");
  }
}

// Add POST endpoint for creating projects
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      throw ApiErrors.Unauthorized();
    }

    const body = await request.json() as CreateProjectRequest;
    if (!body?.name) {
      throw ApiErrors.BadRequest("Project name is required");
    }

    const db = await getDB();
    const id = await createProject(db, body.name, session.user.email);
    const project = await getProject(db, id, { owner_id: session.user.email });
    if (!project) {
      throw ApiErrors.NotFound("Project");
    }

    return Response.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw ApiErrors.BadRequest("Failed to create project");
  }
}
