import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    // "server-only" throws outside a React Server environment; stub it in tests.
    alias: {
      "server-only": new URL("./tests/stubs/empty.ts", import.meta.url)
        .pathname,
    },
  },
});
