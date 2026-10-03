import { afterEach, describe, expect, it } from "vitest";
import { resetDb } from "./helpers/reset-db";

const originalUrl = process.env.DATABASE_URL;

afterEach(() => {
  process.env.DATABASE_URL = originalUrl;
});

describe("resetDb guard", () => {
  it("refuses to truncate a database whose name does not end with _test", async () => {
    process.env.DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

    await expect(resetDb()).rejects.toThrow(/not a \*_test database/);
  });
});
