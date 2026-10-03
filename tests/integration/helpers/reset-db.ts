import { db } from "@/lib/db";

function assertTestDatabase(): void {
  const databaseName = new URL(process.env.DATABASE_URL ?? "").pathname.slice(1);
  if (!databaseName.endsWith("_test")) {
    throw new Error(`resetDb refused: "${databaseName}" is not a *_test database.`);
  }
}

/** Truncates every application table so each integration test starts from a clean state. */
export async function resetDb(): Promise<void> {
  assertTestDatabase();

  const rows = await db.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;
  if (rows.length === 0) return;

  const tables = rows.map(({ tablename }) => `"public"."${tablename}"`).join(", ");
  await db.$executeRawUnsafe(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
}
