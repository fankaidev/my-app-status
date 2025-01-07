import { auth } from '@/auth'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// List of public routes that don't require authentication
const publicRoutes = [
    '/',  // Home page is public but will show login prompt for projects
    '/api/auth/signin',
    '/api/auth/signout',
    '/api/auth/session',
    '/api/auth/csrf',
    '/api/auth/providers',
    '/api/auth/callback',
    '/api/auth/error',
]

export async function middleware(request: NextRequest) {
    // Check if the route is public
    const isPublicRoute = publicRoutes.some(route =>
        request.nextUrl.pathname === route ||
        request.nextUrl.pathname.startsWith('/api/auth/')
    )

    if (isPublicRoute) {
        return NextResponse.next()
    }

    // Check authentication
    const session = await auth()
    if (!session) {
        // API routes return 401
        if (request.nextUrl.pathname.startsWith('/api/')) {
            return new NextResponse(
                JSON.stringify({ error: 'Authentication required' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            )
        }

        // Other routes redirect to signin
        return NextResponse.redirect(new URL('/api/auth/signin', request.url))
    }

    return NextResponse.next()
}

// Configure which routes to run middleware on
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    ],
}