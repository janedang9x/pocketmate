import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase";

function jsonError(
  status: number,
  error: string,
  code: string,
): NextResponse<{ success: false; error: string; code: string }> {
  return NextResponse.json({ success: false, error, code }, { status });
}

/**
 * End user session and clear authentication cookies.
 * Implements FR-AUTH-003: User Logout
 * @see docs/specifications.md#fr-auth-003-user-logout
 */
export async function POST(req: NextRequest) {
  try {
    // Get access token from cookies or Authorization header
    const accessToken =
      req.cookies.get("pm_access_token")?.value ||
      req.headers.get("Authorization")?.replace("Bearer ", "");

    // If we have a token, attempt to sign out from Supabase
    if (accessToken) {
      const supabase = createSupabaseServerClient({ accessToken });
      await supabase.auth.signOut();
    }

    // Clear authentication cookies
    const response = NextResponse.json(
      {
        success: true,
        message: "Logged out successfully",
      },
      { status: 200 },
    );

    // Clear cookies by setting them with expired dates
    response.cookies.set("pm_access_token", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    response.cookies.set("pm_refresh_token", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("POST /api/auth/logout error:", error);
    // Even if there's an error, clear cookies
    const response = NextResponse.json(
      {
        success: true,
        message: "Logged out successfully",
      },
      { status: 200 },
    );

    response.cookies.set("pm_access_token", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    response.cookies.set("pm_refresh_token", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    return response;
  }
}
