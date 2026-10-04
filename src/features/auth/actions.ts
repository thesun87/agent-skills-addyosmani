"use server";

import { signIn, signOut } from "@/auth";
import { verifyAdminCredentials } from "./verify-credentials";
import { z } from "zod";
import { isRedirectError } from "next/dist/client/components/redirect-error";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

export interface LoginActionState {
  success?: boolean;
  error?: string;
  remainingAttempts?: number;
  isLocked?: boolean;
  lockedUntil?: string;
}

export async function loginAdminAction(
  _prevState: LoginActionState | null,
  formData: FormData
): Promise<LoginActionState> {
  const email = formData.get("email")?.toString() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Thông tin đăng nhập không hợp lệ",
    };
  }

  // Pre-check with database to handle accurate lockout messages and attempt counting
  const check = await verifyAdminCredentials(parsed.data.email, parsed.data.password);
  if (!check.success) {
    return {
      success: false,
      error: check.error,
      remainingAttempts: check.remainingAttempts,
      isLocked: check.isLocked,
      lockedUntil: check.lockedUntil?.toISOString(),
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/admin/don-hang",
    });
    return { success: true };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return {
      success: false,
      error: "Đăng nhập thất bại. Vui lòng thử lại.",
    };
  }
}

export async function logoutAdminAction(): Promise<void> {
  await signOut({ redirectTo: "/admin/dang-nhap" });
}
