import { ApiError, ApiErrors } from "@/lib/api-error";
import { NextResponse } from "next/server";

export const runtime = "edge";

// Valid status values
const VALID_STATUSES = ["operational", "outage", "running", "failed"] as const;
type Status = (typeof VALID_STATUSES)[number];

// Validate request body
function validateBody(body: unknown): { status: Status; message?: string } {
  if (!body || typeof body !== "object") {
    throw ApiErrors.BadRequest("Request body is required");
  }

  const { status, message } = body as { status?: unknown; message?: unknown };

  if (!status || typeof status !== "string") {
    throw ApiErrors.BadRequest("Status is required and must be a string");
  }

  if (!VALID_STATUSES.includes(status as Status)) {
    throw ApiErrors.BadRequest(`Status must be one of: ${VALID_STATUSES.join(", ")}`);
  }

  if (message !== undefined && typeof message !== "string") {
    throw ApiErrors.BadRequest("Message must be a string");
  }

  return { status: status as Status, message };
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { status, message } = validateBody(body);

    // For now, just return success response
    // We'll implement the actual database update in the next task
    return NextResponse.json({
      success: true,
      data: {
        id: params.id,
        status,
        message,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: { message: error.message } }, { status: error.statusCode });
    }
    return NextResponse.json({ error: { message: "An unexpected error occurred" } }, { status: 500 });
  }
}
