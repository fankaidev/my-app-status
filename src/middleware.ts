import { getAccessUser } from "@/lib/access";
import { ApiErrors, handleApiError } from "@/lib/api-error";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Routes that do their own authentication (or none at all).
// Login itself is handled by Cloudflare Access in front of the app.
const publicRoutes = [
  "/", // Home page; the project list is loaded through the protected API
  "/api/projects", // Handler checks the Access user itself
  "/api/projects/status", // Accepts API tokens (Bearer) for reporting, bypasses Access
];

export async function middleware(request: NextRequest) {
  try {
    const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname);
    if (isPublicRoute) {
      return NextResponse.next();
    }

    const user = await getAccessUser(request.headers);
    if (!user) {
      if (request.nextUrl.pathname.startsWith("/api/")) {
        throw ApiErrors.Unauthorized();
      }
      return new NextResponse("Unauthorized", { status: 401 });
    }

    return NextResponse.next();
  } catch (error) {
    // Only handle errors for API routes
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return handleApiError(error);
    }
    throw error;
  }
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    // Admin routes need authentication
    "/admin/:path*",
    // Protected API routes
    "/api/projects/:path*",
    // Exclude static assets
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
