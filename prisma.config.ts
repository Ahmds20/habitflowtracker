import "dotenv/config";
import { defineConfig } from "prisma/config";

// The CLI (migrate, studio) uses the direct, non-pooled connection.
// Runtime queries use the pooled DATABASE_URL through the pg adapter in src/lib/db.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
