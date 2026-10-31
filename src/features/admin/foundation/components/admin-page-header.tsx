import type { ReactNode } from "react";

export function AdminPageHeader({ title, description, actions }: {
  title: string; description?: string; actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-1 text-[14.5px]/5 text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="dts-admin-actions shrink-0">{actions}</div>}
    </div>
  );
}
