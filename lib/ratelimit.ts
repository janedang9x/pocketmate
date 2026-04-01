import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis/cloudflare";
import { type NextRequest, NextResponse } from "next/server";

/** Login/register: brute-force protection */
const AUTH_WINDOW_REQUESTS = 10;
const AUTH_WINDOW = "1 m";

/** Rest of /api/*: normal SPA + polling headroom */
const API_WINDOW_REQUESTS = 100;
const API_WINDOW = "1 m";

export type HeaderBag = { get(name: string): string | null };

let authRatelimit: Ratelimit | null = null;
let apiRatelimit: Ratelimit | null = null;

function getLimiters(): { auth: Ratelimit; api: Ratelimit } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return null;
  }

  if (!authRatelimit || !apiRatelimit) {
    const redis = new Redis({ url, token });
    authRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(AUTH_WINDOW_REQUESTS, AUTH_WINDOW),
      prefix: "ratelimit:auth",
    });
    apiRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(API_WINDOW_REQUESTS, API_WINDOW),
      prefix: "ratelimit:api",
    });
  }

  return { auth: authRatelimit, api: apiRatelimit };
}

/**
 * Client IP for rate limiting (trust Netlify / reverse proxy headers).
 */
export function getClientIp(headers: HeaderBag): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

/**
 * Stricter limits for credential and signup endpoints.
 */
export function isStrictAuthApiPath(pathname: string): boolean {
  return (
    pathname === "/api/auth/login" ||
    pathname === "/api/auth/register" ||
    pathname === "/api/auth/oauth-session"
  );
}

/**
 * Enforces Upstash rate limits for /api/*. Returns a 429 response when over limit.
 * If Upstash env is missing, fails open (no limit) so local dev works without Redis.
 */
export async function enforceApiRateLimit(
  request: NextRequest,
  pathname: string,
): Promise<NextResponse | null> {
  const limiters = getLimiters();
  if (!limiters) {
    return null;
  }

  const ip = getClientIp(request.headers);
  const ratelimit = isStrictAuthApiPath(pathname) ? limiters.auth : limiters.api;
  const { success, reset } = await ratelimit.limit(ip);

  if (success) {
    return null;
  }

  return rateLimitedResponse(reset);
}

/** Exported for tests: 429 body and Retry-After from Upstash reset (ms since epoch). */
export function rateLimitedResponse(reset: number): NextResponse {
  const retryAfterSec = Math.max(1, Math.ceil((reset - Date.now()) / 1000));

  return NextResponse.json(
    {
      success: false,
      error: "Too many requests. Try again later.",
      code: "RATE_LIMIT",
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
      },
    },
  );
}
