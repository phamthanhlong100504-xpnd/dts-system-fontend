'use client';
import { useRef, useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { contentFingerprint } from '../theory/theory-contract';
import { adminFailure } from '../foundation/admin-errors';
import { assertSnapshot, contentProblem, mayAct, mayPublish, validationCurrent, assertPreview } from './rules';
import type { Action, DraftContent, ResourceSource, Snapshot, Validation } from './model';

type Transition = Exclude<Action, 'read'|'create'|'save'|'validate'|'media'|'scoring'>;
export function useResourceEditor(source: ResourceSource|null, initial: Snapshot|null) {
  const [snapshot, setSnapshot] = useState(initial);
  const [value, setValue] = useState<DraftContent|null>(initial ? structuredClone(initial.content) : null);
  const [validation, setValidation] = useState<Validation|null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [unconfirmed, setUnconfirmed] = useState(false);
  const lock = useRef(false);
  const actor = useAuthStore(s => s.user?.id), token = useAuthStore(s => s.accessToken);
  const dirty = Boolean(snapshot && value && contentFingerprint(value) !== contentFingerprint(snapshot.content));
  const assertActor = () => {
    const current = useAuthStore.getState();
    if (!snapshot || !source || !token || current.user?.id !== actor || current.accessToken !== token || source.actorId !== actor)
      throw new Error('Tài khoản quản trị đã thay đổi.');
  };
  const run = async <T,>(fn: () => Promise<T>, write = false): Promise<T|undefined> => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try {
      assertActor();
      if (write && unconfirmed) throw new Error('Cần tải lại trạng thái trước khi tiếp tục.');
      const result = await fn();
      assertActor();
      return result;
    } catch (e) {
      setError(adminFailure(e, 'Chưa xác nhận được kết quả. Nội dung đang nhập được giữ lại.').message);
      if (write) setUnconfirmed(true);
    } finally { lock.current = false; setBusy(false); }
  };
  const accept = (next: Snapshot) => {
    setSnapshot(next); setValue(structuredClone(next.content)); setValidation(null); setUnconfirmed(false);
  };
  const change = (patch: Partial<DraftContent>) => {
    if (!source || !token || !snapshot || !mayAct(snapshot, 'save', actor) || busy || unconfirmed) return;
    setValue(old => old ? {...old, ...patch} : old); setValidation(null); setNotice('');
  };
  const save = async () => {
    if (!snapshot || !value || !mayAct(snapshot, 'save', actor)) return;
    const problem = contentProblem(snapshot, value, false);
    if (problem) { setError(problem); return; }
    const submitted = structuredClone(value);
    const result = await run(async () => {
      const next = assertSnapshot(await source!.save(snapshot, submitted, snapshot.revision), actor!, snapshot.kind, snapshot.id);
      if (next.versionId !== snapshot.versionId || next.row.status !== 'DRAFT' || next.revision <= snapshot.revision)
        throw new Error('Chưa xác nhận đúng bản nháp sau khi lưu.');
      return next;
    }, true);
    if (result) { accept(result); setNotice('Đã lưu bản nháp theo phản hồi xác nhận.'); }
  };
  const validate = async () => {
    if (!snapshot || !value || dirty || !mayAct(snapshot, 'validate', actor)) { setError('Lưu thay đổi trước khi kiểm tra phiên bản.'); return; }
    const result = await run(async () => {
      const checked = await source!.validate(snapshot, snapshot.revision);
      if (!validationCurrent(checked, snapshot, value)) throw new Error('Kết quả kiểm tra không khớp phiên bản, cần kiểm tra lại.');
      return checked;
    });
    if (result) { setValidation(result); setNotice('Đã nhận kết quả kiểm tra của phiên bản hiện tại.'); }
  };
  const transition = async (action: Transition, reason: string) => {
    if (!snapshot || !value || dirty || !mayAct(snapshot, action, actor)) { setError('Chưa đủ quyền hoặc cần lưu thay đổi trước khi tiếp tục.'); return; }
    if (['submit','publish'].includes(action) && (!validationCurrent(validation,snapshot,value) || validation!.issues.some(i => i.severity === 'ERROR'))) { setError('Kiểm tra lại phiên bản trước khi gửi duyệt hoặc công bố.'); return; }
    if (action === 'publish' && !mayPublish(validation,snapshot,value)) { setError('Phiên bản chưa đủ điều kiện công bố.'); return; }
    if (action === 'reject' && !reason.trim()) { setError('Vui lòng nhập lý do từ chối.'); return; }
    const result = await run(async () => {
      const next = assertSnapshot(await source!.transition(snapshot, action, snapshot.revision, reason), actor!, snapshot.kind);
      const fork = action === 'clone' || action === 'restore';
      if (fork ? next.versionId === snapshot.versionId || next.row.status !== 'DRAFT' : next.id !== snapshot.id || next.versionId !== snapshot.versionId || next.revision <= snapshot.revision)
        throw new Error('Chưa xác nhận được phiên bản sau thao tác.');
      return next;
    }, true);
    if (result) { accept(result); setNotice('Đã đọc lại phiên bản sau thao tác. Theo dõi tình trạng áp dụng tại Phát hành & Đồng bộ.');return result; }
    return null;
  };
  const reload = async () => {
    if (!snapshot) return;
    const result = await run(async () => assertSnapshot(await source!.detail(snapshot.kind,snapshot.id),actor!,snapshot.kind,snapshot.id));
    if (result) { accept(result); setNotice('Đã tải lại trạng thái mới nhất.'); }
  };
  const preview = async (timestampMs: number) => {
    if (!snapshot || !value || dirty || !mayAct(snapshot,'scoring',actor) || (snapshot.row.status==='DRAFT'&&!validationCurrent(validation,snapshot,value))) throw new Error('Lưu và kiểm tra bản nháp trước khi xem trước điểm.');
    assertActor();
    const result = await source!.scorePreview(snapshot,snapshot.revision,timestampMs);
    assertActor(); return assertPreview(result,snapshot,timestampMs);
  };
  return {snapshot,value,validation,busy,dirty,error,notice,unconfirmed,change,save,validate,transition,reload,preview,can:(action:Action)=>Boolean(source&&source.actorId===actor&&token)&&!unconfirmed&&!busy&&mayAct(snapshot,action,actor)};
}
