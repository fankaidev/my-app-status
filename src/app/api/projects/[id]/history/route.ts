import { auth } from "@/auth";
import { getDB, getProject, getProjectStatusHistory } from "@/db";
import { ApiError, ApiErrors } from "@/lib/api-error";

export const runtime = "edge";

interface RouteContext {
  params: { id: string };
}

// GET /api/projects/[id]/history
export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      throw ApiErrors.Unauthorized();
    }

    const { id } = context.params;
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "20");

    const db = await getDB();

    // Check project ownership
    const project = await getProject(db, id, { owner_id: session.user.email });
    if (!project) {
      throw ApiErrors.NotFound("Project");
    }

    // Get status history
    const history = await getProjectStatusHistory(db, id, limit);

    return Response.json({ history });
  } catch (error) {
    console.error("Error fetching project history:", error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw ApiErrors.BadRequest("Failed to fetch project history");
  }
}
