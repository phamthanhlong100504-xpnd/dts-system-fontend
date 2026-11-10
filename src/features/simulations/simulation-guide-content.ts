import type {
  GuideAdminSnapshot,
  GuideContent,
} from "./simulation-guide-types";
/** JSON object key order is not business data; array order remains significant. */
export function guideEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) || Array.isArray(b))
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((v, i) => guideEqual(v, b[i]))
    );
  const x = a as Record<string, unknown>,
    y = b as Record<string, unknown>;
  const keys = Object.keys(x);
  return (
    keys.length === Object.keys(y).length &&
    keys.every((k) => Object.hasOwn(y, k) && guideEqual(x[k], y[k]))
  );
}
/** Projection only. Never replace the raw draft/publication held by the editor. */
export function guidePreviewContent(
  content: GuideContent,
  snapshot: GuideAdminSnapshot,
  published: boolean,
  dirty: boolean,
): GuideContent {
  if (!published && !dirty) return structuredClone(snapshot.preview.content);
  const value = structuredClone(
    published && snapshot.published ? snapshot.published.content : content,
  );
  // Both release policies are projected by the server. Raw historical or
  // unsaved editor text must never override current exam availability.
  value.comparison.exam = structuredClone(
    snapshot.preview.content.comparison.exam,
  );
  return value;
}
