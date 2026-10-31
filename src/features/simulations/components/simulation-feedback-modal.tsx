"use client";
import { useState } from "react";
import { CircleAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { learningStyles } from "./learning-ui";
import { cn } from "@/lib/utils";
import styles from "./simulation-dialog-layout.module.css";
export function SimulationFeedbackModal({
  message,
  onDismiss,
  title,
  action,
}: {
  message?: string | null;
  onDismiss?: () => void;
  title?: string;
  action?: { label: string; onClick: () => void; disabled?: boolean };
}) {
  const [dismissed, setDismissed] = useState(false);
  if (!message) return null;
  const close = () => {
    setDismissed(true);
    onDismiss?.();
  };
  return (
    <Dialog
      open={!dismissed}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent
        className={cn(
          styles.feedbackDialog,
          "font-dts gap-0 overflow-hidden rounded-[18px] border border-[#dce2f7] p-0",
        )}
        onKeyDown={(e) => {
          if (e.code === "Space") e.stopPropagation();
        }}
      >
        <div
          className={cn(
            styles.header,
            "border-b border-[#dce2f7] bg-[#eef2ff] px-6 pb-5 pt-6",
          )}
        >
          <span className="inline-flex size-12 items-center justify-center rounded-[12px] bg-white text-[#0758d9]">
            <CircleAlert className="size-6" />
          </span>
          <DialogTitle
            className={cn(
              styles.title,
              "text-[18px] font-bold leading-7 text-[#172335]",
            )}
          >
            {title ??
              (message.includes("đánh dấu")
                ? "Thông báo đánh dấu tình huống"
                : "Thông báo luyện tập")}
          </DialogTitle>
          <span aria-hidden="true" />
        </div>
        <div className={styles.body}>
          <DialogDescription className="text-[15.5px] font-medium leading-7 text-[#475467]">
            {message}
          </DialogDescription>
          <div className={styles.actions}>
            <button
              type="button"
              onClick={close}
              className={
                action ? learningStyles.secondary : learningStyles.primary
              }
            >
              Đã hiểu
            </button>
            {action && (
              <button
                type="button"
                disabled={action.disabled}
                onClick={() => {
                  close();
                  action.onClick();
                }}
                className={learningStyles.primary}
              >
                {action.label}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
