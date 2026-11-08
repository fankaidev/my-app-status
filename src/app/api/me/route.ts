import { checkAccessJwt } from "@/lib/access";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "edge";

// Returns the user identified by Cloudflare Access. Used by the UI to show who is logged in.
// On failure the response includes a fixed reason code (never token contents) to make misconfiguration visible.
export async function GET() {
  const { user, reason } = await checkAccessJwt((await headers()).get("Cf-Access-Jwt-Assertion"));
  if (!user) {
    return NextResponse.json(
      { error: { message: "Authentication required", code: "UNAUTHORIZED", reason } },
      { status: 401 }
    );
  }
  return NextResponse.json({ email: user.email });
}
