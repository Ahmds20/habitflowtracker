import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const stubs = {
  // "server-only" throws outside a React Server environment; stub it in tests.
  "server-only": new URL("./tests/stubs/empty.ts", import.meta.url).pathname,
  // Request cookies do not exist in tests; use an in-memory cookie jar.
  "next/headers": new URL("./tests/stubs/next-headers.ts", import.meta.url)
    .pathname,
};

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["tests/unit/**/*.test.ts"],
          alias: stubs,
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          environment: "node",
          include: ["tests/integration/**/*.test.ts"],
          alias: stubs,
          // Tests share one database, so run files one at a time.
          fileParallelism: false,
          globalSetup: ["tests/integration/global-setup.ts"],
          setupFiles: ["tests/integration/setup-env.ts"],
        },
      },
    ],
  },
});
