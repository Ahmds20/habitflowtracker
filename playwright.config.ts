import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

// End-to-end tests run a production build against the local test database
// (TEST_DATABASE_URL), never against Neon.
const testDb = process.env.TEST_DATABASE_URL;
if (!testDb)
  throw new Error("TEST_DATABASE_URL is not set (see README > Testing)");
if (!["localhost", "127.0.0.1"].includes(new URL(testDb).hostname)) {
  throw new Error("E2E tests only run against a local database");
}

const PORT = 3300;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx prisma migrate deploy && npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/api/v1/health`,
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
    env: {
      DATABASE_URL: testDb,
      DIRECT_URL: testDb,
      // Rate limits off: tests create many accounts from one IP.
      UPSTASH_REDIS_REST_URL: "",
      UPSTASH_REDIS_REST_TOKEN: "",
      NEXT_DIST_DIR: ".next-e2e",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
