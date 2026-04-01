import path from "node:path";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

// Vite skips `.env.local` when mode is `test`; merge `development` so Upstash
// (and other local secrets) are available for integration tests.
const devEnv = loadEnv("development", process.cwd(), "");
const testEnv = loadEnv("test", process.cwd(), "");
const mergedEnv = { ...devEnv, ...testEnv };
Object.assign(process.env, mergedEnv);

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(process.cwd()),
    },
  },
  test: {
    environment: "node",
    env: mergedEnv,
  },
});
