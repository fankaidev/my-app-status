import { getDB, getProjects } from "@/db";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const db = await getDB();
    const projects = await getProjects(db);
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Failed to get projects:", error);
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
