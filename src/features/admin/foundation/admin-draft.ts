/** JSON-compatible draft state. Receiving remote data never overwrites dirty input. */
export interface AdminDraftState<T> {
  revision: number;
  baseline: T;
  value: T;
  remoteRevision: number | null;
}
const same = <T,>(a: T, b: T) => JSON.stringify(a) === JSON.stringify(b);
export const isAdminDraftDirty = <T,>(state: AdminDraftState<T>) => !same(state.value, state.baseline);

export function receiveAdminDraft<T>(state: AdminDraftState<T>, remote: { revision: number; value: T }): AdminDraftState<T> {
  if (remote.revision <= state.revision) return state;
  if (isAdminDraftDirty(state)) return { ...state, remoteRevision: remote.revision };
  return { revision: remote.revision, baseline: structuredClone(remote.value), value: structuredClone(remote.value), remoteRevision: null };
}

export function acknowledgeAdminDraft<T>(state: AdminDraftState<T>, submitted: T, saved: { revision: number; value: T }): AdminDraftState<T> {
  if (!Number.isInteger(saved.revision) || saved.revision <= state.revision) throw new Error("Chưa xác định được phiên bản nội dung. Vui lòng tải lại.");
  return {
    revision: saved.revision,
    baseline: structuredClone(saved.value),
    value: same(state.value, submitted) ? structuredClone(saved.value) : state.value,
    remoteRevision: state.remoteRevision !== null && state.remoteRevision > saved.revision ? state.remoteRevision : null,
  };
}
