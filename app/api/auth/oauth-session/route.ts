import { NextResponse, type NextRequest } from "next/server";
import { ZodError, z } from "zod";

import { accessTokenCookieOptions, refreshTokenCookieOptions } from "@/lib/auth-session";
import { ensureUserAccountExists } from "@/lib/user-account.server";
import { createSupabaseServerClient } from "@/lib/supabase";

const oauthSessionSchema = z.object({
  accessToken: z.string().min(1, "Access token required"),
  refreshToken: z.string().optional(),
});

function jsonError(
  status: number,
  error: string,
  code: string,
): NextResponse<{ success: false; error: string; code: string }> {
  return NextResponse.json({ success: false, error, code }, { status });
}

/**
 * Validates tokens from the browser after OAuth PKCE exchange, sets the same cookies
 * as password login, and ensures `user_account` exists (FR-AUTH-001 profile row).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = oauthSessionSchema.parse(body);

    const supabase = createSupabaseServerClient({ accessToken: parsed.accessToken });
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return jsonError(401, "Invalid or expired session", "UNAUTHORIZED");
    }

    await ensureUserAccountExists({
      accessToken: parsed.accessToken,
      user,
    });

    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
          },
        },
        message: "Session established",
      },
      { status: 200 },
    );

    response.cookies.set("pm_access_token", parsed.accessToken, accessTokenCookieOptions);

    if (parsed.refreshToken) {
      response.cookies.set("pm_refresh_token", parsed.refreshToken, refreshTokenCookieOptions);
    }

    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError(400, "Validation failed", "VALIDATION_ERROR");
    }

    console.error("POST /api/auth/oauth-session error:", error);
    return jsonError(500, "Internal server error", "SERVER_ERROR");
  }
}
