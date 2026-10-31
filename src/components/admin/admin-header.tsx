"use client";
import Link from "next/link";
import { useId, useRef, useState } from "react";
import { Menu, Search, RefreshCw, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/auth-store";
import { useAdminAccess } from "@/features/admin/foundation/admin-access-provider";
import { searchAdminNavigation, visibleAdminNavigation } from "@/features/admin/foundation/admin-navigation";
import { AdminAccount } from "./admin-account";
export function AdminHeader({ title, onOpenMenu, menuOpen = false }: { title?: string; onOpenMenu?: () => void; menuOpen?: boolean }) {
  const { access, refresh, refreshing } = useAdminAccess();
  const name = useAuthStore((s) => s.user?.fullName || s.user?.username || s.user?.email || "Tài khoản");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(0);
  const resultId = useId();
  const links = useRef<(HTMLAnchorElement | null)[]>([]);
  const results = searchAdminNavigation(visibleAdminNavigation(access), query);
  return <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6 md:left-[300px]">
    {onOpenMenu && <Button id="admin-menu-toggle" type="button" variant="ghost" size="icon" onClick={onOpenMenu} className="shrink-0 md:hidden" aria-label="Mở menu quản trị" aria-controls="admin-mobile-menu" aria-expanded={menuOpen}><Menu aria-hidden="true" className="h-5 w-5" /></Button>}
    <div className="mr-2 flex min-w-0 flex-1 items-center sm:mr-[0.6cm]">
      {title ? <h2 className="truncate text-lg font-bold tracking-tight text-foreground">{title}</h2> : <div className="relative w-full" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input type="search" role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={resultId} aria-activedescendant={open && results[selected] ? `${resultId}-${selected}` : undefined}
          aria-label="Tìm nhanh mục quản trị" placeholder="Tìm nhanh mục quản trị…" value={query}
          onFocus={() => setOpen(true)} onChange={(event) => { setQuery(event.target.value); setSelected(0); setOpen(true); }}
          onKeyDown={(event) => {
            if (event.key === "Escape") { setOpen(false); return; }
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault(); setOpen(true);
              if (results.length) setSelected((index) => (index + (event.key === "ArrowDown" ? 1 : -1) + results.length) % results.length);
            }
            if (event.key === "Enter" && open && results[selected]) { event.preventDefault(); links.current[selected]?.click(); }
          }} className="h-9 bg-muted/40 pl-9 text-[14.5px]/5" />
        {open && <div id={resultId} role="listbox" aria-label="Kết quả tìm menu" className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[min(60vh,360px)] overflow-y-auto rounded-xl border bg-popover p-1 text-popover-foreground shadow-md">
          {results.length ? results.map((item, index) => <Link key={item.id} ref={(element) => { links.current[index] = element; }} id={`${resultId}-${index}`} href={item.href} role="option" aria-selected={selected === index}
            onMouseEnter={() => setSelected(index)} onClick={(event) => { if (!event.defaultPrevented) { setOpen(false); setQuery(""); } }}
            className={`block rounded-lg px-3 py-2 text-[14.5px]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${selected === index ? "bg-accent text-accent-foreground" : "hover:bg-accent"}`}>{item.label}</Link>) : <p className="px-3 py-4 text-[14.5px]/5 text-muted-foreground">Không tìm thấy mục phù hợp.</p>}
        </div>}
      </div>}
    </div>
    <DropdownMenu>
      <DropdownMenuTrigger asChild><button type="button" aria-label={`Tài khoản ${name}`} className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"><AdminAccount compact /></button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel><AdminAccount /></DropdownMenuLabel><DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href="/profile"><UserRound aria-hidden="true" className="h-4 w-4" />Hồ sơ cá nhân</Link></DropdownMenuItem>
        <DropdownMenuItem disabled={refreshing} onSelect={() => refresh()}><RefreshCw aria-hidden="true" className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />{refreshing ? "Đang tải quyền…" : "Tải lại quyền truy cập"}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </header>;
}
