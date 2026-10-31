"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { adminFailure } from "../admin-errors";

export function AdminConfirmDialog({ open, onOpenChange, title, description, confirmLabel = "Xác nhận", destructive = false, onConfirm }: {
  open: boolean; onOpenChange: (open: boolean) => void; title: string; description: string;
  confirmLabel?: string; destructive?: boolean; onConfirm: () => Promise<unknown>;
}) {
  const locked = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function confirm() {
    if (locked.current) return;
    locked.current = true; setPending(true); setError(null);
    try { await onConfirm(); onOpenChange(false); }
    catch (reason) { setError(adminFailure(reason).message); }
    finally { locked.current = false; setPending(false); }
  }
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!locked.current) { setError(null); onOpenChange(next); } }}>
      <DialogContent onEscapeKeyDown={(e) => { if (locked.current) e.preventDefault(); }} onPointerDownOutside={(e) => { if (locked.current) e.preventDefault(); }}>
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>
        {error && <p role="alert" className="text-[14.5px]/5 text-destructive">{error}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button type="button" variant={destructive ? "destructive" : "default"} disabled={pending} onClick={() => void confirm()}>
            {pending && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}{pending ? "Đang xử lý…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
