import { practiceApi } from "@/lib/api";
import { assertExamSession } from "./simulation-exam-access";
import { createSimulationExamHttpSource } from "./simulation-exam-http-source";
export const simulationExamHttpSource = createSimulationExamHttpSource(
  practiceApi,
  assertExamSession,
);
