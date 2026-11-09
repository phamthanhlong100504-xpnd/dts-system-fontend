import type { SimulationGuideSource } from "./simulation-guide-types";
import { contentBuilderApi } from "@/lib/api";
import { assertGuideSession } from "./simulation-guide-access";
import { createSimulationGuideHttpSource } from "./simulation-guide-http-source";
const source = createSimulationGuideHttpSource(
  contentBuilderApi,
  assertGuideSession,
);
/** Card04 uses the existing Content Builder client and Identity session; no content fallback. */
export function getSimulationGuideSource(): SimulationGuideSource | null {
  return source;
}
