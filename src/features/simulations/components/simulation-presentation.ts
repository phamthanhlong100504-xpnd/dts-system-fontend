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
