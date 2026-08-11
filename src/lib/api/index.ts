import { createApiClient } from "./http";
import { IDENTITY_API_BASE, PRACTICE_API_BASE, PROGRESS_API_BASE } from "./config";

/** Client cho từng backend service (proxy qua rewrites trong next.config.ts) */
export const identityApi = createApiClient(IDENTITY_API_BASE);
export const practiceApi = createApiClient(PRACTICE_API_BASE);
export const progressApi = createApiClient(PROGRESS_API_BASE);
export const contentBuilderApi = createApiClient("/api/content-builder");


export * from "./envelope";
export * from "./types";
