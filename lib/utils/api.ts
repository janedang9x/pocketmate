import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

/**
 * Standard API error response helper
 */
export function jsonError(
  status: number,
  error: string,
  code: string,
): NextResponse<{ success: false; error: string; code: string }> {
  return NextResponse.json({ success: false, error, code }, { status });
}

/**
 * Standard API success response helper
 */
export function jsonSuccess<T>(
  data: T,
  message?: string,
  status: number = 200,
): NextResponse<{ success: true; data: T; message?: string }> {
  return NextResponse.json({ success: true, data, message }, { status });
}

/**
 * Authenticate request and return the current user
 * Gets access token from cookies or Authorization header
 * @throws Error with message "UNAUTHORIZED" if authentication fails
 */
export async function authenticateRequest(req: NextRequest): Promise<User> {
  // Get access token from cookies or Authorization header
  const accessToken =
    req.cookies.get("pm_access_token")?.value ||
    req.headers.get("Authorization")?.replace("Bearer ", "");

  if (!accessToken) {
    throw new Error("UNAUTHORIZED");
  }

  // Verify token with Supabase
  const supabase = createSupabaseServerClient({ accessToken });
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("UNAUTHORIZED");
  }

  return user;
}
