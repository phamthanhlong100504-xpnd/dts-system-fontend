import { contentBuilderApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { canAdmin, type AdminAccess } from '../foundation/admin-access';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const sha = /^[0-9a-f]{64}$/;
type RecordData = Record<string, unknown>;
export type ReleaseStep = 'capture' | 'approve' | 'reject' | 'verify-media' | 'prepare' | 'activate';
export interface ApprovedSimulationVersion { versionId: string; revision: number; bankVersion: string; }
export interface ReleaseWorkflowStatus {
  releaseId: string;
  releaseType: string;
  status: string;
  bankVersion: string;
  sourceRevision: number;
  candidateHash: string | null;
  snapshotHash: string | null;
  contentApproved: boolean;
  mediaVerified: boolean;
  mediaExpected: number | null;
  mediaCount: number | null;
  consumerStatus: string | null;
  consumerHash: string | null;
  canPublish: boolean;
  blockers: string[];
}
function object(v: unknown): RecordData {
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('Backend trả về dữ liệu không hợp lệ.');
  return v as RecordData;
}
function text(v: unknown): string { return typeof v === 'string' ? v : ''; }
function number(v: unknown): number {
  if (!Number.isSafeInteger(v) || (v as number) < 0) throw new Error('Revision/số liệu không hợp lệ.');
  return v as number;
}
function validUuid(v: unknown): v is string { return typeof v === 'string' && uuid.test(v); }
export function ensureReleaseActor(actor: string): void {
  const current = useAuthStore.getState();
  if (!validUuid(actor) || !current.accessToken || current.user?.id !== actor) {
    throw new Error('Phiên đăng nhập Admin đã thay đổi. Hãy tải lại trước khi thao tác.');
  }
}
function requireGrant(access: AdminAccess, resource: string, action: string): void {
  ensureReleaseActor(access.actorId);
  if (!canAdmin(access, resource, action)) throw new Error('Thiếu quyền Admin cho thao tác.');
}
async function get(actor: string, url: string, params?: Record<string, unknown>): Promise<RecordData> {
  ensureReleaseActor(actor);
  const value = object(await contentBuilderApi.get<unknown>(url, params ? {params} : undefined));
  ensureReleaseActor(actor);
  return value;
}
async function send(actor: string, url: string, body?: unknown, params?: Record<string, unknown>): Promise<RecordData> {
  ensureReleaseActor(actor);
  const value = object(await contentBuilderApi.post<unknown>(url, body, params ? {params} : undefined));
  ensureReleaseActor(actor);
  return value;
}
function base(id: string): string {
  if (!validUuid(id)) throw new Error('Mã đợt phát hành không hợp lệ.');
  return `/v1/admin/releases/${encodeURIComponent(id)}`;
}
function exactId(result: RecordData, id: string): RecordData {
  if (result.releaseId !== id) throw new Error('Backend trả kết quả của đợt phát hành khác.');
  return result;
}
function simulationOnly(release: RecordData): void {
  if (release.releaseType !== 'SIMULATION_BANK') {
    throw new Error('Luồng này chỉ dành cho ngân hàng mô phỏng; nội dung lý thuyết chưa được kích hoạt.');
  }
}
export async function approvedSimulationVersions(access: AdminAccess): Promise<ApprovedSimulationVersion[]> {
  requireGrant(access,'content-releases','create');
  requireGrant(access,'simulation-scenarios','publish');
  const page = await get(access.actorId, '/v1/admin/revisions',
    {resourceType:'simulation-scenarios',status:'APPROVED',page:0,size:100});
  if (!Array.isArray(page.content)) throw new Error('Danh sách phiên bản duyệt không hợp lệ.');
  return page.content.map(entry => {
    const r=object(entry);
    if (!validUuid(r.versionId) || r.resourceType !== 'simulation-scenarios' ||
        r.status !== 'APPROVED' || typeof r.resourceId !== 'string') {
      throw new Error('Phiên bản duyệt không thuộc nguồn mô phỏng.');
    }
    return {versionId:r.versionId,revision:number(r.revision),bankVersion:r.resourceId};
  }).filter(x => x.revision >= 1);
}
export async function createSimulationRelease(access: AdminAccess, version: ApprovedSimulationVersion): Promise<string> {
  requireGrant(access,'content-releases','create');
  requireGrant(access,'simulation-scenarios','publish');
  if (!validUuid(version.versionId) || version.revision<1 || !version.bankVersion) throw new Error('Phiên bản không hợp lệ.');
  const actual = await get(access.actorId,`/v1/admin/revisions/${version.versionId}`);
  if (actual.status !== 'APPROVED' || actual.resourceType !== 'simulation-scenarios' ||
      actual.resourceId !== version.bankVersion || actual.revision !== version.revision) {
    throw new Error('Phiên bản hoặc revision đã thay đổi.');
  }
  const result = await send(access.actorId,'/v1/admin/releases',
    {releaseType:'SIMULATION_BANK',approvedVersionId:version.versionId,expectedRevision:version.revision});
  if (!validUuid(result.releaseId) || result.releaseType !== 'SIMULATION_BANK' ||
      result.sourceVersionId !== version.versionId) throw new Error('Backend chưa xác nhận đợt phát hành đã tạo.');
  return result.releaseId;
}
/** Only confirmed receipts are displayed. Missing evidence never becomes a success. */
export async function readSimulationReleaseWorkflow(access: AdminAccess, id: string): Promise<ReleaseWorkflowStatus> {
  requireGrant(access,'content-releases','read');
  const b=base(id),release=exactId(await get(access.actorId,b),id);
  const releaseType=text(release.releaseType);
  if (!releaseType) throw new Error('Thiếu loại phát hành.');
  const baseState: ReleaseWorkflowStatus={releaseId:id,releaseType,status:text(release.releaseStatus),
    bankVersion:text(release.resourceId),sourceRevision:number(release.sourceRevision),
    candidateHash:null,snapshotHash:null,contentApproved:false,mediaVerified:false,
    mediaExpected:null,mediaCount:null,consumerStatus:null,consumerHash:null,canPublish:false,blockers:[]};
  if (releaseType!=='SIMULATION_BANK') {
    return {...baseState,blockers:['Loại nội dung chưa có consumer kích hoạt được nghiệm thu.']};
  }
  // Each absent stage is expected (HTTP 404), so report PENDING rather than inventing READY.
  const checks=await Promise.allSettled([
    get(access.actorId,`${b}/manifest-evidence`),
    get(access.actorId,`${b}/review-evidence`),
    get(access.actorId,`${b}/approval-reconciliation`),
    get(access.actorId,`${b}/media-verification`),
    get(access.actorId,`${b}/sync-status`),
  ]);
  ensureReleaseActor(access.actorId);
  const v=checks.map((r,i)=>{
    if(r.status==='fulfilled')return exactId(r.value,id);
    // Treat unavailable sources as blockers; never silently promote a failed request.
    baseState.blockers.push(['Chưa xác minh manifest','Chưa có snapshot đã đóng băng',
      'Chưa đối soát phê duyệt','Chưa có bằng chứng Media','Chưa xác minh Practice ACK'][i]);
    return null;
  });
  const manifest=v[0],capture=v[1],approval=v[2],media=v[3],consumer=v[4];
  if(manifest && typeof manifest.candidateSnapshotSha256==='string' && sha.test(manifest.candidateSnapshotSha256))
    baseState.candidateHash=manifest.candidateSnapshotSha256;
  if(capture && typeof capture.snapshotSha256==='string' && sha.test(capture.snapshotSha256))
    baseState.snapshotHash=capture.snapshotSha256;
  baseState.contentApproved=approval?.contentApproved===true;
  baseState.mediaVerified=approval?.mediaStorageVerified===true && media?.mediaStorageVerified===true;
  baseState.mediaExpected=typeof media?.expectedMedia==='number'?number(media.expectedMedia):null;
  baseState.mediaCount=typeof media?.verifiedMedia==='number'?number(media.verifiedMedia):null;
  baseState.consumerStatus=consumer?text(consumer.consumerStatus):null;
  baseState.consumerHash=consumer?text(consumer.snapshotSha256):null;
  baseState.canPublish=approval?.canPublish===true && baseState.contentApproved && baseState.mediaVerified &&
    baseState.consumerStatus==='PREPARED' && consumer?.checksumVerified===true;
  if(approval?.blockingReasons && Array.isArray(approval.blockingReasons)){
    baseState.blockers.push(...approval.blockingReasons.filter((x):x is string=>typeof x==='string'));
  }
  return baseState;
}
export async function runSimulationReleaseStep(
  access:AdminAccess,id:string,step:ReleaseStep,
  confirmation:{note?:string;reviewed?:boolean;confirmSuffix?:string} = {}
):Promise<string> {
  requireGrant(access,'content-releases','read');
  const b=base(id),release=exactId(await get(access.actorId,b),id);
  simulationOnly(release);
  const version=number(release.sourceRevision);
  if(version<1)throw new Error('Revision nguồn không hợp lệ.');
  const status=text(release.releaseStatus);
  const prereq=await readSimulationReleaseWorkflow(access,id);
  switch(step){
    case 'capture': {
      requireGrant(access,'content-releases','update');
      requireGrant(access,'simulation-scenarios','publish');
      if(!['CREATED','FAILED'].includes(status) || !prereq.candidateHash)
        throw new Error('Chưa đủ bằng chứng snapshot để đóng băng.');
      const m=exactId(await get(access.actorId,`${b}/manifest-evidence`),id);
      if(m.approvedMetadataUnchanged!==true || m.candidateFound!==true ||
         m.candidateStructureVerified!==true || m.observedMediaReferences!==240 ||
         m.candidateSnapshotSha256!==prereq.candidateHash)throw new Error('Snapshot chưa đạt kiểm tra backend.');
      const result=exactId(await send(access.actorId,`${b}/capture-review-evidence`,
        {expectedSourceRevision:version,expectedSnapshotSha256:prereq.candidateHash}),id);
      if(result.snapshotSha256!==prereq.candidateHash)throw new Error('Checksum snapshot không khớp.');
      return 'Đã lưu snapshot phục vụ thẩm định; chưa phải công bố.';
    }
    case 'approve': case 'reject': {
      requireGrant(access,'content-releases','approve');
      requireGrant(access,'simulation-scenarios','approve');
      const note=(confirmation.note??'').trim();
      if(note.length<20||note.length>1000)throw new Error('Lý do thẩm định phải dài từ 20 đến 1.000 ký tự.');
      if(step==='approve'&&confirmation.reviewed!==true)
        throw new Error('Phải tự xác nhận đã thẩm định nội dung video và chấm điểm.');
      if(!prereq.snapshotHash || !['CREATED','FAILED'].includes(status))throw new Error('Chưa có snapshot để duyệt.');
      const result=exactId(await send(access.actorId,`${b}/content-review`,
        {expectedSourceRevision:version,expectedSnapshotSha256:prereq.snapshotHash,
          decision:step==='approve'?'APPROVED':'REJECTED',reviewNotes:note,
          videoAndScoringReviewed:step==='approve'&&confirmation.reviewed===true}),id);
      if(result.decision!==(step==='approve'?'APPROVED':'REJECTED'))throw new Error('Không xác nhận được quyết định.');
      return step==='approve'?'Đã lưu duyệt độc lập; chưa xác minh Media.':'Đã từ chối nội dung.';
    }
    case 'verify-media': {
      requireGrant(access,'content-releases','update');
      requireGrant(access,'simulation-scenarios','publish');
      if(!prereq.contentApproved)throw new Error('Chưa có phê duyệt nội dung độc lập.');
      const result=exactId(await send(access.actorId,`${b}/verify-media`,undefined,{limit:4}),id);
      const media=object(result.status);
      if(media.releaseId!==id)throw new Error('Phản hồi Media không khớp.');
      const count=number(media.verifiedMedia),expected=number(media.expectedMedia);
      return `Đã xác minh ${count}/${expected} tài nguyên Media. Thực hiện lại nếu còn thiếu.`;
    }
    case 'prepare': {
      requireGrant(access,'content-releases','update');
      requireGrant(access,'simulation-scenarios','publish');
      if(!prereq.contentApproved||!prereq.mediaVerified)
        throw new Error('Chưa đủ bằng chứng duyệt và Media; không gửi Practice.');
      const result=exactId(await send(access.actorId,`${b}/prepare`),id);
      if(result.consumerStatus!=='PREPARED'||result.releaseStatus!=='READY'||result.checksumVerified!==true)
        throw new Error('Practice chưa xác nhận READY/PREPARED và checksum.');
      return 'Practice đã nhận bản PREPARED. Chưa kích hoạt cho học viên.';
    }
    case 'activate': {
      requireGrant(access,'content-releases','publish');
      requireGrant(access,'simulation-scenarios','publish');
      requireGrant(access,'simulation-exam-sets','publish');
      if(confirmation.confirmSuffix!==id.slice(-8))throw new Error('Nhập chính xác 8 ký tự cuối mã phát hành để xác nhận.');
      if(status!=='READY'||!prereq.canPublish || !prereq.snapshotHash ||
         prereq.snapshotHash!==prereq.consumerHash)
        throw new Error('Chưa đủ READY, checksum hoặc Practice PREPARED để kích hoạt.');
      const response=await contentBuilderApi.get<unknown>('/v1/admin/simulations/bank-drafts');
      ensureReleaseActor(access.actorId);
      if(!Array.isArray(response))throw new Error('Danh sách bản nháp mô phỏng không hợp lệ.');
      const matches=response.filter(x=>{
        const r=object(x);
        return r.targetBankVersion===release.resourceId && r.status==='STAGED' && validUuid(r.draftId);
      });
      if(matches.length!==1)throw new Error('Không tìm thấy duy nhất một ngân hàng đã STAGED cùng phiên bản.');
      const draft=object(matches[0]);
      const result=await send(access.actorId,
        `/v1/admin/simulations/bank-drafts/${encodeURIComponent(draft.draftId as string)}/activate`,
        undefined,{releaseId:id});
      if(result.releaseId!==id||result.status!=='ACTIVE' || result.bankVersion!==release.resourceId)
        throw new Error('Backend chưa xác nhận kích hoạt đúng đợt phát hành.');
      const after=exactId(await get(access.actorId,b),id);
      if(after.releaseStatus!=='ACTIVE')throw new Error('Chưa đọc lại được trạng thái ACTIVE.');
      return 'Đã xác nhận ACTIVE từ Backend và đọc lại sổ phát hành.';
    }
  }
}
