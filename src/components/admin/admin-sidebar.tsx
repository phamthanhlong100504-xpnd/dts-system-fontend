"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { BookOpen, ChevronDown, ClipboardCheck, FileText, FolderTree, HelpCircle, Images, Lightbulb, KeyRound, Layers, LayoutDashboard, LogOut, Scale, Send, Signpost, Settings, ShieldCheck, Users, Video, Workflow, Activity, History, BarChart3, type LucideIcon } from "lucide-react";
import { AdminAccount } from "./admin-account";
import { useAdminAccess } from "@/features/admin/foundation/admin-access-provider";
import { findAdminPage, visibleAdminNavigation } from "@/features/admin/foundation/admin-navigation";
const icons: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard, questions: HelpCircle, chapters: FolderTree, programs: BookOpen,
  structures: Layers, criteria: Scale, rules: FileText, exams: ShieldCheck, guide: BookOpen,
  sessions: ClipboardCheck, video: Video, reports: BarChart3, monitoring: Activity, audit: History,
  users: Users, roles: KeyRound, settings: Settings, media: Images, releases: Send, signs: Signpost, tips: Lightbulb,
};
const groupIcons: Record<string, LucideIcon> = {
  overview: LayoutDashboard, theory: BookOpen, official: ClipboardCheck,
  simulation: Video, operations: Workflow, system: Settings,
};
export function AdminSidebar() {
  return <aside aria-label="Thanh điều hướng quản trị" className="fixed left-0 top-0 z-40 hidden h-screen w-[300px] flex-col border-r border-border bg-background shadow-sm md:flex"><AdminSidebarContent /></aside>;
}
export function AdminSidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { access } = useAdminAccess();
  const groups = visibleAdminNavigation(access);
  const current = findAdminPage(pathname);
  const prefix = useId();
  const [expanded, setExpanded] = useState<Record<string, { path: string; open: boolean }>>({});
  return <div className="flex h-full min-h-0 flex-col gap-2 p-4">
    <div className="mb-4 flex shrink-0 items-center gap-3 px-2 pt-2">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md"><ShieldCheck aria-hidden="true" className="h-6 w-6" /></div>
      <div><p className="text-base font-bold tracking-tight text-foreground">Quản trị DTS</p></div>
    </div>
    <nav aria-label="Các mục quản trị" className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]">
      {groups.map((group) => {
        const GroupIcon = groupIcons[group.id] ?? FolderTree;
        const containsCurrent = group.items.some((item) => item.id === current?.id);
        const choice = expanded[group.id];
        const open = choice && (!containsCurrent || choice.path === pathname) ? choice.open : true;
        const panelId = `${prefix}-${group.id}`;
        return <div key={group.id}>
          <button type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setExpanded((previous) => ({ ...previous, [group.id]: { path: pathname, open: !open } }))}
            className="mb-1 flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[15.5px]/5 font-semibold text-foreground/90 transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset">
            <GroupIcon aria-hidden="true" className={`h-[18px] w-[18px] shrink-0 ${containsCurrent ? "text-primary" : "text-muted-foreground"}`} />
            <span className="min-w-0 flex-1 whitespace-nowrap">{group.label}</span><ChevronDown aria-hidden="true" className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`} />
          </button>
          <div id={panelId} hidden={!open} className="ml-[20px] space-y-1 border-l border-border/60 py-0.5 pl-3">{group.items.map((item) => {
            const Icon = icons[item.icon] ?? BookOpen;
            const active = current?.id === item.id;
            return <Link key={item.id} href={item.href} aria-current={active ? "page" : undefined} onClick={(event) => { if (!event.defaultPrevented) onNavigate?.(); }}
              className={`flex min-h-9 items-center gap-2.5 rounded-lg px-3 py-2 text-[14px]/5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${active ? "bg-primary/10 font-semibold text-primary ring-1 ring-inset ring-primary/15" : "text-muted-foreground hover:bg-accent/60 hover:text-accent-foreground"}`}>
              <Icon aria-hidden="true" className="h-4 w-4 shrink-0" /><span className="whitespace-nowrap">{item.label}</span>
            </Link>;
          })}</div>
        </div>;
      })}
    </nav>
    <div className="mt-auto shrink-0 space-y-4 pt-2">
      <Link href="/" onClick={(event) => { if (!event.defaultPrevented) onNavigate?.(); }} className="mx-2 flex min-h-9 items-center gap-2.5 rounded-lg px-3 py-2 text-[14px]/5 font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"><LogOut aria-hidden="true" className="h-4 w-4 shrink-0" /><span className="whitespace-nowrap">Giao diện học viên</span></Link>
      <div className="border-t border-border px-2 pt-4"><AdminAccount /></div>
    </div>
  </div>;
}
