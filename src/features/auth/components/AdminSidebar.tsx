"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoutModal } from "./LogoutModal";

interface AdminSidebarProps {
  userName?: string;
  pendingCount?: number;
}

export function AdminSidebar({
  userName = "Thu Ngân Quầy 1",
  pendingCount = 0,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const navItems = [
    {
      href: "/admin/don-hang",
      icon: "📦",
      label: "Đơn hàng",
      badge: pendingCount > 0 ? `${pendingCount} mới` : null,
    },
    {
      href: "/admin/mon",
      icon: "📋",
      label: "Thực đơn",
    },
    {
      href: "/admin/tuy-chon",
      icon: "🎛️",
      label: "Nhóm tuỳ chọn",
    },
    {
      href: "/admin/danh-muc",
      icon: "🗂️",
      label: "Danh mục",
    },
    {
      href: "/admin/cai-dat",
      icon: "⚙️",
      label: "Cài đặt quán",
    },
  ];

  return (
    <>
      <aside className="admin-sidebar w-56 md:w-60 bg-[#231814] text-[#f7ede2] flex flex-col flex-shrink-0 border-r border-[#3d2b24] min-h-screen">
        {/* Brand Box */}
        <Link
          href="/admin/don-hang"
          className="brand-box p-4 border-b border-[#33221b] flex items-center gap-3 hover:bg-[#352520]/60 transition-colors"
        >
          <svg
            className="brand-logo-icon w-9 h-9 flex-shrink-0"
            viewBox="0 0 180 180"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="90" cy="90" r="86" fill="#B8322A" />
            <circle
              cx="90"
              cy="90"
              r="76"
              fill="none"
              stroke="#FBF5EC"
              stroke-width="2"
              opacity="0.6"
            />
            <path
              d="M90 22 C 104 40, 112 52, 108 68 C 106 78, 98 84, 90 86 C 80 84, 72 76, 73 65 C 74 56, 80 52, 82 44 C 86 52, 88 58, 86 64 C 92 58, 96 48, 90 22 Z"
              fill="#E8892B"
            />
            <path
              d="M52 92 H128 L120 140 C 118 150, 110 156, 100 156 H80 C 70 156, 62 150, 60 140 Z"
              fill="#FBF5EC"
            />
            <path
              d="M127 102 C 146 102, 146 130, 122 130"
              fill="none"
              stroke="#FBF5EC"
              stroke-width="7"
              stroke-linecap="round"
            />
            <path
              d="M36 128 C 34 108, 48 96, 64 98 C 64 116, 52 128, 36 128 Z"
              fill="#4E7A47"
            />
          </svg>
          <div className="brand-texts flex flex-col overflow-hidden">
            <span className="brand-title font-display font-bold text-sm text-white tracking-wide">
              TUẤN LINH
            </span>
            <span className="brand-sub text-[10px] text-accent font-semibold tracking-wider uppercase">
              Admin Console
            </span>
          </div>
        </Link>

        {/* Navigation Menu */}
        <ul className="nav-menu list-none p-3 flex flex-col gap-1.5 flex-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`nav-item flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary text-white shadow-sm font-semibold"
                      : "text-[#d8c8bf] hover:bg-[#352520] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="nav-icon text-base">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="nav-badge bg-accent text-[#231814] text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* User Footer & Logout */}
        <div className="user-footer p-3 border-t border-[#33221b] flex items-center justify-between gap-2 bg-[#1d1310]">
          <div className="user-profile-group flex items-center gap-2.5 overflow-hidden">
            <div className="user-avatar w-8 h-8 rounded-full bg-accent text-[#231814] font-bold text-xs flex items-center justify-center flex-shrink-0">
              TL
            </div>
            <div className="user-info flex flex-col overflow-hidden text-left">
              <span className="user-name text-xs font-semibold text-white truncate">
                {userName}
              </span>
              <span className="user-role text-[10px] text-emerald-400">🟢 Đang trực ca</span>
            </div>
          </div>

          <button
            type="button"
            className="btn-logout-sidebar bg-[#2a1a15] hover:bg-red-600 hover:text-white border border-[#4a3229] text-[#e5d8cb] px-2 py-1.5 rounded text-xs flex items-center gap-1 transition-all flex-shrink-0"
            onClick={() => setShowLogoutModal(true)}
            title="Đăng xuất ca làm việc"
          >
            <span>🚪</span>
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </aside>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        userName={userName}
      />
    </>
  );
}
