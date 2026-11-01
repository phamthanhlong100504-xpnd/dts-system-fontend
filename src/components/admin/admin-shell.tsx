"use client";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { RequireAuth } from "@/components/require-auth";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AdminSidebar, AdminSidebarContent } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";
import { AdminSessionScope, useAdminAccess } from "@/features/admin/foundation/admin-access-provider";
import { canEnterCurrentAdmin, canOpenAdminPath } from "@/features/admin/foundation/admin-access";
import { findAdminPage, visibleAdminNavigation } from "@/features/admin/foundation/admin-navigation";
import { adminFailure } from "@/features/admin/foundation/admin-errors";
import { AdminPageState } from "@/features/admin/foundation/components/admin-page-state";
export function AdminShell({ children }: { children: ReactNode }) {
  return <RequireAuth><AdminSessionScope><AdminChrome>{children}</AdminChrome></AdminSessionScope></RequireAuth>;
}
function AdminChrome({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className="flex h-screen overflow-hidden bg-muted/20">
    <AdminSidebar />
    <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
      <SheetContent id="admin-mobile-menu" side="left" className="gap-0 p-0 data-[side=left]:w-[min(92vw,320px)]" aria-label="Danh mục quản trị" onCloseAutoFocus={(event) => { event.preventDefault(); document.getElementById("admin-menu-toggle")?.focus(); }}>
        <SheetTitle className="sr-only">Điều hướng quản trị DTS</SheetTitle>
        <SheetDescription className="sr-only">Chọn một mục quản trị được cấp quyền truy cập.</SheetDescription>
        <AdminSidebarContent onNavigate={() => setMenuOpen(false)} />
      </SheetContent>
    </Sheet>
    <div className="ml-0 flex h-screen min-w-0 flex-1 flex-col overflow-hidden md:ml-[300px]">
      <AdminHeader menuOpen={menuOpen} onOpenMenu={() => setMenuOpen(true)} />
      <main id="admin-main-content" className="dts-admin-spacing mt-16 min-w-0 flex-1 space-y-6 overflow-x-auto overflow-y-auto p-6 lg:p-8"><AdminRouteGate>{children}</AdminRouteGate></main>
    </div>
  </div>;
}
function AdminRouteGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { access, loading, error, refresh } = useAdminAccess();
  if (loading) return <AdminPageState state="loading" title="Đang xác minh quyền truy cập" />;
  if (error && !access) {
    const failure = adminFailure(error);
    return <AdminPageState state={failure.kind === "forbidden" ? "forbidden" : "error"} error={error} onRetry={refresh} />;
  }
  const page = findAdminPage(pathname);
  if (!canEnterCurrentAdmin(access) || (pathname !== "/admin" && (!page?.implemented || !canOpenAdminPath(access, page.id, pathname)))) {
    return <AdminPageState state="forbidden" description="Tài khoản hiện tại chưa được cấp quyền truy cập trang quản trị này."><Button asChild variant="outline"><Link href="/">Về giao diện học viên</Link></Button></AdminPageState>;
  }
  return <>
    {Boolean(error) && <AdminPageState key="access-warning" state="error" title="Chưa thể xác minh lại quyền" description="Nội dung đang nhập được giữ nguyên. Tải lại quyền truy cập để tiếp tục thao tác." onRetry={refresh} />}
    <div key="admin-page" className="contents" inert={Boolean(error)}>{children}</div>
  </>;
}
export function AdminLanding() {
  const { access } = useAdminAccess();
  const router = useRouter();
  const href = visibleAdminNavigation(access).flatMap((group) => group.items)[0]?.href;
  useEffect(() => { if (href) router.replace(href); }, [href, router]);
  return <AdminPageState state="loading" title="Đang mở trang quản trị" />;
}
