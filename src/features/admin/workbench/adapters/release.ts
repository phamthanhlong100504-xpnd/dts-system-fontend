/** BE Admin 02 release ledger reader. Does NOT emulate publish or activate.
 * Content Builder ReleaseController currently exposes no /publish or /activate.
 */
import {contentBuilderApi,ApiError} from '@/lib/api';
import {useAuthStore} from '@/stores/auth-store';
import {canAdmin,type AdminAccess} from '../../foundation/admin-access';
import type {Page} from '../model';
import {releaseLabel,type ReleaseDetail,type ReleaseFilter,type ReleaseRow,type ReleaseSource,type ReleaseStatus} from '../release-model';

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type J=Record<string,unknown>;
const object=(v:unknown):J=>{if(!v||typeof v!=='object'||Array.isArray(v))throw new Error('Dữ liệu đợt phát hành chưa hợp lệ.');return v as J;};
const text=(v:unknown):string=>typeof v==='string'?v:'';
const date=(v:unknown):string|null=>typeof v==='string'&&Number.isFinite(Date.parse(v))?v:null;
const optional=(v:unknown):string|null=>v==null?null:typeof v==='string'?v:null;
const types:Record<string,string>={
 THEORY_QUESTION_BANK:'Ngân hàng lý thuyết',TRAFFIC_SIGN_BANK:'Ngân hàng biển báo',
 MEMORY_TIP_BANK:'Mẹo ghi nhớ',PRACTICE_PRESET_BANK:'Bộ đề luyện tập',
 SIMULATION_BANK:'Ngân hàng mô phỏng',SIMULATION_EXAM_SETS:'Bộ đề mô phỏng',SIMULATION_GUIDE:'Hướng dẫn mô phỏng',
};
function assertActor(actor:string){const s=useAuthStore.getState();if(s.user?.id!==actor||!s.accessToken)throw new ApiError('Phiên quản trị đã thay đổi.',401);}
async function get<T>(actor:string,url:string,config?:{params?:Record<string,unknown>;signal?:AbortSignal}):Promise<T>{
 assertActor(actor);const data=await contentBuilderApi.get<T>(url,config);assertActor(actor);return data;
}
export function parseRelease(value:unknown):{row:ReleaseRow;revision:number;raw:J} {
 const r=object(value),id=r.releaseId;
 if(typeof id!=='string'||!uuid.test(id)||typeof r.releaseType!=='string'||!Object.hasOwn(types,r.releaseType)||
    typeof r.sourceVersionId!=='string'||!uuid.test(r.sourceVersionId)||
    !Number.isSafeInteger(r.sourceRevision)||(r.sourceRevision as number)<1||
    typeof r.releaseStatus!=='string'||!Object.hasOwn(releaseLabel,r.releaseStatus)||
    !Array.isArray(r.consumers)||!date(r.createdAt))throw new Error('Trường bắt buộc của bản phát hành không hợp lệ.');
 const status=r.releaseStatus as ReleaseStatus;
 const row:ReleaseRow={id,label:`${types[r.releaseType]} · ${id.slice(0,8)}`,resourceLabel:types[r.releaseType],
  bankVersion:text(r.bankVersion)||'Chưa xác nhận',sourceVersion:r.sourceVersionId as string,status,
  updatedAt:date(r.activatedAt)||date(r.publishedAt)||date(r.createdAt)};
 return {row,revision:r.sourceRevision as number,raw:r};
}
function readAudit(value:unknown):NonNullable<ReleaseDetail['auditTrail']>{
 if(!Array.isArray(value))throw new Error('Nhật ký phát hành không hợp lệ.');
 return value.map(x=>{const r=object(x);if(typeof r.auditId!=='string'||!uuid.test(r.auditId)||typeof r.action!=='string'||
  typeof r.outcome!=='string'||!date(r.occurredAt))throw new Error('Bản ghi audit chưa đầy đủ.');
  return {id:r.auditId,action:r.action,outcome:r.outcome,reasonCode:optional(r.reasonCode),
   actorId:optional(r.actorId),occurredAt:r.occurredAt as string};});
}
export function makeAdminReleaseSource(access:AdminAccess|null):ReleaseSource|null {
 const actor=access?.actorId;
 if(!actor||!canAdmin(access,'content-releases','read'))return null;
 const auditAuthorized=canAdmin(access,'content-releases','audit');
 const source:ReleaseSource={actorId:actor,
  async list(filter:ReleaseFilter,signal?:AbortSignal):Promise<Page<ReleaseRow>>{
   // BE02 only supports GET ?limit=1..100. Pagination/filter are scoped to these latest 100,
   // never represented as a search of the entire release database.
   const result=await get<unknown>(actor,'/v1/admin/releases',{params:{limit:100},signal});
   if(!Array.isArray(result))throw new Error('Danh sách Release phải là mảng từ backend.');
   const rows=result.map(x=>parseRelease(x).row);
   const from=filter.from?Date.parse(`${filter.from}T00:00:00`):NaN;
   const to=filter.to?Date.parse(`${filter.to}T23:59:59.999`):NaN;
   const filtered=rows.filter(r=>{
    if(filter.keyword&&!`${r.id} ${r.label} ${r.sourceVersion}`.toLowerCase().includes(filter.keyword.toLowerCase()))return false;
    if(filter.status&&r.status!==filter.status)return false;
    if(filter.bankVersion&&r.bankVersion!==filter.bankVersion)return false;
    const t=r.updatedAt?Date.parse(r.updatedAt):NaN;
    if(filter.from&&(!Number.isFinite(from)||!(t>=from)))return false;
    if(filter.to&&(!Number.isFinite(to)||!(t<=to)))return false;
    return true;
   });
   return {items:filtered.slice(filter.page*filter.size,(filter.page+1)*filter.size),page:filter.page,size:filter.size,totalElements:filtered.length};
  },
  async detail(id:string,signal?:AbortSignal):Promise<ReleaseDetail>{
   if(!uuid.test(id))throw new Error('Mã Release không hợp lệ.');
   const raw=await get<unknown>(actor,`/v1/admin/releases/${encodeURIComponent(id)}`,{signal});
   const {row,revision,raw:r}=parseRelease(raw);
   if(row.id!==id)throw new Error('Release được trả về không khớp yêu cầu.');
   const consumers=r.consumers as unknown[];
   const audits=auditAuthorized?readAudit(await get<unknown>(actor,`/v1/admin/releases/${encodeURIComponent(id)}/audit`,{signal})):undefined;
   const safeConsumers=consumers.map(v=>{
    const c=object(v);
    if(typeof c.service!=='string'||typeof c.status!=='string'||typeof c.checksumVerified!=='boolean')
      throw new Error('Trạng thái nơi tiếp nhận không hợp lệ.');
    return {id:c.service,label:c.service,sourceVersion:text(r.bankVersion)||'Chưa xác nhận',
      targetVersion:optional(c.receivedVersion),status:c.status,appliedAt:date(c.syncedAt),safeError:optional(c.lastErrorCode)};
   });
   return {actorId:actor,row,revision,actions:[],issues:typeof r.lastErrorCode==='string'&&r.lastErrorCode?
     [{severity:'ERROR',message:`Mã lỗi backend: ${r.lastErrorCode}`,field:null,itemId:null}]:[],
    consumers:safeConsumers,history:[],canRestoreVersionIds:[],createdAt:date(r.createdAt),
    createdByLabel:optional(r.createdBy),auditTrail:audits,
    resources:[{id:text(r.resourceId),label:text(r.resourceType)||row.resourceLabel,
      versionLabel:row.sourceVersion,count:null,checksum:optional(r.manifestChecksum),dependencies:[],href:null}]};
  },
  // Deliberately no mutation entry points: BE02 lacks a safe publication/activation contract.
  async eligibleVersions(){throw new Error('Chưa mở quy trình tạo đợt phát hành khi backend chưa hoàn tất kích hoạt.');},
  async canCreate(){return false;},
  async create(){throw new Error('Tạo đợt phát hành tạm khóa cho đến khi quy trình kích hoạt hoàn chỉnh được nghiệm thu.');},
  async act(){throw new Error('Backend chưa có hợp đồng công bố/kích hoạt an toàn; không thực hiện thao tác.');},
 };
 return source;
}
