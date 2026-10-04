import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export interface VerifyCredentialsResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  error?: string;
  remainingAttempts?: number;
  isLocked?: boolean;
  lockedUntil?: Date;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

// Dummy hash for constant-time comparison when user doesn't exist
const DUMMY_HASH = "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012";

export async function verifyAdminCredentials(
  email: string,
  password: string
): Promise<VerifyCredentialsResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await db.adminUser.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    // Run dummy compare to mitigate timing attack
    await bcrypt.compare(password, DUMMY_HASH).catch(() => false);
    return {
      success: false,
      error: "Email hoặc mật khẩu không chính xác.",
    };
  }

  const now = new Date();
  if (user.lockedUntil && user.lockedUntil > now) {
    return {
      success: false,
      isLocked: true,
      lockedUntil: user.lockedUntil,
      error: "Bạn đã nhập sai 5 lần liên tiếp. Để đảm bảo an toàn, hệ thống tạm khoá trong 15 phút.",
    };
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    const attempts = user.failedAttempts + 1;
    if (attempts >= MAX_FAILED_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
      await db.adminUser.update({
        where: { id: user.id },
        data: {
          failedAttempts: MAX_FAILED_ATTEMPTS,
          lockedUntil,
        },
      });

      return {
        success: false,
        isLocked: true,
        lockedUntil,
        error: "Bạn đã nhập sai 5 lần liên tiếp. Để đảm bảo an toàn, hệ thống tạm khoá trong 15 phút.",
      };
    }

    await db.adminUser.update({
      where: { id: user.id },
      data: { failedAttempts: attempts },
    });

    const remaining = MAX_FAILED_ATTEMPTS - attempts;
    return {
      success: false,
      remainingAttempts: remaining,
      error: `Email hoặc mật khẩu không chính xác. Còn lại ${remaining} lần thử.`,
    };
  }

  // Password valid: reset failures & lockout
  if (user.failedAttempts > 0 || user.lockedUntil) {
    await db.adminUser.update({
      where: { id: user.id },
      data: {
        failedAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
}
