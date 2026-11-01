"use client";
import { create } from "zustand";
import {
  withReviewReturnContext,
  reviewNeededPath,
} from "./simulation-review-navigation";
import { bookmarksPath } from "./simulation-bookmarks-navigation";
import type { SimulationListReturnContext } from "./simulation-review-types";
/** Ephemeral navigation only: never stores progress, results, bookmarks or media. */
export const useSimulationNavigation = create<{
  licenseCode: string | null;
  module: "theory" | "simulation";
  select: (licenseCode: string, module: "theory" | "simulation") => void;
}>((set) => ({
  licenseCode: null,
  module: "theory",
  select: (licenseCode, module) => set({ licenseCode, module }),
}));
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
