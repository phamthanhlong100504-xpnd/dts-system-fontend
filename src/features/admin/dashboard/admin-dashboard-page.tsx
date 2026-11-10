"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  ClipboardList,
  FileQuestion,
  LayoutDashboard,
  Users,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardData } from "../workbench/components/dashboard-data";
import { useAdminAccess } from "../foundation/admin-access-provider";
import { canReadAdminPage } from "../foundation/admin-access";
import styles from "./admin-dashboard.module.css";

const quickActions = [
  { id: "questions", label: "Ngân hàng câu hỏi", description: "Câu hỏi lý thuyết", href: "/admin/questions", icon: FileQuestion },
  { id: "simulation-scenarios", label: "Tình huống mô phỏng", description: "Tình huống và video", href: "/admin/simulations/scenarios", icon: Video },
  { id: "exams", label: "Đề thi chính thức", description: "Đề thi và cấu trúc", href: "/admin/exams", icon: ClipboardList },
  { id: "users", label: "Người dùng", description: "Tài khoản học viên", href: "/admin/users", icon: Users },
  { id: "reports", label: "Báo cáo", description: "Kết quả và tiến độ", href: "/admin/reports", icon: BarChart3 },
  { id: "simulation-guide", label: "Hướng dẫn mô phỏng", description: "Nội dung hướng dẫn", href: "/admin/simulation-guide", icon: BookOpen },
] as const;

export function AdminDashboardPage() {
  const { access } = useAdminAccess();
  const actions = quickActions.filter((item) => canReadAdminPage(access, item.id));
  const canReadReports = canReadAdminPage(access, "reports");

  return (
    <div className={styles.page} data-testid="admin-dashboard">
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <h1>Tổng quan</h1>
          <p>Theo dõi tình hình học tập, thi cử và nội dung đào tạo.</p>
        </div>
        <div className={styles.heroRight}>
          {canReadReports && (
            <Button asChild variant="outline" size="lg" className={styles.reportButton}>
              <Link href="/admin/reports">Xem báo cáo <ArrowUpRight aria-hidden="true" className="size-4" /></Link>
            </Button>
          )}
          <span className={styles.heroIcon} aria-hidden="true"><LayoutDashboard className="size-6" /></span>
        </div>
      </header>

      <DashboardData />

      {actions.length > 0 && (
        <section className={styles.shortcuts} aria-labelledby="admin-shortcuts-title">
          <div className={styles.sectionHeading}>
            <h2 id="admin-shortcuts-title">Truy cập nhanh</h2>
          </div>
          <div className={styles.shortcutGrid}>
            {actions.map(({ id, label, description, href, icon: Icon }) => (
              <Link className={styles.shortcut} href={href} key={id} data-testid={`dashboard-link-${id}`}>
                <span className={styles.shortcutIcon}><Icon aria-hidden="true" className="size-5" /></span>
                <span className={styles.shortcutBody}>
                  <span className={styles.shortcutTitle}>{label}</span>
                  <span className={styles.shortcutDescription}>{description}</span>
                </span>
                <ArrowUpRight aria-hidden="true" className={styles.shortcutArrow} />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
