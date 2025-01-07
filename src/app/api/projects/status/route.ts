import { getDB, updateProjectStatus, updateProjectStatusByName } from "@/db";
import { ApiError, ApiErrors } from "@/lib/api-error";
import { ServiceStatus } from "@/types/db";
import { NextResponse } from "next/server";

export const runtime = "edge";

// Valid status values
const VALID_STATUSES: ServiceStatus[] = ["operational", "degraded", "outage", "maintenance", "unknown"];

// Validate request body
function validateBody(body: unknown): { id?: string; name?: string; status: ServiceStatus; message?: string } {
  if (!body || typeof body !== "object") {
    throw ApiErrors.BadRequest("Request body is required");
  }

  const { id, name, status, message } = body as { id?: unknown; name?: unknown; status?: unknown; message?: unknown };

  // At least one of id or name must be provided
  if (!id && !name) {
    throw ApiErrors.BadRequest("Either id or name must be provided");
  }

  // Validate id if provided
  if (id !== undefined && typeof id !== "string") {
    throw ApiErrors.BadRequest("Id must be a string");
  }

  // Validate name if provided
  if (name !== undefined && typeof name !== "string") {
    throw ApiErrors.BadRequest("Name must be a string");
  }

  // Validate status
  if (!status || typeof status !== "string") {
    throw ApiErrors.BadRequest("Status is required and must be a string");
  }

  if (!VALID_STATUSES.includes(status as ServiceStatus)) {
    throw ApiErrors.BadRequest(`Status must be one of: ${VALID_STATUSES.join(", ")}`);
  }

  // Validate message if provided
  if (message !== undefined && typeof message !== "string") {
    throw ApiErrors.BadRequest("Message must be a string");
  }

  return { id, name, status: status as ServiceStatus, message };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, status, message } = validateBody(body);
    const db = await getDB();

    // If id is provided, use it to update status
    if (id) {
      await updateProjectStatus(db, id, status, message);
      return NextResponse.json({ success: true });
    }

    // Otherwise, use name to update status (will create project if not exists)
    const projectId = await updateProjectStatusByName(db, name!, status, message);
    return NextResponse.json({ success: true, projectId });
  } catch (error) {
    console.error("Failed to update project status:", error);
    if (error instanceof ApiError) {
      return NextResponse.json({ error: { message: error.message } }, { status: error.statusCode });
    }
    if (error instanceof Error && error.message === "Project not found") {
      return NextResponse.json({ error: { message: "Project not found" } }, { status: 404 });
    }
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
