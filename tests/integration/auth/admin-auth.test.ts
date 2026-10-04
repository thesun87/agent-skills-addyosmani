import { describe, it, expect, beforeEach } from "vitest";
import { resetDb } from "../helpers/reset-db";
import { db } from "@/lib/db";
import { seedAdminUser } from "@/features/auth/seed";
import { verifyAdminCredentials } from "@/features/auth/verify-credentials";
import bcrypt from "bcryptjs";

describe("Admin Authentication & Brute-force Protection (T10, A1)", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("seeds 1 admin user with hashed password from env or defaults", async () => {
    const admin = await seedAdminUser();
    expect(admin.email).toBe(process.env.SEED_ADMIN_EMAIL || "admin@tuanlinh.coffee");
    expect(admin.name).toBe("Thu Ngân Quầy 1");
    // Password must be hashed with bcrypt, never plain text
    expect(admin.passwordHash).not.toBe("Admin123!@");
    expect(admin.passwordHash.startsWith("$2")).toBe(true);

    const match = await bcrypt.compare("Admin123!@", admin.passwordHash);
    expect(match).toBe(true);

    // Calling seedAdminUser again is idempotent
    const adminAgain = await seedAdminUser();
    expect(adminAgain.id).toBe(admin.id);
  });

  it("authenticates successfully with correct credentials and resets failed attempts", async () => {
    await seedAdminUser();

    // Set failed attempts to 2 first
    await db.adminUser.update({
      where: { email: "admin@tuanlinh.coffee" },
      data: { failedAttempts: 2 },
    });

    const result = await verifyAdminCredentials("admin@tuanlinh.coffee", "Admin123!@");
    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user?.email).toBe("admin@tuanlinh.coffee");

    const updated = await db.adminUser.findUnique({
      where: { email: "admin@tuanlinh.coffee" },
    });
    expect(updated?.failedAttempts).toBe(0);
    expect(updated?.lockedUntil).toBeNull();
  });

  it("increments failed attempts and warns remaining attempts on wrong password", async () => {
    await seedAdminUser();

    const result = await verifyAdminCredentials("admin@tuanlinh.coffee", "WrongPassword123");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Email hoặc mật khẩu không chính xác. Còn lại 4 lần thử.");
    expect(result.remainingAttempts).toBe(4);

    const updated = await db.adminUser.findUnique({
      where: { email: "admin@tuanlinh.coffee" },
    });
    expect(updated?.failedAttempts).toBe(1);
  });

  it("does not reveal whether a non-existent email exists", async () => {
    await seedAdminUser();

    const result = await verifyAdminCredentials("notfound@tuanlinh.coffee", "anyPassword");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Email hoặc mật khẩu không chính xác.");
    expect(result.remainingAttempts).toBeUndefined();
  });

  it("locks account for 15 minutes after 5 consecutive failed attempts", async () => {
    await seedAdminUser();

    for (let i = 1; i <= 4; i++) {
      const res = await verifyAdminCredentials("admin@tuanlinh.coffee", `wrong${i}`);
      expect(res.success).toBe(false);
      expect(res.remainingAttempts).toBe(5 - i);
    }

    // 5th attempt triggers lockout
    const fifthAttempt = await verifyAdminCredentials("admin@tuanlinh.coffee", "wrong5");
    expect(fifthAttempt.success).toBe(false);
    expect(fifthAttempt.isLocked).toBe(true);
    expect(fifthAttempt.error).toContain("Bạn đã nhập sai 5 lần liên tiếp. Để đảm bảo an toàn, hệ thống tạm khoá trong 15 phút.");

    const lockedAdmin = await db.adminUser.findUnique({
      where: { email: "admin@tuanlinh.coffee" },
    });
    expect(lockedAdmin?.failedAttempts).toBe(5);
    expect(lockedAdmin?.lockedUntil).toBeDefined();
    const lockedTime = lockedAdmin?.lockedUntil?.getTime() ?? 0;
    expect(lockedTime).toBeGreaterThan(Date.now() + 14 * 60 * 1000);

    // Even entering correct password now is rejected because of lockout
    const correctWhileLocked = await verifyAdminCredentials("admin@tuanlinh.coffee", "Admin123!@");
    expect(correctWhileLocked.success).toBe(false);
    expect(correctWhileLocked.isLocked).toBe(true);
    expect(correctWhileLocked.error).toContain("tạm khoá");
  });
});
