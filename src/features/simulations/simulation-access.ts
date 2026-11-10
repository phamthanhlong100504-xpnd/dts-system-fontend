import { useAuthStore } from "@/stores/auth-store";
/** Display/command hints from the existing Identity session; the API still enforces permissions. */
export function simulationCanLearn(state: {
  user: { permissions?: string[] } | null;
  accessToken?: string | null;
}) {
  let permissions: unknown = state.user?.permissions;
  if (permissions === undefined && state.user && state.accessToken) {
    try {
      const payload = state.accessToken.split(".")[1];
      permissions = JSON.parse(
        atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
      ).permissions;
    } catch {
      return false;
    }
  }
  return (
    Array.isArray(permissions) &&
    permissions.some(
      (permission) =>
        typeof permission === "string" &&
        permission.replace(/^PERM_/, "") === "simulations:learn",
    )
  );
}
export function useSimulationCanLearn() {
  return useAuthStore(simulationCanLearn);
}
export function assertSimulationCanLearn() {
  if (!simulationCanLearn(useAuthStore.getState()))
    throw new Error(
      "Tài khoản hiện tại không có quyền luyện hoặc đánh dấu mô phỏng.",
    );
}
