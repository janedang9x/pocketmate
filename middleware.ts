import { NextResponse, type NextRequest } from "next/server";

import { accessTokenCookieOptions, refreshTokenCookieOptions } from "@/lib/auth-session";
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
  const shouldRedirectRootToDashboard = pathname === "/";
  const redirectToLogin = () => {
    const loginUrl = new URL("/auth/login", req.url);
    const redirectPath = pathname === "/" ? "/dashboard" : pathname;
    loginUrl.searchParams.set("redirect", redirectPath);
    return NextResponse.redirect(loginUrl);
  };

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
  const refreshToken = req.cookies.get("pm_refresh_token")?.value;

  const tryRefreshSession = async () => {
    if (!refreshToken) return null;

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken ?? "",
      refresh_token: refreshToken,
    });

    if (error || !data.session?.access_token || !data.session.refresh_token) {
      return null;
    }

    return data.session;
  };

  // If no access token, try refresh with refresh token before redirecting.
  if (!accessToken) {
    try {
      const refreshedSession = await tryRefreshSession();
      if (!refreshedSession) {
        return redirectToLogin();
      }

      const response = shouldRedirectRootToDashboard
        ? NextResponse.redirect(new URL("/dashboard", req.url))
        : NextResponse.next();
      response.cookies.set(
        "pm_access_token",
        refreshedSession.access_token,
        accessTokenCookieOptions,
      );
      response.cookies.set(
        "pm_refresh_token",
        refreshedSession.refresh_token,
        refreshTokenCookieOptions,
      );
      return response;
    } catch (error) {
      console.error("Middleware session refresh error:", error);
      return redirectToLogin();
    }
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
      const refreshedSession = await tryRefreshSession();
      if (!refreshedSession) {
        return redirectToLogin();
      }

      const response = shouldRedirectRootToDashboard
        ? NextResponse.redirect(new URL("/dashboard", req.url))
        : NextResponse.next();
      response.cookies.set(
        "pm_access_token",
        refreshedSession.access_token,
        accessTokenCookieOptions,
      );
      response.cookies.set(
        "pm_refresh_token",
        refreshedSession.refresh_token,
        refreshTokenCookieOptions,
      );
      return response;
    }

    // User is authenticated, allow request to proceed
    if (shouldRedirectRootToDashboard) {
      // FR-AUTH-002: redirect authenticated users to dashboard
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  } catch (error) {
    // On auth errors, attempt refresh before redirecting.
    console.error("Middleware auth check error:", error);
    try {
      const refreshedSession = await tryRefreshSession();
      if (!refreshedSession) {
        return redirectToLogin();
      }

      const response = shouldRedirectRootToDashboard
        ? NextResponse.redirect(new URL("/dashboard", req.url))
        : NextResponse.next();
      response.cookies.set(
        "pm_access_token",
        refreshedSession.access_token,
        accessTokenCookieOptions,
      );
      response.cookies.set(
        "pm_refresh_token",
        refreshedSession.refresh_token,
        refreshTokenCookieOptions,
      );
      return response;
    } catch (refreshError) {
      console.error("Middleware refresh fallback error:", refreshError);
      return redirectToLogin();
    }
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
