import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  /** Icon logo tròn trên cùng (lucide icon) */
  icon: ReactNode;
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Footer link (ví dụ: "Đã có tài khoản? Đăng nhập") */
  footer?: ReactNode;
  className?: string;
}

/**
 * Khung chung cho các trang xác thực (login, register, forgot-password, OTP...).
 * Web-app: cột trung tâm max-w-md, không khung mobile 400px.
 */
export function AuthShell({
  icon,
  title,
  subtitle,
  children,
  footer,
  className,
}: AuthShellProps) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4">
      <div className={cn("w-full max-w-md", className)}>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
            {icon}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {children}
        {footer && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
