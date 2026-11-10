import { contentBuilderApi, practiceApi, examinationApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

/** Known owner-local references, never a verified cross-service deletion decision. */
export interface KnownMediaReference {
  resourceId: string;
  versionId: string;
  label: string;
  status: string;
  href: string | null;
}
export interface MediaReferenceCoverage {
  references: KnownMediaReference[];
  sourceStates: Array<{ owner: string; status: 'PARTIAL' | 'UNAVAILABLE'; knownCount: number | null; truncated: boolean }>;
}
const isObject = (x: unknown): x is Record<string, unknown> => Boolean(x && typeof x === 'object' && !Array.isArray(x));
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OWNER_LABEL: Record<string, string> = {CONTENT_BUILDER: 'Kho nội dung', PRACTICE: 'Luyện tập và phiên thi mô phỏng', EXAMINATION: 'Thi chính thức'};

function parseOwnerResult(value: unknown, mediaId: string, owner: string) {
  if (!isObject(value) || value.mediaId !== mediaId || value.source !== owner ||
      value.verified !== false || value.canRetire !== false ||
      !Number.isSafeInteger(value.knownReferenceCount) || (value.knownReferenceCount as number) < 0 ||
      typeof value.truncated !== 'boolean' || !Array.isArray(value.references)) {
    throw new Error('Báo cáo tham chiếu không khớp chủ sở hữu.');
  }
  if (value.references.length > 7000 || value.knownReferenceCount !== value.references.length) {
    throw new Error('Số lượng tham chiếu cục bộ không khớp phản hồi.');
  }
  const references: KnownMediaReference[] = value.references.map(row => {
    if (!isObject(row) || typeof row.resourceType !== 'string' ||
        typeof row.resourceId !== 'string' || row.resourceId.length > 256 ||
        typeof row.versionId !== 'string' && row.versionId !== null ||
        typeof row.referenceStatus !== 'string' || typeof row.usageType !== 'string') {
      throw new Error('Định dạng tham chiếu Media không hợp lệ.');
    }
    const kind = row.resourceType;
    const typeName = kind === 'editor-drafts' ? 'Bản nháp biên tập' :
      kind === 'traffic-signs' ? 'Biển báo' :
      kind === 'simulation-scenarios' ? 'Tình huống mô phỏng' :
      kind === 'simulation-exam-positions' ? 'Vị trí trong phiên mô phỏng' :
      kind === 'simulation-attempts' ? 'Lượt luyện mô phỏng' :
      kind === 'official-exams' ? 'Đề thi chính thức' :
      kind === 'official-exam-versions' ? 'Phiên bản đề thi chính thức' :
      kind === 'official-exam-sessions' ? 'Snapshot phiên thi chính thức' : 'Câu hỏi';
    return {resourceId: row.resourceId as string,
      versionId: typeof row.versionId === 'string' ? row.versionId : 'Không có phiên bản',
      label: `${OWNER_LABEL[owner]} · ${typeName} · ${row.resourceId as string}`,
      status: row.referenceStatus as string,
      href: null};
  });
  return {references, sourceState: {owner: OWNER_LABEL[owner], status: 'PARTIAL' as const,
    knownCount: value.knownReferenceCount as number, truncated: value.truncated as boolean}};
}

export async function discoverKnownMediaReferences(actorId: string, mediaId: string, signal?: AbortSignal): Promise<MediaReferenceCoverage> {
  if (!uuid.test(mediaId) || !uuid.test(actorId)) throw new Error('Mã quản trị hoặc Media chưa hợp lệ.');
  const assertActor = () => {
    const state = useAuthStore.getState();
    if (!state.accessToken || state.user?.id !== actorId) throw new Error('Phiên quản trị đã thay đổi.');
  };
  assertActor();
  const results = await Promise.allSettled([
    contentBuilderApi.get<unknown>(`/v1/admin/media-references/${encodeURIComponent(mediaId)}`, {signal}),
    practiceApi.get<unknown>(`/v1/questions/admin/media-references/${encodeURIComponent(mediaId)}`, {signal}),
    examinationApi.get<unknown>(`/v1/admin/media-references/${encodeURIComponent(mediaId)}`, {signal}),
  ]);
  assertActor();
  const references: KnownMediaReference[] = [];
  const sourceStates: MediaReferenceCoverage['sourceStates'] = [];
  for (let i = 0; i < results.length; i++) {
    const owner = i === 0 ? 'CONTENT_BUILDER' : i === 1 ? 'PRACTICE' : 'EXAMINATION';
    const result = results[i];
    if (result.status === 'rejected') {
      // All reads fail independently. Do not infer absence or total=0 from an unavailable owner.
      sourceStates.push({owner: OWNER_LABEL[owner], status: 'UNAVAILABLE', knownCount: null, truncated: false});
      continue;
    }
    const parsed = parseOwnerResult(result.value, mediaId, owner);
    sourceStates.push(parsed.sourceState);
    references.push(...parsed.references);
  }
  return {references, sourceStates};
}
