import { describe, it, expect, vi, beforeEach } from "vitest";
import { loginAdminAction, logoutAdminAction } from "@/features/auth/actions";
import * as authModule from "@/auth";
import * as verifyModule from "@/features/auth/verify-credentials";

vi.mock("@/auth", () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("@/features/auth/verify-credentials", () => ({
  verifyAdminCredentials: vi.fn(),
}));

describe("Auth actions (loginAdminAction, logoutAdminAction)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns validation error when email is invalid", async () => {
    const formData = new FormData();
    formData.append("email", "invalid-email");
    formData.append("password", "secret");

    const result = await loginAdminAction(null, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Email không hợp lệ");
  });

  it("returns validation error when password is empty", async () => {
    const formData = new FormData();
    formData.append("email", "admin@tuanlinh.coffee");
    formData.append("password", "");

    const result = await loginAdminAction(null, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Vui lòng nhập mật khẩu");
  });

  it("returns lockout/credential error when verifyAdminCredentials fails", async () => {
    vi.mocked(verifyModule.verifyAdminCredentials).mockResolvedValueOnce({
      success: false,
      error: "Email hoặc mật khẩu không chính xác. Còn lại 4 lần thử.",
      remainingAttempts: 4,
      isLocked: false,
    });

    const formData = new FormData();
    formData.append("email", "admin@tuanlinh.coffee");
    formData.append("password", "wrongpassword");

    const result = await loginAdminAction(null, formData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Còn lại 4 lần thử");
    expect(result.remainingAttempts).toBe(4);
  });

  it("calls signIn and returns success: true on valid credentials", async () => {
    vi.mocked(verifyModule.verifyAdminCredentials).mockResolvedValueOnce({
      success: true,
      user: { id: "admin-1", email: "admin@tuanlinh.coffee", name: "Admin" },
    });
    vi.mocked(authModule.signIn).mockResolvedValueOnce(undefined as never);

    const formData = new FormData();
    formData.append("email", "admin@tuanlinh.coffee");
    formData.append("password", "Admin123!@");

    const result = await loginAdminAction(null, formData);
    expect(result.success).toBe(true);
    expect(authModule.signIn).toHaveBeenCalledWith("credentials", {
      email: "admin@tuanlinh.coffee",
      password: "Admin123!@",
      redirectTo: "/admin/don-hang",
    });
  });

  it("returns generic error if signIn throws an unexpected error", async () => {
    vi.mocked(verifyModule.verifyAdminCredentials).mockResolvedValueOnce({
      success: true,
      user: { id: "admin-1", email: "admin@tuanlinh.coffee", name: "Admin" },
    });
    vi.mocked(authModule.signIn).mockRejectedValueOnce(new Error("Network failed"));

    const formData = new FormData();
    formData.append("email", "admin@tuanlinh.coffee");
    formData.append("password", "Admin123!@");

    const result = await loginAdminAction(null, formData);
    expect(result.success).toBe(false);
    expect(result.error).toBe("Đăng nhập thất bại. Vui lòng thử lại.");
  });

  it("calls signOut when logoutAdminAction is invoked", async () => {
    vi.mocked(authModule.signOut).mockResolvedValueOnce(undefined as never);
    await logoutAdminAction();
    expect(authModule.signOut).toHaveBeenCalledWith({ redirectTo: "/admin/dang-nhap" });
  });
});
