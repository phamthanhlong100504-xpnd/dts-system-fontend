import type { QueryClient } from "@tanstack/react-query";
import type { SimulationScope } from "./simulation-learning-types";
/** Related car licenses share a bank. Active scenario/media state is updated by ACK, never background reset. */
export function invalidateSimulationLists(
  client: QueryClient,
  scope: SimulationScope,
) {
  return client.invalidateQueries({
    predicate: (query) =>
      query.queryKey[0] === "simulation-learning" &&
      query.queryKey[1] === scope.userId &&
      query.queryKey[3] !== "scenario" &&
      (!scope.bankVersion ||
        query.queryKey[4] === scope.bankVersion ||
        query.queryKey[4] === "current"),
  });
}
