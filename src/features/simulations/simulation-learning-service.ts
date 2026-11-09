import { assertSimulationCanLearn } from "./simulation-access";
import { practiceApi } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { createSimulationHttpSource } from "./simulation-http-source";

export const simulationHttpSource = createSimulationHttpSource(
  practiceApi,
  (scope) => {
    const auth = useAuthStore.getState();
    if (!auth.accessToken || auth.user?.id !== scope.userId)
      throw new Error("Phiên đăng nhập đã thay đổi. Vui lòng đăng nhập lại.");
  },
  assertSimulationCanLearn,
);
useAuthStore.subscribe((next, previous) => {
  if (!next.accessToken || next.user?.id !== previous.user?.id)
    simulationHttpSource.clear();
});
