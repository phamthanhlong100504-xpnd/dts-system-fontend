import type { ResourceSource } from './model';
/** Integration boundary. No endpoint/permission is inferred from a PDF proposal.
 * Replace this factory only with a verified adapter backed by the existing API clients.
 * Tests inject ports directly; runtime never loads fixtures or local source JSON.
 */
export function getAdminResourceSource(): ResourceSource | null { return null; }
