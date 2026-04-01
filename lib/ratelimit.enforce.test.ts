import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

describe("enforceApiRateLimit", () => {
  const savedUrl = process.env.UPSTASH_REDIS_REST_URL;
  const savedToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  afterEach(() => {
    vi.resetModules();
    if (savedUrl === undefined) delete process.env.UPSTASH_REDIS_REST_URL;
    else process.env.UPSTASH_REDIS_REST_URL = savedUrl;
    if (savedToken === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    else process.env.UPSTASH_REDIS_REST_TOKEN = savedToken;
  });

  it("returns null when Upstash env is not configured (fail open)", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    vi.resetModules();
    const { enforceApiRateLimit } = await import("./ratelimit");
    const req = new NextRequest("http://localhost/api/accounts");
    await expect(enforceApiRateLimit(req, "/api/accounts")).resolves.toBeNull();
  });
});
