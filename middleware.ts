import { NextResponse, type NextRequest } from "next/server";

import { enforceApiRateLimit } from "@/lib/ratelimit";
import { createSupabaseServerClient } from "@/lib/supabase";

/**
 * Next.js middleware for route protection.
 * Protects all routes except /auth/* and /api/auth/*.
 * Redirects unauthenticated users to login page.
 * Implements Protected Routes Middleware for Sprint 1.3
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/")) {
    const rateLimited = await enforceApiRateLimit(req, pathname);
    if (rateLimited) {
      return rateLimited;
    }
  }

  // Allow public access to auth pages and auth API routes
  if (pathname.startsWith("/auth/") || pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // Allow public access to root page (will redirect to login if needed)
  if (pathname === "/") {
    return NextResponse.next();
  }

  // Allow public access to static files and Next.js internals
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/public/")
  ) {
    return NextResponse.next();
  }

  // Get access token from cookies or Authorization header
  const accessToken =
    req.cookies.get("pm_access_token")?.value ||
    req.headers.get("Authorization")?.replace("Bearer ", "");

  // If no token, redirect to login
  if (!accessToken) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token with Supabase
  try {
    const supabase = createSupabaseServerClient({ accessToken });
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // If token is invalid or user doesn't exist, redirect to login
    if (error || !user) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // User is authenticated, allow request to proceed
    return NextResponse.next();
  } catch (error) {
    // On error, redirect to login
    console.error("Middleware auth check error:", error);
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

// Configure which routes this middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
