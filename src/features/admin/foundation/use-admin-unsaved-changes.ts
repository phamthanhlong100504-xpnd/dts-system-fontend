"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** For new/revision-aware forms. Existing accepted Guide keeps its own guard.
 * Bind requestLeave to programmatic navigation, cancel and close buttons too.
 * No history rewriting or automatic draft writes are performed.
 */
export function useAdminUnsavedChanges(dirty: boolean, processing = false) {
  const [pending, setPending] = useState<{ run: () => void } | null>(null);
  const allowedLeave = useRef(false);
  const requestLeave = useCallback((run: () => void) => {
    if (processing) return;
    if (dirty) setPending({ run }); else run();
  }, [dirty, processing]);
  useEffect(() => {
    if (!dirty && !processing) { allowedLeave.current = false; return; }
    const unload = (event: BeforeUnloadEvent) => { if (!allowedLeave.current) { event.preventDefault(); event.returnValue = ""; } };
    const click = (event: MouseEvent) => {
      if (allowedLeave.current || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const element = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(element instanceof HTMLAnchorElement) || element.target === "_blank" || element.hasAttribute("download")) return;
      const target = new URL(element.href, window.location.href);
      if (!["http:", "https:"].includes(target.protocol) || target.href === window.location.href ||
        (target.origin === window.location.origin && target.pathname === window.location.pathname && target.search === window.location.search)) return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (!processing) setPending({ run: () => window.location.assign(target.href) });
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", click, true);
    return () => { window.removeEventListener("beforeunload", unload); document.removeEventListener("click", click, true); };
  }, [dirty, processing]);
  return {
    leaveOpen: pending !== null,
    requestLeave,
    cancelLeave: () => { allowedLeave.current = false; setPending(null); },
    confirmLeave: () => { if (!processing && pending) { const run = pending.run; allowedLeave.current = true; setPending(null); run(); } },
  };
}
