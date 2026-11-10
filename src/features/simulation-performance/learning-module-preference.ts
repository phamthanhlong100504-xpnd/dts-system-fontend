/** Only a UI preference; never stores results, bank contents, bookmarks or credentials. */
const prefix = "dts-learning-module:";
export function readLearningModule(
  userId: string,
  license: string,
): "theory" | "simulation" {
  try {
    return typeof window !== "undefined" &&
      window.sessionStorage.getItem(`${prefix}${userId}:${license}`) ===
        "simulation"
      ? "simulation"
      : "theory";
  } catch {
    return "theory";
  }
}
export function writeLearningModule(
  userId: string,
  license: string,
  module: "theory" | "simulation",
) {
  if (!userId) return;
  try {
    window.sessionStorage.setItem(`${prefix}${userId}:${license}`, module);
  } catch {
    /* navigation still works in memory */
  }
}
export function clearLearningModules(userId: string) {
  try {
    for (const key of Object.keys(window.sessionStorage))
      if (key.startsWith(`${prefix}${userId}:`))
        window.sessionStorage.removeItem(key);
  } catch {
    /* no persisted business state */
  }
}
