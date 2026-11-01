import type { SimulationGuideSource } from "./simulation-guide-types";
/** Connect contentBuilderApi through the approved Gateway contract after backend handoff.
 * No guessed endpoints, local content fallback or successful write simulation.
 */
export function getSimulationGuideSource(): SimulationGuideSource | null {
  return null;
}
/** Frontend release capability, not learner data. Enable only with accepted Card05 integration. */
export const simulationMockExamUiReleased = false;
