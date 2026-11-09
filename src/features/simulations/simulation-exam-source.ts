import type { SimulationScope } from "./simulation-learning-types";
import type {
  ExamCommand,
  ExamCreateRequest,
  ExamPlayback,
  ExamPreparation,
  ExamResult,
  ExamReview,
  ExamSession,
} from "./simulation-exam-types";
import type {
  SimulationPresetPage,
  SimulationPresetPreparation,
} from "./simulation-preset-types";
import { simulationExamHttpSource } from "./simulation-exam-service";
/** RANDOM backend port. PRESET remains unavailable until its separate handoff. */
export interface SimulationExamSource {
  shortcuts?: import("./simulation-shortcut-source").ShortcutPort<ExamSession>;
  active?: (scope: SimulationScope) => Promise<ExamSession | null>;
  presets?: (scope: SimulationScope) => Promise<SimulationPresetPage>;
  presetPreparation?: (
    scope: SimulationScope,
    presetSetId: string,
  ) => Promise<SimulationPresetPreparation>;
  preparation: (scope: SimulationScope) => Promise<ExamPreparation>;
  create: (
    scope: SimulationScope,
    request: ExamCreateRequest,
  ) => Promise<ExamSession>;
  session: (scope: SimulationScope, sessionId: string) => Promise<ExamSession>;
  playback: (
    scope: SimulationScope,
    sessionId: string,
  ) => Promise<ExamPlayback>;
  command: (
    scope: SimulationScope,
    request: ExamCommand,
  ) => Promise<ExamSession>;
  result: (scope: SimulationScope, sessionId: string) => Promise<ExamResult>;
  review: (scope: SimulationScope, sessionId: string) => Promise<ExamReview>;
  reviewPlayback: (
    scope: SimulationScope,
    sessionId: string,
    position: number,
  ) => Promise<ExamPlayback>;
}
export function getSimulationExamSource(): SimulationExamSource | null {
  return simulationExamHttpSource;
}
export const simulationExamRoutes = {
  presets: "/practice/simulations/exams/presets",
  preset: (id: string, version?: string, retakeFromVersion?: string) => {
    const q = new URLSearchParams();
    if (version) q.set("version", version);
    if (retakeFromVersion) q.set("retakeFromVersion", retakeFromVersion);
    return `/practice/simulations/exams/presets/${encodeURIComponent(id)}${q.size ? `?${q}` : ""}`;
  },
  preparation: "/practice/simulations/exams/random",
  session: (id: string) =>
    `/practice/simulations/exams/${encodeURIComponent(id)}`,
  result: (id: string) =>
    `/practice/simulations/exams/${encodeURIComponent(id)}/result`,
  review: (id: string, position = 1) =>
    `/practice/simulations/exams/${encodeURIComponent(id)}/review?position=${position}`,
};
