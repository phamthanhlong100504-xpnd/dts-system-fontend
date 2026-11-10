"use client";
import { create } from "zustand";
import { useAuthStore } from "@/stores/auth-store";
import {
  writeLearningModule,
  clearLearningModules,
} from "@/features/simulation-performance/learning-module-preference";
import {
  withReviewReturnContext,
  reviewNeededPath,
} from "./simulation-review-navigation";
import { bookmarksPath } from "./simulation-bookmarks-navigation";
import type { SimulationListReturnContext } from "./simulation-review-types";
/** Navigation preference only: never stores progress, results, bookmarks or media. */
export const useSimulationNavigation = create<{
  ownerId: string | null;
  licenseCode: string | null;
  module: "theory" | "simulation";
  select: (licenseCode: string, module: "theory" | "simulation") => void;
}>((set) => ({
  ownerId: null,
  licenseCode: null,
  module: "theory",
  select: (licenseCode, module) => {
    const ownerId = useAuthStore.getState?.().user?.id ?? null;
    if (ownerId) writeLearningModule(ownerId, licenseCode, module);
    set({ ownerId, licenseCode, module });
  },
}));
// Clear the previous account's UI preference; all business caches stay owned by their existing services.
useAuthStore.subscribe?.((next, prev) => {
  if (prev.user?.id && next.user?.id !== prev.user.id) {
    clearLearningModules(prev.user.id);
    useSimulationNavigation.setState({ ownerId: null });
  }
});
export const simulationRoutes = {
  guide: "/practice/simulations/guide",
  reviewNeeded: reviewNeededPath,
  bookmarks: bookmarksPath,
  chapters: "/practice/simulations/chapters",
  chapter: (id: string) =>
    `/practice/simulations/chapters/${encodeURIComponent(id)}`,
  scenario: (
    id: string,
    chapterId: string,
    filter = "ALL",
    page = 0,
    attemptId?: string,
    reviewContext?: SimulationListReturnContext,
  ) =>
    withReviewReturnContext(
      `/practice/simulations/scenarios/${encodeURIComponent(id)}?chapter=${encodeURIComponent(chapterId)}&filter=${encodeURIComponent(filter)}&page=${page}${attemptId ? `&attempt=${encodeURIComponent(attemptId)}` : ""}`,
      reviewContext,
    ),
};
