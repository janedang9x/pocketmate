import { createSupabaseBrowserClient } from "@/lib/supabase";

/**
 * Starts Google OAuth via Supabase. User returns to `/auth/callback` with ?code=...
 */
export async function signInWithGoogle(redirectAfterLogin: string) {
  if (typeof window === "undefined") {
    return new Error("signInWithGoogle must run in the browser");
  }

  const supabase = createSupabaseBrowserClient();
  const redirectTo = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectAfterLogin)}`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  return error ?? null;
}
