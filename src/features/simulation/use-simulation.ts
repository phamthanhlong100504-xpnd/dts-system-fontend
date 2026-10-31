import { useMutation, useQuery } from "@tanstack/react-query";
import {
  evaluateSimulation,
  getSimulationDetail,
  SimulationDetail,
  SimulationEvaluation,
} from "./simulation-service";

export function useSimulationDetail(scenarioNumber: number) {
  return useQuery<SimulationDetail, Error>({
    queryKey: ["simulation", scenarioNumber],
    queryFn: () => getSimulationDetail(scenarioNumber),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    enabled: scenarioNumber >= 1 && scenarioNumber <= 120,
  });
}

export function useEvaluateSimulation() {
  return useMutation<
    SimulationEvaluation,
    Error,
    { scenarioNumber: number; selectedSecond: number }
  >({
    mutationFn: ({ scenarioNumber, selectedSecond }) =>
      evaluateSimulation(scenarioNumber, selectedSecond),
  });
}

