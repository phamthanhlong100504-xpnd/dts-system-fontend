import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useCallback, useSyncExternalStore } from "react";

interface LicenseState {
  selectedLicense: string | null;

  setSelectedLicense: (license: string) => void;
  clearSelectedLicense: () => void;
}

export const useLicenseStore = create<LicenseState>()(
  persist(
    (set) => ({
      selectedLicense: null,

      setSelectedLicense: (license) =>
        set({
          selectedLicense: license,
        }),

      clearSelectedLicense: () =>
        set({
          selectedLicense: null,
        }),
    }),
    {
      name: "dts-license",
      skipHydration: true,
    }
  )
);

export function useLicenseHasHydrated(): boolean {
  const subscribe = useCallback(
    (onChange: () => void) =>
      useLicenseStore.persist.onFinishHydration(onChange),
    []
  );

  return useSyncExternalStore(
    subscribe,
    () => useLicenseStore.persist.hasHydrated(),
    () => false
  );
}

export function getSelectedLicense(): string | null {
  if (
    typeof window !== "undefined" &&
    !useLicenseStore.persist.hasHydrated()
  ) {
    useLicenseStore.persist.rehydrate();
  }

  return useLicenseStore.getState().selectedLicense;
}