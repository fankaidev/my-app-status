import { auth } from "@/auth";
import { deleteProject, getDB, getProject, restoreProject } from "@/db";
import { ApiError, ApiErrors } from "@/lib/api-error";

export const runtime = "edge";

interface RouteContext {
  params: { id: string };
}

// GET /api/projects/[id]
export async function GET(request: Request, context: RouteContext) {
  const { id } = context.params;

  try {
    const session = await auth();
    if (!session?.user?.email) {
      throw ApiErrors.Unauthorized();
    }

    const db = await getDB();
    const project = await getProject(db, id, { owner_id: session.user.email });
    if (!project) {
      throw ApiErrors.NotFound("Project");
    }

    return Response.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw ApiErrors.BadRequest("Failed to fetch project");
  }
}

// DELETE /api/projects/[id]
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      throw ApiErrors.Unauthorized();
    }

    const { id } = context.params;
    const db = await getDB();

    // Check ownership before deletion
    const project = await getProject(db, id, { owner_id: session.user.email });
    if (!project) {
      throw ApiErrors.NotFound("Project");
    }

    await deleteProject(db, id);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw ApiErrors.BadRequest("Failed to delete project");
  }
}

// PATCH /api/projects/[id] - Restore deleted project
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      throw ApiErrors.Unauthorized();
    }

    const { id } = context.params;
    const db = await getDB();

    // Check ownership before restoration
    const project = await getProject(db, id, { owner_id: session.user.email });
    if (!project) {
      throw ApiErrors.NotFound("Project");
    }

    await restoreProject(db, id);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error restoring project:", error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw ApiErrors.BadRequest("Failed to restore project");
  }
}
