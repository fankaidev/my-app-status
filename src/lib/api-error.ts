import { ServiceStatus } from "@/types/db";
import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(message: string, public statusCode: number = 500, public code: string = "INTERNAL_SERVER_ERROR") {
    super(message);
    this.name = "ApiError";
  }
}

export function handleApiError(error: unknown) {
  console.error("API Error:", error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.code,
        },
      },
      { status: error.statusCode }
    );
  }

  return NextResponse.json(
    {
      error: {
        message: "An unexpected error occurred",
        code: "INTERNAL_SERVER_ERROR",
      },
    },
    { status: 500 }
  );
}

export const ApiErrors = {
  BadRequest: (message = "Bad Request") => new ApiError(message, 400, "BAD_REQUEST"),
  Unauthorized: () => new ApiError("Authentication required", 401, "UNAUTHORIZED"),
  NotFound: (type = "Resource") => new ApiError(`${type} not found`, 404, "NOT_FOUND"),
  Forbidden: (message = "Access denied") => new ApiError(message, 403, "FORBIDDEN"),
};

export const ValidServiceStatus = ["operational", "degraded", "major_outage", "maintenance", "unknown"] as const;

export function validateServiceStatus(status: string): status is ServiceStatus {
  return ValidServiceStatus.includes(status as ServiceStatus);
}
