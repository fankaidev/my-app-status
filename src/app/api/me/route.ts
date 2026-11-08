import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const runtime = "edge";

// Returns the user identified by Cloudflare Access. Used by the UI to show who is logged in.
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: { message: "Authentication required", code: "UNAUTHORIZED" } }, { status: 401 });
  }
  return NextResponse.json({ email: session.user.email });
}
