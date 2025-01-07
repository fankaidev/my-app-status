import { auth } from "@/auth";
import { deleteProject, getDB, getProject, restoreProject } from "@/db";
import { ApiError } from "@/lib/api-error";
import { NextResponse } from "next/server";

export const runtime = "edge";

interface RouteContext {
  params: { id: string };
}

// GET /api/projects/[id]
export async function GET(request: Request, context: RouteContext) {
  const { id } = context.params;

  try {
    const db = await getDB();
    const project = await getProject(db, id);
    if (!project) {
      return NextResponse.json({ error: { message: "Project not found" } }, { status: 404 });
    }

    return Response.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    if (error instanceof ApiError) {
      return NextResponse.json({ error: { message: error.message } }, { status: error.statusCode });
    }
    return NextResponse.json({ error: { message: "Failed to fetch project" } }, { status: 400 });
  }
}

// DELETE /api/projects/[id]
export async function DELETE(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: { message: "Authentication required" } }, { status: 401 });
  }

  const { id } = context.params;

  try {
    const db = await getDB();
    await deleteProject(db, id);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    if (error instanceof ApiError) {
      return NextResponse.json({ error: { message: error.message } }, { status: error.statusCode });
    }
    return NextResponse.json({ error: { message: "Failed to delete project" } }, { status: 400 });
  }
}

// PATCH /api/projects/[id] - Restore deleted project
export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: { message: "Authentication required" } }, { status: 401 });
  }

  const { id } = context.params;

  try {
    const db = await getDB();
    await restoreProject(db, id);
    return Response.json({ success: true });
  } catch (error) {
    console.error("Error restoring project:", error);
    if (error instanceof ApiError) {
      return NextResponse.json({ error: { message: error.message } }, { status: error.statusCode });
    }
    return NextResponse.json({ error: { message: "Failed to restore project" } }, { status: 400 });
  }
}
