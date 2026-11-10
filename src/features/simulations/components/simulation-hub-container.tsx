"use client";
import type { ComponentProps } from "react";
import { useQuery } from "@tanstack/react-query";
import { examCanAccess } from "../simulation-exam-access";
import { getSimulationExamSource } from "../simulation-exam-source";
import { simulationExamKeys } from "../use-simulation-exam";
import { validatePresetPage } from "../simulation-preset-validation";
import { validateExamPreparation } from "../simulation-exam-validation";
import type { LicenseOption } from "@/config/license";
import { useAuthStore } from "@/stores/auth-store";
import { useSimulationRead } from "../use-simulation-learning";
import { useSimulationReviewOverview } from "../use-simulation-review";
import { useSimulationBookmarksOverview } from "../use-simulation-bookmarks";
import type { SimulationHubState } from "../simulation-hub-types";
import { SimulationPracticeHub } from "./simulation-practice-hub";

export function SimulationHubContainer({
  license,
  ...props
}: ComponentProps<typeof SimulationPracticeHub> & { license: LicenseOption }) {
  const userId = useAuthStore((s) => s.user?.id);
  if (!userId || !license.simulationReady || !license.simulationBankVersion)
    return (
      <SimulationPracticeHub
        {...props}
        randomExamStatus="unavailable"
        presetExamStatus="unavailable"
        actions={{ ...props.actions, random: undefined, presets: undefined }}
      />
    );
  return <BoundHub {...props} userId={userId} license={license} />;
}
function BoundHub({
  userId,
  license,
  ...props
}: ComponentProps<typeof SimulationPracticeHub> & {
  userId: string;
  license: LicenseOption;
}) {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const canExam = examCanAccess({ user, accessToken });
  const scope = {
    userId,
    licenseClass: license.code,
    bankVersion: license.simulationBankVersion!,
  };
  const examSource = getSimulationExamSource();
  const exam = useQuery({
    queryKey: [
      ...simulationExamKeys.scope(scope),
      "preparation",
      "",
      scope.bankVersion,
    ],
    enabled: canExam && !!examSource,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!examSource) throw Error("Thi thử chưa sẵn sàng.");
      const preparation = await examSource.preparation(scope);
      validateExamPreparation(preparation, scope);
      return { kind: "preparation" as const, data: preparation };
    },
  });
  const presets = useQuery({
    queryKey: [
      ...simulationExamKeys.scope(scope),
      "presets",
      scope.bankVersion,
    ],
    enabled: canExam && !!examSource?.presets,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!examSource?.presets) throw Error("Bộ đề chưa sẵn sàng.");
      const page = await examSource.presets(scope);
      validatePresetPage(page, scope);
      return page;
    },
  });
  const examPolicy = canExam && exam.isSuccess ? exam.data.data.policy : null;
  const { state, query } = useSimulationRead(
    {
      userId,
      licenseClass: license.code,
      bankVersion: license.simulationBankVersion!,
    },
    "overview",
    [],
    (source) =>
      source.overview({
        userId,
        licenseClass: license.code,
        bankVersion: license.simulationBankVersion!,
      }),
  );
  const review = useSimulationReviewOverview({
    userId,
    licenseClass: license.code,
    bankVersion: license.simulationBankVersion!,
  });
  const bookmarks = useSimulationBookmarksOverview({
    userId,
    licenseClass: license.code,
    bankVersion: license.simulationBankVersion!,
  });
  const hub: SimulationHubState =
    state.status === "ready"
      ? {
          status: "ready",
          summary: {
            bankVersion: state.data.scope.bankVersion,
            chapterCount: state.data.chapters.length,
            ...(examPolicy
              ? {
                  scenariosPerExam: examPolicy.totalScenarios,
                  maxTotalScore: examPolicy.maxTotalScore,
                }
              : {}),
            ...(canExam && presets.isSuccess
              ? {
                  publishedPresetCount: presets.data.totalPublishedSets,
                  completedPresetCount: presets.data.items.filter(
                    (i) => i.latestCompleted !== null,
                  ).length,
                }
              : {}),
            totalScenarios: state.data.totalScenarios,
            practicedScenarios:
              review.query.data?.practicedScenarios ??
              state.data.practicedScenarios,
            ...(review.query.data
              ? { needReviewCount: review.query.data.totalNeedReview }
              : {}),
            ...(bookmarks.query.data
              ? { bookmarkedCount: bookmarks.query.data.totalBookmarked }
              : {}),
          },
        }
      : state;
  return (
    <SimulationPracticeHub
      {...props}
      actions={{
        ...props.actions,
        random: canExam && examSource ? props.actions?.random : undefined,
        presets:
          canExam && examSource?.presets ? props.actions?.presets : undefined,
      }}
      presetExamStatus={
        !canExam || !examSource?.presets
          ? "unavailable"
          : presets.isError
            ? "error"
            : presets.isPending
              ? "loading"
              : undefined
      }
      randomExamStatus={
        !canExam || !examSource
          ? "unavailable"
          : exam.isError
            ? "error"
            : exam.isPending
              ? "loading"
              : undefined
      }
      state={
        bookmarks.enabled && bookmarks.query.isError
          ? {
              status: "error",
              message:
                "Không thể tải tổng quan tình huống đã đánh dấu. Vui lòng thử lại.",
            }
          : review.enabled && review.query.isError
            ? {
                status: "error",
                message:
                  "Không thể tải tổng quan tình huống cần ôn lại. Vui lòng thử lại.",
              }
            : hub
      }
      onRetry={() => {
        void query.refetch();
        void review.query.refetch();
        void bookmarks.query.refetch();
        if (canExam && examSource) void exam.refetch();
        if (canExam && examSource?.presets) void presets.refetch();
      }}
    />
  );
}
