"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, BookOpen, CheckCircle2, ClipboardCheck, RefreshCcw, Users, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminAccess } from "../../foundation/admin-access-provider";
import { canReadAdminPage } from "../../foundation/admin-access";
import { AdminPageState } from "../../foundation/components/admin-page-state";
import { checkReport, getAdminOperationsSource, type OperationsSource, type Report } from "../operations-model";
import styles from "../../dashboard/admin-dashboard.module.css";

type BusinessArea = "content" | "accounts" | "exams" | "learning" | "media";
type BusinessReports = Partial<Record<BusinessArea, Report>>;

function groupReports(reports: Report[]): BusinessReports {
  const result: BusinessReports = {};
  for (const report of reports) {
    if (report.sourceLabel.startsWith("Content Builder")) result.content = report;
    else if (report.sourceLabel.startsWith("Identity")) result.accounts = report;
    else if (report.sourceLabel.startsWith("Result")) result.exams = report;
    else if (report.sourceLabel.startsWith("Progress")) result.learning = report;
    else if (report.sourceLabel.startsWith("Media")) result.media = report;
  }
  return result;
}

function metricValue(report: Report | undefined, key: string): number | null {
  if (!report || report.dataStatus === "UNAVAILABLE") return null;
  return report.metrics.find((item) => item.key === key)?.value ?? null;
}

function formatMetric(value: number | null, percent = false): string {
  if (value === null) return "—";
  const formatted = value.toLocaleString("vi-VN", { maximumFractionDigits: percent ? 1 : 0 });
  return percent ? `${formatted}%` : formatted;
}

function MetricRow({ label, value, percent = false }: { label: string; value: number | null; percent?: boolean }) {
  return (
    <div className={styles.detailRow}>
      <dt>{label}</dt>
      <dd className={value === null ? styles.missingValue : undefined}>{formatMetric(value, percent)}</dd>
    </div>
  );
}

export function DashboardData({ sourceOverride }: { sourceOverride?: OperationsSource | null }) {
  const { access, error } = useAdminAccess();
  const source = sourceOverride === undefined ? getAdminOperationsSource() : sourceOverride;
  const ready = Boolean(source && source.actorId === access?.actorId && !error);
  const canReadReports = canReadAdminPage(access, "reports");
  const canReadMedia = canReadAdminPage(access, "media");
  const canReadContent = canReadAdminPage(access, "chapters");
  const canReadSimulations = canReadAdminPage(access, "simulation-scenarios");

  const query = useQuery({
    queryKey: ["admin", "workbench", "dashboard", access?.actorId],
    queryFn: async ({ signal }) => (await source!.dashboard({}, signal)).map((report) => checkReport(report, access!.actorId)),
    enabled: ready,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });

  if (!ready) {
    return <section role="status" className={styles.notice}>Chưa thể tải thống kê. Bạn vẫn có thể sử dụng các mục quản trị được cấp quyền.</section>;
  }
  if (query.isError) return <AdminPageState state="error" error={query.error} onRetry={() => void query.refetch()} />;
  if (query.isPending) return <AdminPageState state="loading" description="Đang tải thống kê tổng quan" />;

  const reports = groupReports(query.data ?? []);
  const mediaPending = metricValue(reports.media, "notReady");

  const highlights = [
    { id: "accounts", percent: false, label: "Tài khoản", value: metricValue(reports.accounts, "accounts"), note: "Tất cả trạng thái", icon: Users },
    { id: "completed", percent: false, label: "Lượt thi hoàn thành", value: metricValue(reports.exams, "completed"), note: "30 ngày gần nhất", icon: ClipboardCheck },
    { id: "passRate", label: "Tỷ lệ thi đạt", value: metricValue(reports.exams, "passRate"), percent: true, note: "30 ngày gần nhất", icon: CheckCircle2 },
    { id: "theory", percent: false, label: "Học viên ôn lý thuyết", value: metricValue(reports.learning, "tLearn"), note: "30 ngày gần nhất", icon: BookOpen },
  ];

  return (
    <div className={styles.dataContent} data-testid="dashboard-real-data">
      <div className={styles.sectionHeading}>
        <div>
          <h2>Hoạt động nổi bật</h2>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void query.refetch()} disabled={query.isFetching}>
          <RefreshCcw aria-hidden="true" className={`size-4 ${query.isFetching ? "animate-spin" : ""}`} />
          Cập nhật
        </Button>
      </div>

      <div className={styles.highlightGrid}>
        {highlights.map(({ id, label, value, note, percent, icon: Icon }) => (
          <article key={id} className={styles.highlightCard} data-testid={`dashboard-stat-${id}`}>
            <div className={styles.highlightTop}>
              <span className={styles.highlightLabel}>{label}</span>
              <span className={styles.highlightIcon}><Icon aria-hidden="true" className="size-5" /></span>
            </div>
            <strong className={value === null ? styles.highlightMissing : styles.highlightNumber}>
              {formatMetric(value, percent)}
            </strong>
            <p className={styles.highlightNote}>{value === null ? "Chưa có số liệu" : note}</p>
          </article>
        ))}
      </div>

      <div className={styles.detailGrid}>
        <section className={styles.detailCard} aria-labelledby="dashboard-learning-content">
          <div className={styles.detailHeader}>
            <span className={styles.detailIcon}><BookOpen aria-hidden="true" className="size-5" /></span>
            <div><h2 id="dashboard-learning-content">Nội dung đào tạo</h2><p>Lý thuyết và video mô phỏng</p></div>
          </div>
          <dl className={styles.details}>
            <MetricRow label="Chương đã công bố" value={metricValue(reports.content, "chapters")} />
            <MetricRow label="Chương trình học đã công bố" value={metricValue(reports.content, "programs")} />
            <MetricRow label="Tình huống mô phỏng hiện hành" value={metricValue(reports.content, "simScenarios")} />
            <MetricRow label="Bộ đề mô phỏng đã công bố" value={metricValue(reports.content, "simPresets")} />
          </dl>
          {(canReadContent || canReadSimulations) && (
            <div className={styles.detailFooter}>
              <Link href={canReadContent ? "/admin/chapters" : "/admin/simulations/scenarios"}>
                Quản lý nội dung <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          )}
        </section>

        <section className={styles.detailCard} aria-labelledby="dashboard-learning-activity">
          <div className={styles.detailHeader}>
            <span className={styles.detailIcon}><Video aria-hidden="true" className="size-5" /></span>
            <div><h2 id="dashboard-learning-activity">Học tập và thi cử</h2><p>Hoạt động trong 30 ngày gần nhất</p></div>
          </div>
          <dl className={styles.details}>
            <MetricRow label="Học viên tham gia thi" value={metricValue(reports.exams, "learners")} />
            <MetricRow label="Học viên luyện mô phỏng" value={metricValue(reports.learning, "sLearn")} />
            <MetricRow label="Câu lý thuyết cần ôn" value={metricValue(reports.learning, "tReview")} />
            <MetricRow label="Tình huống cần ôn" value={metricValue(reports.learning, "sReview")} />
          </dl>
          {canReadReports && (
            <div className={styles.detailFooter}>
              <Link href="/admin/reports">Xem báo cáo chi tiết <ArrowUpRight aria-hidden="true" className="size-4" /></Link>
            </div>
          )}
        </section>
      </div>

      {mediaPending !== null && mediaPending > 0 && canReadMedia && (
        <div className={styles.statusLine} role="status">
          <Link href="/admin/media">Có {formatMetric(mediaPending)} tài nguyên cần hoàn thiện <ArrowUpRight aria-hidden="true" className="size-3.5" /></Link>
        </div>
      )}
    </div>
  );
}
