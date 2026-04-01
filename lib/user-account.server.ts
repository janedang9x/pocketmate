import type { User } from "@supabase/supabase-js";

import { normalizeUsername } from "@/lib/auth";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase";

const LEGACY_PLACEHOLDER_PASSWORD = "__managed_by_supabase_auth__";
const DEFAULT_ACCOUNT_NAME = "Cash Wallet";
const DEFAULT_ACCOUNT_TYPE = "Cash";
const DEFAULT_ACCOUNT_CURRENCY = "VND";

const USERNAME_REGEX = /^[a-z0-9_]+$/i;

/**
 * Ensures a `user_account` row exists for the authenticated Supabase user.
 * Used after password registration (known username) and after OAuth (derived username).
 */
export async function ensureUserAccountExists(params: {
  accessToken: string;
  user: User;
  explicitUsername?: string;
}): Promise<void> {
  const { accessToken, user, explicitUsername } = params;
  const authed = createSupabaseServerClient({ accessToken });

  const { data: existing } = await authed
    .from("user_account")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (!existing) {
    const username = explicitUsername
      ? normalizeUsername(explicitUsername)
      : await pickUniqueUsername(authed, deriveUsernameFromUser(user), user.id);

    const baseProfileRow = {
      id: user.id,
      user_name: username,
      is_active: true,
    };

    const attempt = await authed.from("user_account").insert({
      ...baseProfileRow,
      password: LEGACY_PLACEHOLDER_PASSWORD,
    });

    if (attempt.error) {
      try {
        const admin = createSupabaseAdminClient();
        const adminAttempt = await admin.from("user_account").insert({
          ...baseProfileRow,
          password: LEGACY_PLACEHOLDER_PASSWORD,
        });
        if (adminAttempt.error) {
          throw attempt.error;
        }
      } catch {
        // service role key missing; surface original error below
        throw attempt.error;
      }
    }
  }

  await ensureDefaultFinancialAccount({ accessToken, userId: user.id });
}

async function ensureDefaultFinancialAccount(params: {
  accessToken: string;
  userId: string;
}) {
  const { accessToken, userId } = params;
  const authed = createSupabaseServerClient({ accessToken });

  const { data: existingAccount } = await authed
    .from("financial_account")
    .select("id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (existingAccount) return;

  const attempt = await authed.from("financial_account").insert({
    user_id: userId,
    name: DEFAULT_ACCOUNT_NAME,
    type: DEFAULT_ACCOUNT_TYPE,
    currency: DEFAULT_ACCOUNT_CURRENCY,
  });

  if (!attempt.error) return;

  try {
    const admin = createSupabaseAdminClient();
    const adminAttempt = await admin.from("financial_account").insert({
      user_id: userId,
      name: DEFAULT_ACCOUNT_NAME,
      type: DEFAULT_ACCOUNT_TYPE,
      currency: DEFAULT_ACCOUNT_CURRENCY,
    });
    if (!adminAttempt.error) return;
  } catch {
    // service role key missing; surface original error below
  }

  throw attempt.error;
}

function deriveUsernameFromUser(user: User): string {
  const metaCandidates = [
    user.user_metadata?.username,
    user.user_metadata?.preferred_username,
    user.user_metadata?.user_name,
    user.user_metadata?.name,
    user.user_metadata?.full_name,
  ];
  for (const raw of metaCandidates) {
    if (typeof raw !== "string" || !raw.trim()) continue;
    const normalized = normalizeUsername(raw.replace(/[^a-zA-Z0-9_]/g, ""));
    if (normalized.length >= 3 && USERNAME_REGEX.test(normalized)) {
      return normalized.slice(0, 100);
    }
  }

  if (user.email) {
    const local = user.email.split("@")[0] ?? "user";
    const normalized = normalizeUsername(local.replace(/[^a-zA-Z0-9_]/g, "_"));
    const collapsed = normalized.replace(/_+/g, "_").replace(/^_|_$/g, "");
    const base =
      collapsed.length >= 3 ? collapsed : `user_${user.id.replace(/-/g, "").slice(0, 8)}`;
    return base.slice(0, 100);
  }

  return `user_${user.id.replace(/-/g, "").slice(0, 12)}`.slice(0, 100);
}

async function pickUniqueUsername(
  authed: ReturnType<typeof createSupabaseServerClient>,
  base: string,
  userId: string,
): Promise<string> {
  let candidate = base.slice(0, 100);
  for (let i = 0; i < 20; i++) {
    const { data: clash } = await authed
      .from("user_account")
      .select("id")
      .eq("user_name", candidate)
      .maybeSingle();
    if (!clash) return candidate;
    const suffix =
      i === 0
        ? `_${userId.replace(/-/g, "").slice(0, 6)}`
        : `_${userId.replace(/-/g, "").slice(0, 4)}${i}`;
    candidate = (base.slice(0, Math.max(1, 100 - suffix.length)) + suffix).slice(0, 100);
  }
  return `u_${userId.replace(/-/g, "")}`.slice(0, 100);
}
