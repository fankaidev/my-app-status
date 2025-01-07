import { getDB, getProjects } from "@/db";
import { ApiError, ApiErrors } from "@/lib/api-error";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const includeDeleted = url.searchParams.get("include_deleted") === "true";
    const db = await getDB();
    const projects = await getProjects(db, { includeDeleted });
    return Response.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw ApiErrors.BadRequest("Failed to fetch projects");
  }
}
