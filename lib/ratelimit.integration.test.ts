import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis/cloudflare";
import { describe, expect, it } from "vitest";

const hasUpstash =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
  Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

/**
 * Hits real Upstash when env is present (e.g. local .env.local).
 * Skipped in CI or fresh clones without credentials.
 */
describe.skipIf(!hasUpstash)("Upstash rate limit (integration)", () => {
  it("Redis responds to PING", async () => {
    const redis = Redis.fromEnv(process.env);
    const pong = await redis.ping();
    expect(pong).toBe("PONG");
  });

  it("sliding window allows N then blocks", async () => {
    const redis = Redis.fromEnv(process.env);
    const prefix = `ratelimit:vitest:${Date.now()}`;
    const rl = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(2, "1 m"),
      prefix,
    });
    const id = `vitest-ip-${Math.random().toString(36).slice(2)}`;
    const first = await rl.limit(id);
    const second = await rl.limit(id);
    const third = await rl.limit(id);
    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    expect(third.success).toBe(false);
  });
});
