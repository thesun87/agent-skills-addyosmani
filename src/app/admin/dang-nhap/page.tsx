import { LoginForm } from "@/features/auth/components/LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đăng Nhập Quản Trị — Tuấn Linh Coffee",
  description: "Hệ thống xử lý đơn & quản lý quầy bar Tuấn Linh Coffee",
};

export default function AdminLoginPage() {
  return (
    <div className="login-screen-wrapper min-h-screen w-full flex flex-col items-center justify-center p-4 bg-radial from-[#2e1e18] to-[#1a110e]">
      <LoginForm />
    </div>
  );
}
