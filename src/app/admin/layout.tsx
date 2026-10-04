import { auth } from "@/auth";
import { AdminSidebar } from "@/features/auth/components/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    return <>{children}</>;
  }

  return (
    <div className="admin-layout flex min-h-screen bg-surface text-text font-sans">
      <AdminSidebar userName={session.user.name || "Thu Ngân Quầy 1"} />
      <div className="admin-main flex-1 flex flex-col min-w-0 overflow-y-auto bg-surface">
        {children}
      </div>
    </div>
  );
}
