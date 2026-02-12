import { z } from "zod";

const USERNAME_REGEX = /^[a-z0-9_]+$/i;

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(100, "Username must be at most 100 characters")
    .regex(USERNAME_REGEX, "Username can only contain letters, numbers, and underscores"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200, "Password must be at most 200 characters"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(100, "Username must be at most 100 characters")
    .regex(USERNAME_REGEX, "Username can only contain letters, numbers, and underscores"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200, "Password must be at most 200 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

/**
 * Supabase Auth requires an email for password-based signups.
 * For MVP (FR-AUTH-001) we treat username as the stable identifier.
 */
export function usernameToAuthEmail(username: string) {
  const normalized = normalizeUsername(username);
  return `${normalized}@pocketmate.local`;
}

/**
 * Client-side logout function.
 * Calls the logout API, clears localStorage, and redirects to login.
 * Implements FR-AUTH-003: User Logout
 */
export async function logout(): Promise<void> {
  try {
    // Call logout API endpoint
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Even if API call fails, clear client-side storage
    console.error("Logout API call failed:", error);
  } finally {
    // Clear localStorage token
    localStorage.removeItem("pm_token");
    // Redirect to login page
    window.location.href = "/auth/login";
  }
}

