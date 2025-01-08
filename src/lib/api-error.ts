import { ServiceStatus } from "@/types/db";
import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
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
        },
      },
      { status: error.status }
    );
  }

  return NextResponse.json(
    {
      error: {
        message: "An unexpected error occurred",
      },
    },
    { status: 500 }
  );
}

export const ApiErrors = {
  BadRequest: (message = "Bad Request") => new ApiError(400, message),
  Unauthorized: (message = "Unauthorized") => new ApiError(401, message),
  NotFound: (type = "Resource") => new ApiError(404, `${type} not found`),
  Forbidden: (message = "Access denied") => new ApiError(403, message),
};

export const ValidServiceStatus = ["operational", "degraded", "outage", "maintenance", "unknown"] as const;

export function validateServiceStatus(status: string): status is ServiceStatus {
  return ValidServiceStatus.includes(status as ServiceStatus);
}
