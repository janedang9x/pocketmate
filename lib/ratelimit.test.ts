import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getClientIp,
  isStrictAuthApiPath,
  rateLimitedResponse,
} from "./ratelimit";

function headers(entries: Record<string, string>): {
  get(name: string): string | null;
} {
  const lower = Object.fromEntries(
    Object.entries(entries).map(([k, v]) => [k.toLowerCase(), v]),
  );
  return {
    get(name: string) {
      return lower[name.toLowerCase()] ?? null;
    },
  };
}

describe("getClientIp", () => {
  it("uses first x-forwarded-for hop", () => {
    expect(
      getClientIp(headers({ "x-forwarded-for": " 203.0.113.1 , 10.0.0.1 " })),
    ).toBe("203.0.113.1");
  });

  it("falls back to x-real-ip", () => {
    expect(getClientIp(headers({ "x-real-ip": "198.51.100.2" }))).toBe(
      "198.51.100.2",
    );
  });

  it("returns unknown when no proxy headers", () => {
    expect(getClientIp(headers({}))).toBe("unknown");
  });
});

describe("isStrictAuthApiPath", () => {
  it("is true for login, register, and oauth-session", () => {
    expect(isStrictAuthApiPath("/api/auth/login")).toBe(true);
    expect(isStrictAuthApiPath("/api/auth/register")).toBe(true);
    expect(isStrictAuthApiPath("/api/auth/oauth-session")).toBe(true);
    expect(isStrictAuthApiPath("/api/auth/logout")).toBe(false);
    expect(isStrictAuthApiPath("/api/auth/login/extra")).toBe(false);
    expect(isStrictAuthApiPath("/api/accounts")).toBe(false);
  });
});

describe("rateLimitedResponse", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-28T12:00:00.000Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 429 with API shape and Retry-After", async () => {
    const reset = new Date("2026-03-28T12:00:45.000Z").getTime();
    const res = rateLimitedResponse(reset);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("45");
    const body = await res.json();
    expect(body).toEqual({
      success: false,
      error: "Too many requests. Try again later.",
      code: "RATE_LIMIT",
    });
  });
});
