import { safeRandomUUID } from "./utils";

if (typeof window !== "undefined") {
  if (!window.crypto) {
    // @ts-expect-error polyfill for non-secure context
    window.crypto = {};
  }
  if (!window.crypto.randomUUID) {
    window.crypto.randomUUID = function () {
      return safeRandomUUID() as `${string}-${string}-${string}-${string}-${string}`;
    };
  }
}
