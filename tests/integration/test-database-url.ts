// Default credentials of the local Supabase CLI stack — not a secret. Override in CI via env.
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/tuanlinh_test";
