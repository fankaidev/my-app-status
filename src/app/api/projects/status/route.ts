import { auth } from "@/auth";
import { getDB, updateProjectStatus, updateProjectStatusByName } from "@/db";
import { ApiError, ApiErrors } from "@/lib/api-error";
import { ServiceStatus } from "@/types/db";

export const runtime = "edge";

interface UpdateStatusRequest {
  id?: string;
  name?: string;
  status: ServiceStatus;
  message?: string;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      throw ApiErrors.Unauthorized();
    }

    const body = await request.json() as UpdateStatusRequest;
    if (!body?.status) {
      throw ApiErrors.BadRequest("Status is required");
    }

    if (!body.id && !body.name) {
      throw ApiErrors.BadRequest("Either project id or name is required");
    }

    const db = await getDB();
    let projectId: string | undefined;

    if (body.id) {
      await updateProjectStatus(db, body.id, body.status, body.message, {
        owner_id: session.user.email,
      });
      projectId = body.id;
    } else if (body.name) {
      projectId = await updateProjectStatusByName(
        db,
        body.name,
        body.status,
        body.message,
        session.user.email
      );
    }

    return Response.json({ success: true, projectId });
  } catch (error) {
    console.error("Error updating project status:", error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw ApiErrors.BadRequest("Failed to update project status");
  }
}
