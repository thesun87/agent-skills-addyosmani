import { describe, it, expect, vi } from "vitest";
import { requireAdmin, getAdminSession, UnauthorizedError } from "@/features/auth/require-admin";
import * as authModule from "@/auth";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

describe("requireAdmin and getAdminSession", () => {
  it("throws UnauthorizedError when session is missing", async () => {
    vi.mocked(authModule.auth).mockResolvedValueOnce(null as unknown as Awaited<ReturnType<typeof authModule.auth>>);
    await expect(requireAdmin()).rejects.toThrow(UnauthorizedError);
  });

  it("throws UnauthorizedError when session user lacks email or id", async () => {
    vi.mocked(authModule.auth).mockResolvedValueOnce({
      user: { name: "User" },
      expires: "2099-01-01",
    } as unknown as Awaited<ReturnType<typeof authModule.auth>>);
    await expect(requireAdmin()).rejects.toThrow(UnauthorizedError);
  });

  it("returns admin user info when valid session exists", async () => {
    vi.mocked(authModule.auth).mockResolvedValueOnce({
      user: { id: "admin-1", email: "admin@tuanlinh.coffee", name: "Admin" },
      expires: "2099-01-01",
    } as unknown as Awaited<ReturnType<typeof authModule.auth>>);

    const user = await requireAdmin();
    expect(user.id).toBe("admin-1");
    expect(user.email).toBe("admin@tuanlinh.coffee");
    expect(user.name).toBe("Admin");
  });

  it("getAdminSession returns null when unauthenticated, and user when authenticated", async () => {
    vi.mocked(authModule.auth).mockResolvedValueOnce(null as unknown as Awaited<ReturnType<typeof authModule.auth>>);
    expect(await getAdminSession()).toBeNull();

    vi.mocked(authModule.auth).mockResolvedValueOnce({
      user: { id: "admin-1", email: "admin@tuanlinh.coffee" },
      expires: "2099-01-01",
    } as unknown as Awaited<ReturnType<typeof authModule.auth>>);
    const session = await getAdminSession();
    expect(session).not.toBeNull();
    expect(session?.id).toBe("admin-1");
  });
});
