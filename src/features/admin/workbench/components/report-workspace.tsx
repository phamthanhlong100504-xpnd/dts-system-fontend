"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import Link from "next/link";
import { BarChart3, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AdminPageHeader } from "../../foundation/components/admin-page-header";
import { AdminPageState } from "../../foundation/components/admin-page-state";
import { useAdminAccess } from "../../foundation/admin-access-provider";
import { findAdminPage } from "../../foundation/admin-navigation";
import { canReadAdminPage } from "../../foundation/admin-access";
import { adminFailure } from "../../foundation/admin-errors";
import { checkReport, dateRangeProblem, defaultReportFilter, getAdminOperationsSource, type OperationsSource, type Report, type ReportFilter } from "../operations-model";
import { BreakdownTable, DailyTrendChart, SeriesChart } from "./report-charts";
import styles from "./admin-management-visual.module.css";

const metricAliases: Record<string, string> = {
  "Phiên PASSED": "Lượt thi đạt",
  "Phiên FAILED": "Lượt thi chưa đạt",
  "Điểm chuẩn hóa trung bình": "Điểm trung bình",
  "Lượt câu lý thuyết theo phạm vi projection": "Số câu lý thuyết đã luyện",
  "EXP đã ghi nhận hợp lệ": "Điểm kinh nghiệm",
  "Watermark Result": "Kết quả cập nhật gần đây",
  "Hoạt động được ghi EXP": "Hoạt động tích lũy điểm",
};
const columnAliases: Record<string, string> = { "Nguồn": "Nhóm hoạt động", "Phân hệ": "Hình thức học", "Mã học viên ẩn danh": "Mã học viên" };
const valueAliases: Record<string, string> = {
  THEORY: "Lý thuyết", SIMULATION: "Mô phỏng", PASSED: "Đạt", FAILED: "Chưa đạt",
  RANDOM: "Đề ngẫu nhiên", PRESET: "Bộ đề có sẵn", OFFICIAL: "Thi chính thức",
  DRAFT: "Bản nháp", PUBLISHED: "Đã công bố", ARCHIVED: "Đã lưu trữ",
  ACTIVE: "Hoạt động", INACTIVE: "Ngừng hoạt động", SUCCESS: "Thành công",
  PENDING: "Đang chờ", APPLIED: "Đã cập nhật", TRUE: "Có", FALSE: "Không",
};
const displayValue = (value: string) => valueAliases[value] ?? value;

export function ReportPanel({ report }: { report: Report }) {
  const { access } = useAdminAccess();
  if (report.dataStatus === "UNAVAILABLE") {
    const needsLicense = report.warnings.some(w => w.includes("Chọn hạng GPLX"));
    return <AdminPageState state="empty" title={needsLicense ? "Chọn hạng GPLX để xem thống kê" : "Chưa có số liệu trong phạm vi này"}
      description={needsLicense ? "Chọn hạng GPLX và nhấn Xem báo cáo." : "Bạn có thể thay đổi bộ lọc hoặc thử lại sau."} />;
  }
  const metrics = report.metrics.filter(m => m.value !== null);
  const visibleColumnIndexes = report.columns.map((_, i) => i).filter(i =>
    report.rows.some(row => Boolean(row.cells[i]?.trim()) && row.cells[i] !== "Chưa tính được"));
  const haveDetails = visibleColumnIndexes.length > 0 && report.rows.length > 0;
  const hasAction = report.rows.some(row => row.href && row.href.startsWith("/admin/") && (() => { const page = findAdminPage(row.href!); return page && canReadAdminPage(access, page.id); })());
  return <div className={styles.reportBody} data-testid="admin-business-report">
    {report.dataStatus !== "READY" && <p role="status" className={styles.infoNotice}>Một phần số liệu trong phạm vi đã chọn chưa được cập nhật đầy đủ.</p>}
    {metrics.length > 0 && <section aria-label="Các chỉ số nổi bật" className={styles.metricsGrid}>
      {metrics.map(metric => <div key={metric.key} className={styles.metricCard}>
        <p className={styles.metricLabel}>{metricAliases[metric.label] ?? metric.label}</p>
        <strong className={styles.metricValue}>{metric.value!.toLocaleString("vi-VN", { maximumFractionDigits: metric.unit === "percent" ? 1 : 0 })}{metric.unit === "percent" ? "%" : metric.unit === "exp" ? " EXP" : ""}</strong>
      </div>)}
    </section>}
    {report.trend.some(p => p.value !== null) && <DailyTrendChart trend={report.trend} label="Hoạt động thi trong khoảng thời gian đã chọn" />}
    {report.series?.map(series => <SeriesChart key={series.id} series={series} />)}
    {report.breakdowns?.map(breakdown => <BreakdownTable key={breakdown.id} data={breakdown} />)}
    {haveDetails && <section className={styles.sectionCard}>
      <div className={styles.cardHeading}><h3>{report.columns.includes("Chương") ? "Tiến độ theo chương" : report.columns.includes("Hạng") ? "Xếp hạng học viên" : "Kết quả theo nhóm"}</h3></div>
      <div className={styles.tableScroll}><table className={styles.dataTable}>
        <thead><tr>{visibleColumnIndexes.map(i => <th scope="col" key={i}>{columnAliases[report.columns[i]] ?? report.columns[i]}</th>)}{hasAction && <th scope="col">Thao tác</th>}</tr></thead>
        <tbody>{report.rows.map(row => {
          const page = row.href?.startsWith("/admin/") ? findAdminPage(row.href) : null;
          const allowLink = Boolean(page && canReadAdminPage(access, page.id));
          return <tr key={row.id}>{visibleColumnIndexes.map(i => <td key={i}>{displayValue(row.cells[i] ?? "")}</td>)}{hasAction && <td>{allowLink && <Link href={row.href!} className={styles.tableLink}>Xem</Link>}</td>}</tr>;
        })}</tbody>
      </table></div>
    </section>}
    {!metrics.length && !report.trend.some(p => p.value !== null) && !haveDetails && <p className={styles.emptyNote}>Chưa có số liệu phù hợp với bộ lọc đã chọn.</p>}
  </div>;
}

export function ReportWorkspace({ sourceOverride }: { sourceOverride?: OperationsSource | null }) {
  const { access, error } = useAdminAccess();
  const source = sourceOverride === undefined ? getAdminOperationsSource() : sourceOverride;
  const ready = Boolean(source && access?.actorId === source.actorId && !error);
  const [tab, setTab] = useState<"results" | "progress" | "exp">("results");
  const [draft, setDraft] = useState<ReportFilter>(defaultReportFilter);
  const [filter, setFilter] = useState<ReportFilter>(defaultReportFilter);
  const [problem, setProblem] = useState("");
  const [exporting, setExporting] = useState(false);

  const options = useQuery({ queryKey: ["admin", "workbench", "report-options", access?.actorId], queryFn: ({ signal }) => source!.reportOptions(signal), enabled: ready, retry: false, staleTime: 0, gcTime: 0 });
  const query = useQuery({
    queryKey: ["admin", "workbench", "report", access?.actorId, tab, filter],
    queryFn: async ({ signal }) => checkReport(await source!.report(tab, filter, signal), access!.actorId),
    enabled: ready && options.data?.actorId === access?.actorId,
    retry: false, staleTime: 0, gcTime: 0,
  });

  const exportFile = async () => {
    if (!source?.exportReport || !options.data?.canExport || exporting || !ready) return;
    const auth = useAuthStore.getState();
    if (auth.user?.id !== source.actorId || !auth.accessToken) return;
    setExporting(true); setProblem("");
    try {
      const file = await source.exportReport(tab, filter);
      if (useAuthStore.getState().user?.id !== auth.user?.id || useAuthStore.getState().accessToken !== auth.accessToken) throw new Error("Tài khoản đã thay đổi.");
      if (!file.filename.toLowerCase().endsWith(".csv")) throw new Error("Định dạng báo cáo chưa hợp lệ.");
      const url = URL.createObjectURL(file.blob);
      const a = document.createElement("a"); a.href = url; a.download = file.filename.replace(/[\\/]/g, "_"); a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { setProblem(adminFailure(e, "Chưa thể xuất báo cáo theo phạm vi đã chọn.").message); }
    finally { setExporting(false); }
  };

  return <div className={styles.page} data-testid="admin-reports-page">
    <AdminPageHeader title="Báo cáo & Thống kê" description="Theo dõi kết quả thi, tiến độ học tập và xếp hạng học viên." actions={
      source?.exportReport && options.data?.canExport && query.data?.dataStatus === "READY" ?
        <Button disabled={exporting || query.isFetching || !query.data} onClick={() => void exportFile()}><Download className="size-4" />Xuất báo cáo</Button> : undefined
    } />
    {!ready && <p role="status" className={styles.infoNotice}>Chưa thể tải số liệu báo cáo. Bạn có thể thử lại sau.</p>}

    <section className={styles.sectionCard}>
      <div className={styles.cardHeading}><div className="flex items-center gap-3"><span className={styles.headingIcon}><Search className="size-5" /></span><h2>Bộ lọc báo cáo</h2></div></div>
      <form className={`${styles.filterGrid} ${tab === "exp" ? styles.filterGridExp : ""}`} onSubmit={e => {
        e.preventDefault(); const issue = dateRangeProblem(draft.from, draft.to);
        if (issue) { setProblem(issue); return; }
        setProblem(""); setFilter({ ...draft, page: 0 });
      }}>
        <label><span>Từ ngày</span><input type="date" value={draft.from} disabled={!ready || exporting} onChange={e => setDraft(old => ({ ...old, from: e.target.value }))} /></label>
        <label><span>Đến ngày</span><input type="date" value={draft.to} disabled={!ready || exporting} onChange={e => setDraft(old => ({ ...old, to: e.target.value }))} /></label>
        {([
          ["licenseClass", "Hạng GPLX", options.data?.licenses ?? []],
          ["module", "Hoạt động", options.data?.modules ?? []],
          ["examType", "Loại thi", options.data?.examTypes.filter(x => !draft.module || !x.module || x.module === draft.module) ?? []],
          ["bankVersion", "Phiên bản ngân hàng", options.data?.banks ?? []],
          ["policyVersion", "Quy định áp dụng", options.data?.policies ?? []],
          ...(tab === "exp" ? [["rankingPeriod", "Kỳ xếp hạng", options.data?.periods ?? []] as const] : []),
        ] as const).map(([key, label, choices]) => <label key={key}>
          <span>{label}</span>
          <select value={draft[key]} disabled={!ready || exporting} onChange={e => setDraft(old => ({ ...old, [key]: e.target.value, ...(key === "module" ? { examType: "", bankVersion: "", policyVersion: "" } : {}) }))}>
            <option value="">Tất cả</option>{choices.map(choice => <option key={choice.id} value={choice.id}>{valueAliases[choice.label.toUpperCase()] ?? valueAliases[choice.id.toUpperCase()] ?? choice.label}</option>)}
          </select>
        </label>)}
        <Button className={styles.applyButton} type="submit" disabled={!ready || query.isFetching || exporting}><BarChart3 className="size-4" />Xem báo cáo</Button>
      </form>
    </section>

    {problem && <p role="alert" className={styles.errorNotice}>{problem}</p>}
    {options.isError && <AdminPageState state="error" error={options.error} onRetry={() => void options.refetch()} />}

    <Tabs value={tab} onValueChange={next => { setTab(next as typeof tab); setFilter(old => ({ ...old, page: 0 })); }} className={styles.reportTabs}>
      <div className={styles.tabBar}><TabsList className={styles.tabList}>
        <TabsTrigger disabled={exporting} value="results">Kết quả thi</TabsTrigger>
        <TabsTrigger disabled={exporting} value="progress">Tiến độ học tập</TabsTrigger>
        <TabsTrigger disabled={exporting} value="exp">Điểm kinh nghiệm & Xếp hạng</TabsTrigger>
      </TabsList></div>
      {(["results", "progress", "exp"] as const).map(key => <TabsContent key={key} value={key} className="pt-4">
        {query.isError ? <AdminPageState state="error" error={query.error} onRetry={() => void query.refetch()} /> :
          ready && query.isFetching ? <AdminPageState state="loading" /> :
          ready && query.data ? <ReportPanel report={query.data} /> :
          <AdminPageState state="empty" title="Chưa có số liệu được xác nhận" />}
      </TabsContent>)}
    </Tabs>
    {ready && !query.isError && query.data && query.data.totalElements > query.data.size &&
      <div className={styles.pager}>
        <Button variant="outline" disabled={filter.page === 0 || query.isFetching} onClick={() => setFilter(old => ({ ...old, page: old.page - 1 }))}>Trang trước</Button>
        <span>Trang {filter.page + 1}</span>
        <Button variant="outline" disabled={(filter.page + 1) * query.data.size >= query.data.totalElements || query.isFetching} onClick={() => setFilter(old => ({ ...old, page: old.page + 1 }))}>Trang sau</Button>
      </div>}
  </div>;
}
