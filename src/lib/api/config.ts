/**
 * Đường dẫn API (cùng origin, rewrite trong next.config.ts proxy sang backend).
 * Khi có API Gateway / reverse proxy: chỉ cần đổi thành URL gateway thật.
 */
export const IDENTITY_API_BASE = "/api/identity";
export const PRACTICE_API_BASE = "/api/practice";
export const PROGRESS_API_BASE = "/api/progress";
