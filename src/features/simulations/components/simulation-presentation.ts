/** Student layout from /practice/chapters: 24px gutters, 38px on desktop,
 * then a centered 1240px content area. Width excludes the gutters so nested
 * cards and development toolbars never add a second layer of horizontal padding.
 * Keep this module free of client hooks so route-level notices can reuse it.
 */
export const simulationLayout = {
  content: "mx-auto w-[calc(100%-48px)] max-w-[1240px] lg:w-[calc(100%-76px)]",
  navigation: "w-full px-6 lg:px-[38px]",
  background: "bg-[#f7f6fb]",
};

export const simulationSurfaces = {
  card: "rounded-[18px] border border-[#d8e0ee] bg-white shadow-[0_3px_12px_rgba(31,41,55,0.05)]",
  inset: "rounded-[12px] border border-[#dde6f7] bg-[#f1f5fe]",
  badge:
    "inline-flex w-fit max-w-full shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-[#dbe5fb] bg-[#eef2ff] px-2.5 py-1 text-[13px] font-semibold leading-5 text-[#0758d9]",
};

/** Remove a repeated chapter prefix only for display and only if it matches. */
export function chapterDisplayName(
  name: string,
  chapterNumber: number,
): string {
  const roman: Record<number, string> = {
    1: "I",
    2: "II",
    3: "III",
    4: "IV",
    5: "V",
    6: "VI",
  };
  const prefix = /^\s*Chương\s+(\d+|[IVXLCDM]+)\s*[:.·–—-]\s*/i.exec(name);
  if (!prefix) return name;
  const marker = prefix[1].toUpperCase();
  if (marker !== String(chapterNumber) && marker !== roman[chapterNumber])
    return name;
  const title = name.slice(prefix[0].length).trim();
  return title || name;
}
