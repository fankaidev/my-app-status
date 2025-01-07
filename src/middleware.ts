import { auth } from "@/auth";
import { ApiErrors, handleApiError } from "@/lib/api-error";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// List of public routes that don't require authentication
const publicRoutes = [
  "/", // Home page is public but will show login prompt for projects
  "/api/auth/signin",
  "/api/auth/signout",
  "/api/auth/session",
  "/api/auth/csrf",
  "/api/auth/providers",
  "/api/auth/callback",
  "/api/auth/error",
  "/api/projects", // Public GET endpoint
  "/api/projects/status", // Public status update endpoint
];

export async function middleware(request: NextRequest) {
  try {
    // Check if the route is public
    const isPublicRoute = publicRoutes.some((route) => {
      if (route.includes("*")) {
        const pattern = new RegExp("^" + route.replace("*", "[^/]+") + "$");
        return pattern.test(request.nextUrl.pathname);
      }
      return request.nextUrl.pathname === route;
    });

    if (isPublicRoute) {
      return NextResponse.next();
    }

    // Check authentication
    const session = await auth();
    if (!session) {
      // API routes return 401
      if (request.nextUrl.pathname.startsWith("/api/")) {
        throw ApiErrors.Unauthorized();
      }

      // Other routes redirect to signin
      return NextResponse.redirect(new URL("/api/auth/signin", request.url));
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
    // Exclude public routes and static assets
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
