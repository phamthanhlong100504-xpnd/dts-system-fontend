import type { QueryClient } from "@tanstack/react-query";
/** Active slot and latest completion are actor-wide, including cached licenses. */
export function invalidateExamCatalogues(client: QueryClient, userId: string) {
  return client.invalidateQueries({
    predicate: (q) =>
      q.queryKey[0] === "simulation-exam" &&
      q.queryKey[1] === userId &&
      ["preparation", "presets", "preset-preparation", "active"].includes(
        String(q.queryKey[3]),
      ),
  });
}
