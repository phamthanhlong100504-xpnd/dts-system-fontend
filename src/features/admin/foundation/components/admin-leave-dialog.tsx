"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function AdminLeaveDialog({ open, onCancel, onLeave }: {
  open: boolean; onCancel: () => void; onLeave: () => void;
}) {
  return <Dialog open={open} onOpenChange={(next) => { if (!next) onCancel(); }}>
    <DialogContent>
      <DialogHeader><DialogTitle>Thay đổi chưa được lưu</DialogTitle><DialogDescription>Nội dung đang nhập chưa được lưu. Bạn muốn tiếp tục biên tập hay rời trang và bỏ các thay đổi?</DialogDescription></DialogHeader>
      <DialogFooter><Button type="button" variant="outline" onClick={onCancel}>Tiếp tục biên tập</Button><Button type="button" variant="destructive" onClick={onLeave}>Rời trang</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
