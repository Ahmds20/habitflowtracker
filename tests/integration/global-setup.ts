import "dotenv/config";
import { execSync } from "node:child_process";

// Integration tests need their own database. They refuse to run against
// anything that is not a local database, so they can never wipe real data.
export default function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      "TEST_DATABASE_URL is not set. See README > Testing for how to start a local test database.",
    );
  }
  const host = new URL(url).hostname;
  if (!["localhost", "127.0.0.1"].includes(host)) {
    throw new Error(`Refusing to run integration tests against ${host}`);
  }

  // Apply pending migrations. Non-destructive: each test file clears its own rows.
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
  });
}
