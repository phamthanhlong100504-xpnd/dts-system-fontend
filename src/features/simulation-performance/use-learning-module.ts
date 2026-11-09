"use client";
import { useCallback, useSyncExternalStore } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useSimulationNavigation } from "@/features/simulations/simulation-navigation-store";
import { readLearningModule } from "./learning-module-preference";
export function useLearningModule(license: string, enabled: boolean) {
  const userId = useAuthStore((s) => s.user?.id ?? "");
  const subscribe = useCallback((notify: () => void) => {
    const stop = useSimulationNavigation.subscribe(notify);
    window.addEventListener("storage", notify);
    return () => {
      stop();
      window.removeEventListener("storage", notify);
    };
  }, []);
  const snapshot = useCallback(() => {
    if (!enabled) return "theory";
    const s = useSimulationNavigation.getState();
    if (!userId) return s.licenseCode === license ? s.module : "theory";
    return s.ownerId === userId && s.licenseCode === license
      ? s.module
      : readLearningModule(userId, license);
  }, [enabled, userId, license]);
  return useSyncExternalStore(subscribe, snapshot, () => "theory" as const);
}
