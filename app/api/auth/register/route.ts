import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { registerSchema, normalizeUsername, usernameToAuthEmail } from "@/lib/auth";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase";

function jsonError(
  status: number,
  error: string,
  code: string,
): NextResponse<{ success: false; error: string; code: string }> {
  return NextResponse.json({ success: false, error, code }, { status });
}

function isDuplicateSignupError(message?: string) {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes("user already registered") ||
    normalized.includes("already registered") ||
    normalized.includes("duplicate") ||
    normalized.includes("already exists")
  );
}

async function createUserProfileRecord(params: {
  userId: string;
  username: string;
  accessToken: string;
}) {
  const { userId, username, accessToken } = params;

  // Prefer creating via an authenticated client so RLS stays meaningful.
  const authed = createSupabaseServerClient({ accessToken });

  // NOTE: Current schema has a required `password` column on `user_account`.
  // We do NOT store the user's actual password (Supabase Auth owns credential storage).
  const legacyPlaceholderPassword = "__managed_by_supabase_auth__";
  const baseProfileRow = {
    id: userId,
    user_name: username,
    is_active: true,
  };

  const attempt = await authed.from("user_account").insert({
    ...baseProfileRow,
    password: legacyPlaceholderPassword,
  });

  if (!attempt.error) return;

  // Fallback: if RLS blocks inserts (or other policies), allow service role to create profile.
  try {
    const admin = createSupabaseAdminClient();
    const adminAttempt = await admin.from("user_account").insert({
      ...baseProfileRow,
      password: legacyPlaceholderPassword,
    });
    if (!adminAttempt.error) return;
  } catch {
    // ignore: service role key missing, surface original error below
  }

  throw attempt.error;
}

/**
 * Register a new user and return a session token.
 * Implements FR-AUTH-001: User Registration
 * @see docs/specifications.md#fr-auth-001-user-registration
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.parse(body);
    const username = normalizeUsername(parsed.username);

    const supabase = createSupabaseServerClient();
    const email = usernameToAuthEmail(username);

    const { data, error } = await supabase.auth.signUp({
      email,
      password: parsed.password,
      options: {
        data: { username },
      },
    });

    if (error) {
      if (isDuplicateSignupError(error.message)) {
        return jsonError(409, "Username already exists", "DUPLICATE_ERROR");
      }

      return jsonError(400, error.message || "Registration failed", "VALIDATION_ERROR");
    }

    if (!data.user) {
      return jsonError(500, "Registration failed", "SERVER_ERROR");
    }

    // For MVP we require auto-login. If Supabase email confirmations are enabled,
    // signUp will not return a session (no token) until email confirmation.
    if (!data.session?.access_token) {
      return jsonError(
        500,
        "Registration succeeded but auto-login is disabled. Please disable email confirmations in Supabase Auth settings for MVP.",
        "SERVER_ERROR",
      );
    }

    await createUserProfileRecord({
      userId: data.user.id,
      username,
      accessToken: data.session.access_token,
    });

    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: data.user.id,
            username,
            createdAt: data.user.created_at,
          },
          token: data.session.access_token,
        },
        message: "Account created successfully",
      },
      { status: 201 },
    );

    response.cookies.set("pm_access_token", data.session.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    if (data.session.refresh_token) {
      response.cookies.set("pm_refresh_token", data.session.refresh_token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
    }

    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError(400, "Validation failed", "VALIDATION_ERROR");
    }

    console.error("POST /api/auth/register error:", error);
    return jsonError(500, "Internal server error", "SERVER_ERROR");
  }
}

