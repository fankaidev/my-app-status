import { getDB, updateProjectStatus } from "@/db";
import { ApiError, ApiErrors } from "@/lib/api-error";
import { ServiceStatus } from "@/types/db";
import { NextResponse } from "next/server";

export const runtime = "edge";

// Valid status values
const VALID_STATUSES: ServiceStatus[] = ["operational", "degraded", "outage", "maintenance", "unknown"];

// Validate request body
function validateBody(body: unknown): { status: ServiceStatus; message?: string } {
  if (!body || typeof body !== "object") {
    throw ApiErrors.BadRequest("Request body is required");
  }

  const { status, message } = body as { status?: unknown; message?: unknown };

  if (!status || typeof status !== "string") {
    throw ApiErrors.BadRequest("Status is required and must be a string");
  }

  if (!VALID_STATUSES.includes(status as ServiceStatus)) {
    throw ApiErrors.BadRequest(`Status must be one of: ${VALID_STATUSES.join(", ")}`);
  }

  if (message !== undefined && typeof message !== "string") {
    throw ApiErrors.BadRequest("Message must be a string");
  }

  return { status: status as ServiceStatus, message };
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { status, message } = validateBody(body);
    const db = await getDB();

    await updateProjectStatus(db, params.id, status, message);

    return NextResponse.json({ success: true });
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
