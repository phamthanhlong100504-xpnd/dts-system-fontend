import type { ExamCreateRequest, ExamSession } from "./simulation-exam-types";
import type { SimulationPresetPreparation } from "./simulation-preset-types";
import type { SimulationScope } from "./simulation-learning-types";
import {
  sameExamPolicy,
  validateExamSession,
} from "./simulation-exam-validation";
export function presetCreateIntent(
  scope: SimulationScope,
  data: SimulationPresetPreparation,
  key: string,
) {
  const snapshot = structuredClone(data),
    owner = { ...scope };
  const request: ExamCreateRequest = Object.freeze({
    mode: "PRESET",
    presetSetId: data.preset.presetSetId,
    presetVersionId: data.preset.presetVersionId,
    bankVersion: data.bankVersion,
    idempotencyKey: key,
  });
  return {
    request,
    accept(s: ExamSession) {
      validateExamSession(s, owner);
      if (
        s.mode !== "PRESET" ||
        s.preset.presetSetId !== snapshot.preset.presetSetId ||
        s.preset.presetVersionId !== snapshot.preset.presetVersionId ||
        s.bankVersion !== snapshot.bankVersion ||
        s.preset.title !== snapshot.preset.title ||
        !sameExamPolicy(s.policy, snapshot.policy)
      )
        throw Error("Phiên không khớp bộ đề đã chọn.");
    },
  };
}
