import { mediaApi, ApiError } from '@/lib/api';
import { discoverKnownMediaReferences, type MediaReferenceCoverage } from '../media/media-reference-coverage';
import { useAuthStore } from '@/stores/auth-store';
import { canAdmin, type AdminAccess } from '../foundation/admin-access';
import { isMediaId } from '../media/admin-media-contract';
import type { MediaPlayback,MediaReference } from './model';

/** `verified=false, totalReferences=null` means backend has NOT established a safe reference count. */
export interface MediaUsage {
 actorId:string;mediaId:string;revision:number|null;references:MediaReference[];
 verified:boolean;totalReferences:number|null;canRetire:boolean;retiredAt:string|null;reason:string|null;
 sources?:MediaReferenceCoverage['sourceStates'];
}
export interface MediaUsageSource {actorId:string;usage(mediaId:string,signal?:AbortSignal):Promise<MediaUsage>;retire(usage:MediaUsage,operationKey:string):Promise<void>;preview(mediaId:string,signal?:AbortSignal):Promise<MediaPlayback>}
function assertActor(actor:string) {
 const auth=useAuthStore.getState();
 if(!auth.accessToken||auth.user?.id!==actor)throw new ApiError('Phiên Admin đã thay đổi.',401);
}
const dataObject=(v:unknown):Record<string,unknown>=>{if(!v||typeof v!=='object'||Array.isArray(v))throw new Error('Dữ liệu Media không hợp lệ.');return v as Record<string,unknown>;};
export function getAdminMediaUsageSource(access?:AdminAccess|null):MediaUsageSource|null {
 const actor=access?.actorId;
 if(!actor||!canAdmin(access,'media','read'))return null;
 return { actorId:actor,
  async usage(mediaId,signal) {
   if(!isMediaId(mediaId))throw new Error('Media ID chưa hợp lệ.');
   assertActor(actor);
   const r=dataObject(await mediaApi.get<unknown>(`/admin/${encodeURIComponent(mediaId)}/references`,{signal}));
   assertActor(actor);
   if(r.mediaId!==mediaId||typeof r.verified!=='boolean'||typeof r.canRetire!=='boolean'||!Array.isArray(r.references))
    throw new Error('Phản hồi tham chiếu Media không khớp hợp đồng.');
   const verified=r.verified;
   const count=r.referenceCount;
   if(count!==null&&(typeof count!=='number'||!Number.isSafeInteger(count)||count<0))throw new Error('Bộ đếm tham chiếu không hợp lệ.');
   // BE02 currently returns verified=false and referenceCount=null; do not translate it to zero.
   if(!verified&&(count!==null||r.canRetire))throw new Error('Backend xác nhận tham chiếu mâu thuẫn.');
   const references:MediaReference[]=r.references.map(x=>{
    const m=dataObject(x);
    if(typeof m.resourceId!=='string'||typeof m.versionId!=='string'||typeof m.label!=='string'||typeof m.status!=='string')
     throw new Error('Tham chiếu Media chưa được xác nhận.');
    return {resourceId:m.resourceId,versionId:m.versionId,label:m.label,status:m.status,href:typeof m.href==='string'?m.href:null};
   });
   if(count!==null&&count<references.length)throw new Error('Danh sách tham chiếu không khớp.');
   const ownerCoverage = await discoverKnownMediaReferences(actor, mediaId, signal);
   assertActor(actor);
   // The global Media controller remains unverified. Owner reports are partial; even zero
   // owner-local references cannot authorize deletion, and total stays unknown.
   if(verified || r.canRetire)throw new Error('Chưa thể xác nhận đầy đủ tham chiếu liên service.');
   return {actorId:actor,mediaId,revision:null,
    references:[...references,...ownerCoverage.references],verified:false,totalReferences:null,
    canRetire:false,retiredAt:null,reason:'Chưa kiểm chứng đủ tất cả nguồn và lịch sử phiên thi. Không thể ngừng sử dụng tài nguyên.',
    sources:ownerCoverage.sourceStates};
  },
  async retire(usage,operationKey) {
   if(!operationKey||usage.actorId!==actor||!mayRetireMedia(usage,actor))throw new Error('Chưa đủ điều kiện ngừng sử dụng.');
   const fresh=await this.usage(usage.mediaId);
   if(!mayRetireMedia(fresh,actor))throw new Error('Không xác minh được an toàn tham chiếu Media.');
   assertActor(actor);
   await mediaApi.post<unknown>(`/admin/${encodeURIComponent(usage.mediaId)}/retire`);
   assertActor(actor);
  },
  async preview(mediaId,signal) {
   if(!isMediaId(mediaId))throw new Error('Media ID chưa hợp lệ.');
   assertActor(actor);
   const r=dataObject(await mediaApi.get<unknown>(`/admin/${encodeURIComponent(mediaId)}/preview`,{signal}));
   assertActor(actor);
   if(r.mediaId!==mediaId||r.status!=='READY'||typeof r.url!=='string')throw new Error('Chưa xác minh được quyền phát Media.');
   const parsed=new URL(r.url);
   if(!['https:','http:'].includes(parsed.protocol)||parsed.username||parsed.password)throw new Error('URL Media không hợp lệ.');
   return {mediaId,url:r.url,expiresAt:null};
  }
 };
}
export function mayRetireMedia(value:MediaUsage,actorId:string):boolean {
 return value.actorId===actorId&&value.verified&&value.canRetire&&value.totalReferences===0&&value.references.length===0&&value.retiredAt===null;
}
