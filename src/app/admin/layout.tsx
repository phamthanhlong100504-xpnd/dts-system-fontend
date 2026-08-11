import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
import { RequireAuth } from "@/components/require-auth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <div className="flex h-screen overflow-hidden bg-muted/20">
        <AdminSidebar />
        <div className="flex-1 ml-0 md:ml-[260px] flex flex-col h-screen overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto mt-16 p-6 lg:p-8 space-y-6">
            {children}
          </main>
        </div>
      </div>
    </RequireAuth>
  );
}
