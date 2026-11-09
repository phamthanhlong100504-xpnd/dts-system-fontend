"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAdminAccess } from "../foundation/admin-access-provider";
import { AdminPageState } from "../foundation/components/admin-page-state";
import { AdminPageHeader } from "../foundation/components/admin-page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listSessions, detailSession, releaseSessionStatus } from "./read-api";
import { canEnterCurrentAdmin } from "../foundation/admin-access";
import { ManualOfficialResultRelease } from "../exams/manual-result-release-button";
import styles from "@/features/admin/examination/admin-exam-visual.module.css";

const states = ["", "READY", "IN_PROGRESS", "PAUSED", "SUBMITTED", "EXPIRED", "TERMINATED"] as const;
const sessionStatus: Record<string, string> = {
  READY: "Sẵn sàng", IN_PROGRESS: "Đang thi", PAUSED: "Tạm dừng",
  SUBMITTED: "Đã nộp bài", EXPIRED: "Hết thời gian", TERMINATED: "Đã kết thúc",
};
const otherStatus: Record<string, string> = {
  PENDING: "Đang chờ", NOT_STARTED: "Chưa thực hiện", IN_PROGRESS: "Đang thực hiện",
  GRADED: "Đã chấm", COMPLETED: "Đã hoàn thành", FAILED: "Chưa thành công",
  NOT_RELEASED: "Chưa công bố", RELEASED: "Đã công bố", PUBLISHED: "Đã công bố",
  READY: "Sẵn sàng", SUBMITTED: "Đã nộp", MANUAL: "Thủ công", AUTO: "Tự động",
  PENDING_RELEASE: "Chờ công bố", NOT_READY: "Chưa sẵn sàng", SENT: "Đã gửi",
  DELIVERED: "Đã gửi thành công", ERROR: "Có lỗi", BLOCKED: "Đang bị chặn",
};
const stateLabel = (value: string | null | undefined, type: "session" | "other" = "other") =>
  !value ? "Chưa có thông tin" : (type === "session" ? sessionStatus[value] : otherStatus[value]) ?? "Trạng thái chưa xác định";
const date = (value: string | null) => value ? new Date(value).toLocaleString("vi-VN") : "Chưa có";
const shortId = (value: string) => value.split("-")[0]?.toUpperCase() ?? "—";

/** Read-only session access remains bounded by the verified Identity grant. */
function useSessionPermission() {
  const { access, error, loading } = useAdminAccess();
  const canRead = Boolean(
    access && !error && canEnterCurrentAdmin(access) &&
    access.permissions.includes("exam_session:read") &&
    (!access.capabilities || access.capabilities.pages["exam-sessions"] === true),
  );
  return { access, loading, canRead };
}

export function Admin04SessionList() {
  const { access, loading, canRead } = useSessionPermission();
  const who = access?.actorId ?? "";
  const [draft, setDraft] = useState({ licenseClass: "", status: "", examId: "", page: 0 });
  const [filter, setFilter] = useState(draft);
  const query = useQuery({
    queryKey: ["admin", "admin04", "official-sessions", who, filter],
    queryFn: ({ signal }) => listSessions(who, filter, signal),
    enabled: canRead,
    retry: false,
  });

  return (
    <div className={styles.page} data-testid="admin-official-sessions">
      <AdminPageHeader title="Theo dõi phiên thi" description="Tra cứu các phiên thi chính thức và tình trạng công bố kết quả." />
      {loading ? <AdminPageState state="loading" /> : !canRead ? (
        <AdminPageState state="forbidden" title="Bạn chưa có quyền xem phiên thi" />
      ) : (
        <>
          <form className={styles.filterPanel} onSubmit={(e) => { e.preventDefault(); setFilter({ ...draft, page: 0 }); }}>
            <label className="space-y-2 text-sm font-medium">
              <span className="block">Hạng GPLX</span>
              <Input placeholder="Nhập hạng GPLX" value={draft.licenseClass} onChange={(e) => setDraft((x) => ({ ...x, licenseClass: e.target.value }))} />
            </label>
            <label className="space-y-2 text-sm font-medium">
              <span className="block">Trạng thái</span>
              <select className="h-11 w-full rounded-xl border bg-background px-3" value={draft.status} onChange={(e) => setDraft((x) => ({ ...x, status: e.target.value }))}>
                {states.map((state) => <option key={state} value={state}>{state ? stateLabel(state, "session") : "Tất cả trạng thái"}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium">
              <span className="block">Mã đề thi</span>
              <Input placeholder="Không bắt buộc" value={draft.examId} onChange={(e) => setDraft((x) => ({ ...x, examId: e.target.value }))} />
            </label>
            <Button type="submit" className="self-end" disabled={query.isFetching}>Tìm phiên thi</Button>
          </form>

          <section className={styles.tablePanel}>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead><tr>{["Mã phiên", "Hạng GPLX", "Lần thi", "Trạng thái", "Tình trạng chấm", "Công bố", "Bắt đầu", "Thao tác"].map((heading) => <th key={heading}>{heading}</th>)}</tr></thead>
                <tbody>
                  {query.data?.content.map((item) => (
                    <tr key={item.sessionId}>
                      <td className="font-semibold text-foreground">{shortId(item.sessionId)}</td>
                      <td>{item.licenseClass ?? "—"}</td>
                      <td>{item.attemptNo ?? "—"}</td>
                      <td>{stateLabel(item.status, "session")}</td>
                      <td>{stateLabel(item.gradingStatus)}</td>
                      <td>{stateLabel(item.resultReleaseStatus)}</td>
                      <td>{date(item.startedAt)}</td>
                      <td><Link className={styles.detailLink} href={`/admin/exam-sessions/${encodeURIComponent(item.sessionId)}`}>Xem chi tiết</Link></td>
                    </tr>
                  ))}
                  {query.isSuccess && !query.data?.content.length && (
                    <tr><td className={styles.empty} colSpan={8}>Không tìm thấy phiên thi phù hợp.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {query.data && (
              <div className={styles.tableFooter}>
                <span>{query.data.totalElements} phiên thi · Trang {query.data.page + 1}</span>
                <div className="flex gap-2">
                  <Button variant="outline" disabled={filter.page === 0 || query.isFetching} onClick={() => setFilter((x) => ({ ...x, page: x.page - 1 }))}>Trước</Button>
                  <Button variant="outline" disabled={(filter.page + 1) * query.data.size >= query.data.totalElements || query.isFetching} onClick={() => setFilter((x) => ({ ...x, page: x.page + 1 }))}>Sau</Button>
                </div>
              </div>
            )}
          </section>
          {query.isPending ? <AdminPageState state="loading" /> : query.isError ? <AdminPageState state="error" error={query.error} onRetry={() => void query.refetch()} /> : null}
        </>
      )}
    </div>
  );
}

export function Admin04SessionDetail({ id }: { id: string }) {
  const { access, canRead, loading } = useSessionPermission();
  const who = access?.actorId ?? "";
  const detail = useQuery({
    queryKey: ["admin", "admin04", "official-session", who, id],
    queryFn: ({ signal }) => detailSession(who, id, signal),
    enabled: canRead, retry: false,
  });
  const release = useQuery({
    queryKey: ["admin", "admin04", "release-status", who, id],
    queryFn: ({ signal }) => releaseSessionStatus(who, id, signal),
    enabled: canRead && detail.isSuccess, retry: false,
  });

  return (
    <div className={styles.page} data-testid="admin-session-detail">
      <AdminPageHeader title="Chi tiết phiên thi" description="Tình trạng phiên thi và kết quả công bố." actions={(
        <Button asChild variant="outline"><Link href="/admin/exam-sessions">Quay lại danh sách</Link></Button>
      )} />
      {loading ? <AdminPageState state="loading" /> : !canRead ? <AdminPageState state="forbidden" title="Bạn chưa có quyền xem phiên thi" /> :
        detail.isPending ? <AdminPageState state="loading" /> : detail.isError ? <AdminPageState state="error" error={detail.error} onRetry={() => void detail.refetch()} /> : detail.data && (
          <>
            <section className={styles.infoGrid}>
              {([
                ["Mã phiên", shortId(detail.data.session.sessionId)],
                ["Hạng GPLX", detail.data.session.licenseClass ?? "—"],
                ["Lần thi", detail.data.session.attemptNo ?? "—"],
                ["Trạng thái", stateLabel(detail.data.session.status, "session")],
                ["Bắt đầu", date(detail.data.session.startedAt)],
                ["Kết thúc", date(detail.data.session.completedAt)],
              ] as [string, string | number][]).map(([label, value]) => (
                <div key={label} className={styles.infoMetric}><span>{label}</span><strong>{value}</strong></div>
              ))}
            </section>
            <section className={styles.infoPanel}>
              <h2>Công bố kết quả</h2>
              {release.isPending ? <AdminPageState state="loading" /> : release.isError ? <AdminPageState state="error" error={release.error} onRetry={() => void release.refetch()} /> : release.data ? (
                <>
                  <div className={styles.infoGridInner}>
                    {([
                      ["Hình thức", stateLabel(release.data.resultReleaseMode)],
                      ["Trạng thái", stateLabel(release.data.resultReleaseStatus)],
                      ["Đã công bố lúc", date(release.data.releasedAt)],
                    ] as [string, string][]).map(([label, value]) => (
                      <div key={label} className={styles.infoMetric}><span>{label}</span><strong>{value}</strong></div>
                    ))}
                  </div>
                  <ManualOfficialResultRelease sessionId={id} release={release.data} />
                </>
              ) : null}
            </section>
          </>
        )}
    </div>
  );
}
