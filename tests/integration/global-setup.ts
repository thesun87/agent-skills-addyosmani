import { execSync } from "node:child_process";
import { TEST_DATABASE_URL } from "./test-database-url";

/**
 * Brings the dedicated test database up to date with the Prisma migrations once per run.
 * `migrate deploy` is non-destructive (it creates the database if missing); per-test cleanup
 * is done by `resetDb`.
 */
export default function setup(): void {
  execSync("pnpm exec prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL, DIRECT_URL: TEST_DATABASE_URL },
  });
}
