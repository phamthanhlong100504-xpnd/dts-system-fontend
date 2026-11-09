"use client";
import type { ReactNode } from "react";
import { useLearningModule } from "../use-learning-module";
import { usePerformanceContext } from "../use-performance";
import { CombinedAnalyticsContent } from "./combined-analytics";
import { CombinedLeaderboardContent } from "./combined-leaderboard";
import { SimulationHistoryContent } from "./simulation-history";
import { SimulationProgressContent } from "./simulation-progress";
import { Retry, styles } from "./performance-ui";
/** Legacy children are returned untouched. No theory API/DTO/score/JSX is rewritten. */
export function PerformancePage({
  kind,
  licenseClass,
  children,
}: {
  kind: "history" | "progress" | "analytics" | "ranking";
  licenseClass: string;
  children: ReactNode;
}) {
  const context = usePerformanceContext(licenseClass);
  const learningModule = useLearningModule(
    licenseClass,
    context.license?.simulationEnabled === true,
  );
  if (context.isLoading)
    return (
      <div className={styles.container} role="status" aria-busy="true">
        Đang tải nội dung của hạng GPLX…
      </div>
    );
  if (context.error || !context.mode || !context.license)
    return (
      <div className={styles.container}>
        <div className={`${styles.notice} ${styles.error}`} role="alert">
          {context.error ?? "Chưa xác nhận được chính sách hiển thị."}{" "}
          <Retry onClick={() => void context.refetch()} label="Thử lại" />
        </div>
      </div>
    );
  if (
    context.mode === "LEGACY_THEORY" ||
    ((kind === "history" || kind === "progress") && learningModule === "theory")
  )
    return children;
  const key = `${context.scope.userId}:${licenseClass}:${context.scope.policyVersion}:${context.scope.bankVersion ?? "latest"}`;
  if (kind === "history")
    return <SimulationHistoryContent key={key} scope={context.scope} />;
  if (kind === "progress")
    return (
      <SimulationProgressContent
        key={key}
        scope={context.scope}
        license={context.license}
      />
    );
  if (kind === "analytics")
    return <CombinedAnalyticsContent key={key} scope={context.scope} />;
  return <CombinedLeaderboardContent key={key} scope={context.scope} />;
}
