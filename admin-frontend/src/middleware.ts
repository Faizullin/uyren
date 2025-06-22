import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Routes that require authentication
const protectedRoutes = ["/dashboard"];

// Routes that should redirect if already authenticated
const authRoutes = ['/sign-in'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if user is authenticated by looking for token in cookies or headers
    // For now, we'll just allow all routes since we're using localStorage
    // In production, you might want to use HTTP-only cookies for tokens

    // If trying to access protected route without auth, redirect to sign-in
    if (protectedRoutes.some(route => pathname.startsWith(route))) {
        // We can't check localStorage in middleware, so we'll handle this client-side
        return NextResponse.next();
    }

    // If trying to access auth routes while authenticated, redirect to demo table
    if (authRoutes.some(route => pathname.startsWith(route))) {
        // We can't check localStorage in middleware, so we'll handle this client-side
        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};

// // Skip Next.js internals and all static files, unless found in search params
// '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',