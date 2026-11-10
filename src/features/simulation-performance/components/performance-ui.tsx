"use client";
import { RefreshCcw } from "lucide-react";
import type { ReactNode } from "react";
import type { PerformanceSnapshot } from "../performance-contract";
import styles from "../performance.module.css";
export { styles };
export const number = (n: number | null | undefined) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(n);
export const dateTime = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(new Date(value))
    : "—";
export function Outcome({ value }: { value: "PASSED" | "FAILED" }) {
  return (
    <span className={value === "PASSED" ? styles.passed : styles.failed}>
      {value === "PASSED" ? "Đạt" : "Chưa đạt"}
    </span>
  );
}
export function Retry({
  onClick,
  busy = false,
  label = "Cập nhật",
}: {
  onClick: () => void;
  busy?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      className={styles.button}
      disabled={busy}
      onClick={onClick}
    >
      <RefreshCcw aria-hidden="true" />
      {label}
    </button>
  );
}
export function ReadState({
  loading,
  error,
  onRetry,
}: {
  loading?: boolean;
  error?: boolean;
  onRetry: () => void;
}) {
  if (loading)
    return (
      <div
        className={`${styles.panel} ${styles.empty}`}
        role="status"
        aria-busy="true"
      >
        Đang tải dữ liệu…
      </div>
    );
  if (error)
    return (
      <div className={`${styles.notice} ${styles.error}`} role="alert">
        Không tải được dữ liệu. Nội dung đã nhận vẫn được giữ; bạn có thể thử
        lại. <Retry onClick={onRetry} label="Thử lại" />
      </div>
    );
  return null;
}
export function SyncNotice({ data }: { data: PerformanceSnapshot }) {
  const text =
    data.dataStatus === "CATALOG_PENDING"
      ? "Đang đồng bộ danh mục tình huống. Các chỉ số chưa xác nhận được hiển thị bằng dấu —."
      : data.dataStatus === "STALE"
        ? "Dữ liệu đang cập nhật chậm. Bạn vẫn có thể xem các thông tin đã lưu."
        : data.dataStatus !== "READY"
          ? "Dữ liệu đang được đồng bộ. Các thông tin đã nhận có thể chưa đầy đủ; dấu — là chỉ số chưa xác nhận."
          : null;
  return (
    <>
      {text && (
        <div className={`${styles.notice} ${styles.warning}`} role="status">
          {text}
          {data.asOf && <span> Cập nhật đến {dateTime(data.asOf)}.</span>}
        </div>
      )}
      {!data.simulationReady && (
        <div className={styles.notice}>
          Ngân hàng hiện chưa sẵn sàng để luyện mới. Tiến độ và kết quả đã lưu
          vẫn được hiển thị.
        </div>
      )}
    </>
  );
}
export function Pagination({
  page,
  size,
  total,
  pages,
  count,
  onPage,
}: {
  page: number;
  size: number;
  total: number | null;
  pages: number | null;
  count: number;
  onPage: (page: number) => void;
}) {
  return (
    <div className={styles.pagination}>
      <span>
        {count
          ? `Hiển thị ${page * size + 1}–${page * size + count}`
          : "Hiển thị 0"}
        {total === null
          ? " · Đang cập nhật tổng số"
          : ` trong ${number(total)}`}
      </span>
      <nav aria-label="Phân trang">
        <button
          type="button"
          disabled={page <= 0}
          onClick={() => onPage(page - 1)}
        >
          Trước
        </button>
        <span>
          Trang {page + 1}
          {pages !== null ? ` / ${Math.max(1, pages)}` : ""}
        </span>
        <button
          type="button"
          disabled={pages === null || page + 1 >= pages}
          onClick={() => onPage(page + 1)}
        >
          Sau
        </button>
      </nav>
    </div>
  );
}
export function MetricCard({
  label,
  value,
  suffix,
  icon,
}: {
  label: string;
  value: number | null;
  suffix?: string;
  icon: ReactNode;
}) {
  return (
    <section className={styles.card}>
      <h2 className={styles.cardLabel}>
        {label}
        <span className={styles.iconBox}>{icon}</span>
      </h2>
      <p className={styles.metric}>
        {number(value)}
        {suffix && value !== null && <small> {suffix}</small>}
      </p>
    </section>
  );
}
export function ProgressBar({
  value,
  label,
}: {
  value: number | null;
  label: string;
}) {
  return value === null ? (
    <div className={styles.notice}>Chưa xác nhận tiến độ</div>
  ) : (
    <div
      className={styles.bar}
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${value}%` }} />
    </div>
  );
}
