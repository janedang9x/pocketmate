import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { loginSchema, normalizeUsername, usernameToAuthEmail } from "@/lib/auth";
import { accessTokenCookieOptions, refreshTokenCookieOptions } from "@/lib/auth-session";
import { createSupabaseServerClient } from "@/lib/supabase";

function jsonError(
  status: number,
  error: string,
  code: string,
): NextResponse<{ success: false; error: string; code: string }> {
  return NextResponse.json({ success: false, error, code }, { status });
}

/**
 * Authenticate user and return a session token.
 * Implements FR-AUTH-002: User Login
 * @see docs/specifications.md#fr-auth-002-user-login
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.parse(body);
    const username = normalizeUsername(parsed.username);

    const supabase = createSupabaseServerClient();
    const email = usernameToAuthEmail(username);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: parsed.password,
    });

    if (error) {
      // For security, avoid leaking detailed auth errors.
      return jsonError(401, "Invalid username or password", "UNAUTHORIZED");
    }

    if (!data.user || !data.session?.access_token) {
      return jsonError(500, "Login failed", "SERVER_ERROR");
    }

    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: data.user.id,
            username,
          },
          token: data.session.access_token,
          refreshToken: data.session.refresh_token || "",
        },
        message: "Login successful",
      },
      { status: 200 },
    );

    response.cookies.set("pm_access_token", data.session.access_token, accessTokenCookieOptions);

    if (data.session.refresh_token) {
      response.cookies.set("pm_refresh_token", data.session.refresh_token, refreshTokenCookieOptions);
    }

    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError(400, "Validation failed", "VALIDATION_ERROR");
    }

    console.error("POST /api/auth/login error:", error);
    return jsonError(500, "Internal server error", "SERVER_ERROR");
  }
}

