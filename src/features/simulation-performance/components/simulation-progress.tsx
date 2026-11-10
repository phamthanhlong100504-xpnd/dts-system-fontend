"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  BookOpenText,
  Bookmark,
  ChartNoAxesColumnIncreasing,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Layers3,
  RotateCcw,
} from "lucide-react";
import type { LicenseOption } from "@/config/license";
import type { PerformanceScope } from "../performance-source";
import { performanceSource } from "../performance-source";
import { usePerformanceRead } from "../use-performance";
import {
  number,
  ProgressBar,
  ReadState,
  Retry,
  styles,
  SyncNotice,
} from "./performance-ui";
export function SimulationProgressContent({
  scope,
  license,
}: {
  scope: PerformanceScope;
  license: LicenseOption;
}) {
  const q = usePerformanceRead(scope, "progress", [], (signal) =>
    performanceSource.progress(
      scope,
      scope.bankVersion ?? undefined,
      undefined,
      signal,
    ),
  );
  const data = q.data;
  const canOpen =
    !!data?.bankVersion &&
    license.simulationReady === true &&
    license.simulationBankVersion === data.bankVersion;
  const bankQuery = data?.bankVersion
    ? `?bankVersion=${encodeURIComponent(data.bankVersion)}`
    : "";
  return (
    <div className={`${styles.container} ${styles.progressContainer}`}>
      <div className={styles.headingRow}>
        <div>
          <h1 className={styles.heading}>Tiến độ học tập</h1>
          <p className={styles.description}>
            Theo dõi những tình huống bạn đã luyện trong hạng{" "}
            <strong>{scope.licenseClass}</strong>.
          </p>
        </div>
        <div className={styles.actions}>
          <Retry onClick={() => void q.refetch()} busy={q.isFetching} />
        </div>
      </div>
      <ReadState
        loading={q.isPending}
        error={q.isError}
        onRetry={() => void q.refetch()}
      />
      {data && (
        <>
          <SyncNotice data={data} />
          <section className={`${styles.panel} ${styles.pad} ${styles.progressOverview}`}>
            <div className={styles.between}>
              <div>
                <p className={styles.progressLabel}>
                  <span className={styles.progressIcon}>
                    <ChartNoAxesColumnIncreasing aria-hidden="true" />
                  </span>
                  Tiến độ tổng thể
                </p>
                <p className={styles.progressMetric}>
                  {number(data.practicedScenarios)} /{" "}
                  {number(data.totalScenarios)}{" "}
                  <small>tình huống đã luyện</small>
                </p>
              </div>
              <strong className={styles.percent}>
                {number(data.completionPercent)}
                {data.completionPercent !== null ? "%" : ""}
              </strong>
            </div>
            <ProgressBar
              value={data.completionPercent}
              label="Tiến độ luyện tập tổng thể"
            />
          </section>
          <div className={styles.split}>
            <ProgressStat
              icon={<RotateCcw aria-hidden="true" />}
              label="Tình huống cần ôn lại"
              value={data.needReviewCount}
              description="Các tình huống đã luyện nhưng điểm cao nhất chưa đạt 5/5."
              href={
                canOpen
                  ? `/practice/simulations/review-needed${bankQuery}`
                  : null
              }
            />
            <ProgressStat
              icon={<Bookmark aria-hidden="true" />}
              label="Tình huống đã đánh dấu"
              value={data.bookmarkedScenarios}
              description="Các tình huống bạn đã lưu để luyện tập khi cần."
              href={
                canOpen ? `/practice/simulations/bookmarks${bankQuery}` : null
              }
            />
          </div>
          <section className={styles.chapterSection}>
            <h2 className={styles.sectionTitle}>
              <Layers3 aria-hidden="true" />
              Tiến độ theo chương
            </h2>
            <p className={styles.sectionDescription}>
              Tiếp tục những nội dung bạn chưa học hết.
            </p>
            {!canOpen && data.bankVersion && (
              <div className={styles.notice}>
                Tiến độ đã lưu được giữ nguyên. Chức năng mở ôn sẽ sẵn sàng khi
                ngân hàng tương ứng được mở lại.
              </div>
            )}
            <div className={styles.chapterList}>
              {data.chapters.map((c) => (
                <article
                  className={`${styles.card} ${styles.chapterCard}`}
                  key={c.chapterId}
                >
                  <div className={styles.between}>
                    <span className={styles.pill}>CHƯƠNG {c.chapterId}</span>
                    <span
                      className={`${styles.chapterStatus} ${
                        c.status === "COMPLETED"
                          ? styles.chapterStatusCompleted
                          : c.status === "IN_PROGRESS"
                            ? styles.chapterStatusActive
                            : styles.chapterStatusPending
                      }`}
                    >
                      {c.status === "COMPLETED" && <CheckCircle2 aria-hidden="true" />}
                      {c.status === "IN_PROGRESS" && <Clock3 aria-hidden="true" />}
                      {c.status === "NOT_STARTED" && <CircleDashed aria-hidden="true" />}
                      {c.status === "COMPLETED"
                        ? "Đã luyện đủ"
                        : c.status === "IN_PROGRESS"
                          ? "Đang luyện"
                          : c.status === "NOT_STARTED"
                            ? "Chưa bắt đầu"
                            : "Đang đồng bộ"}
                    </span>
                  </div>
                  <h3 className={styles.chapterTitle}>
                    <BookOpenText aria-hidden="true" />
                    {c.chapterName}
                  </h3>
                  <div className={styles.between}>
                    <p className={styles.chapterMeta}>
                      {number(c.practicedScenarios)} /{" "}
                      {number(c.totalScenarios)} tình huống đã luyện
                    </p>
                    <strong style={{ color: "#0758d9" }}>
                      {number(c.completionPercent)}
                      {c.completionPercent !== null ? "%" : ""}
                    </strong>
                  </div>
                  <ProgressBar
                    value={c.completionPercent}
                    label={`Tiến độ chương ${c.chapterId}`}
                  />
                  {canOpen && (
                    <div className={styles.chapterActionRow}>
                      <Link
                        className={`${styles.button} ${styles.primary}`}
                        prefetch={false}
                        href={c.navigation.path}
                      >
                        {c.practicedScenarios === 0
                          ? "Bắt đầu ôn"
                          : "Tiếp tục ôn"}{" "}
                        →
                      </Link>
                    </div>
                  )}
                </article>
              ))}
            </div>
            {!data.chapters.length && (
              <div className={`${styles.panel} ${styles.empty}`}>
                {data.dataStatus === "CATALOG_PENDING"
                  ? "Đang chờ danh mục chương được đồng bộ."
                  : "Chưa có chương trong phạm vi dữ liệu này."}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function ProgressStat({
  icon,
  label,
  value,
  description,
  href,
}: {
  icon: ReactNode;
  label: string;
  value: number | null;
  description: string;
  href: string | null;
}) {
  const content = (
    <>
      <h2 className={styles.cardLabel}>
        {label}
        <span className={styles.iconBox}>{icon}</span>
      </h2>
      <p className={styles.progressStatValue}>{number(value)}</p>
      <p className={styles.progressStatDescription}>{description}</p>
    </>
  );
  const className = `${styles.card} ${styles.progressStat}`;
  return href ? (
    <Link className={className} href={href} prefetch={false}>
      {content}
    </Link>
  ) : (
    <section className={className}>{content}</section>
  );
}
