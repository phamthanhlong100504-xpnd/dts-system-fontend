import "./admin-spacing.css";
import "./admin-typography.css";
import "./admin-presentation.css";
import { AdminShell } from "@/components/admin/admin-shell";
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
