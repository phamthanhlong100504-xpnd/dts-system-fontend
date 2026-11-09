import {contentBuilderApi} from '@/lib/api';
import {useAuthStore} from '@/stores/auth-store';
import {editorial,uuid,validVersion,obj,type EditorialKind,type BankQuestionDetail} from './source';

/** BE03 mutation bridge. Nothing here publishes, activates, or modifies learner data. */
const safeInt=(x:unknown):x is number=>typeof x==='number'&&Number.isSafeInteger(x)&&x>=0;
const versionOk=(x:string)=>validVersion(x)&&x.length<=128;
function assertActor(){
 const auth=useAuthStore.getState(),id=auth.user?.id,token=auth.accessToken;
 if(!uuid(id)||!token)throw new Error('Chưa có phiên Admin hợp lệ.');
 return ()=>{const now=useAuthStore.getState();if(now.user?.id!==id||now.accessToken!==token)throw new Error('Phiên Admin đã thay đổi.');};
}
async function write(path:string,method:'post'|'patch',body:unknown){
 const check=assertActor();const data=method==='patch'?await contentBuilderApi.patch<unknown>(`/v1/admin/${path}`,body):await contentBuilderApi.post<unknown>(`/v1/admin/${path}`,body);check();return data;
}
async function read(path:string,signal?:AbortSignal){const check=assertActor();const data=await contentBuilderApi.get<unknown>(`/v1/admin/${path}`,{signal});check();return data;}
function kindOk(kind:EditorialKind){if(!Object.prototype.hasOwnProperty.call(editorial,kind))throw new Error('Loại nội dung không được hỗ trợ.');}
function draftIdOk(id:string){if(!uuid(id))throw new Error('Mã bản nháp không hợp lệ.');}
function revOk(rev:number){if(!safeInt(rev)||rev<1)throw new Error('Revision của bản nháp chưa hợp lệ.');}
function reasonOk(value:string){if(!value.trim()||value.length>500)throw new Error('Phải ghi lý do thao tác (tối đa 500 ký tự).');return value.trim();}

export type EditorialDraftSummary={draftId:string;kind:EditorialKind;sourceId:string;proposedVersion:string;state:'DRAFT'|'IN_REVIEW'|'ARCHIVED';revision:number;updatedAt:string};
export type EditorialDraftPage={content:EditorialDraftSummary[];page:number;size:number;total:number};
export function parseEditorialDraftPage(data:unknown,kind:EditorialKind,page:number,size:number):EditorialDraftPage{
 const r=obj(data);
 if(r.page!==page||r.size!==size||!safeInt(r.total)||!Array.isArray(r.content)||r.content.length>size)
   throw new Error('Phân trang bản nháp không đúng hợp đồng Backend.');
 const content=r.content.map((v:unknown)=>{const x=obj(v);
  if(!uuid(x.draftId)||x.kind!==kind||!uuid(x.sourceId)||!versionOk(String(x.proposedVersion))||
     !['DRAFT','IN_REVIEW','ARCHIVED'].includes(String(x.state))||!safeInt(x.revision)||Number(x.revision)<1||
     typeof x.updatedAt!=='string'||!Number.isFinite(Date.parse(x.updatedAt)))
    throw new Error('Bản nháp không hợp lệ hoặc không khớp chủ sở hữu.');
  return x as unknown as EditorialDraftSummary;
 });
 if(new Set(content.map(x=>x.draftId)).size!==content.length)throw new Error('Danh sách bản nháp chứa ID trùng.');
 return {content,page,size,total:r.total};
}
export async function editorialDraftPage(kind:EditorialKind,page:number,size=15,state?:EditorialDraftSummary['state'],signal?:AbortSignal){
 kindOk(kind);
 if(!safeInt(page)||!safeInt(size)||size<1||size>100||state&&!['DRAFT','IN_REVIEW','ARCHIVED'].includes(state))
  throw new Error('Bộ lọc bản nháp không hợp lệ.');
 const query=`editor/drafts/${kind}?page=${page}&size=${size}${state?`&state=${state}`:''}`;
 return parseEditorialDraftPage(await read(query,signal),kind,page,size);
}
export type EditorialDraft={draftId:string;kind:EditorialKind;sourceId:string;sourceStatus:string;proposedVersion:string;state:string;revision:number;payload:Record<string,unknown>;canPublish:boolean;blockers:string[]};
export function parseEditorialDraft(value:unknown,kind:EditorialKind,id?:string):EditorialDraft{
 const r=obj(value);
 if(!uuid(r.draftId)||id&&r.draftId!==id||r.kind!==kind||!uuid(r.sourceId)||!versionOk(String(r.proposedVersion))||!safeInt(r.revision)||Number(r.revision)<1||typeof r.state!=='string'||!['DRAFT','IN_REVIEW','APPROVED','ARCHIVED'].includes(r.state)||!['DRAFT','PUBLISHED','NEW'].includes(String(r.sourceStatus))||typeof r.canPublish!=='boolean'||!Array.isArray(r.blockers)||r.blockers.some(x=>typeof x!=='string'))throw new Error('Backend trả bản nháp không đúng hợp đồng.');
 return {draftId:r.draftId,kind,sourceId:r.sourceId,sourceStatus:r.sourceStatus as string,proposedVersion:r.proposedVersion as string,state:r.state,revision:r.revision,payload:obj(r.payload),canPublish:r.canPublish,blockers:r.blockers as string[]};
}
export async function cloneEditorial(kind:EditorialKind,sourceId:string,proposedVersion:string){
 kindOk(kind);draftIdOk(sourceId);if(!versionOk(proposedVersion))throw new Error('Mã phiên bản mới không hợp lệ.');
 return parseEditorialDraft(await write(`editor/${kind}/${sourceId}/clone-draft`,'post',{proposedVersion}),kind);
}
export async function readEditorialDraft(kind:EditorialKind,id:string,signal?:AbortSignal){kindOk(kind);draftIdOk(id);return parseEditorialDraft(await read(`editor/drafts/${kind}/${id}`,signal),kind,id);}
const allowedFields:Record<EditorialKind,readonly string[]>={
 CUSTOM_QUESTION:['content','explanations','options','type','mediaFileIds'],CHAPTER:['title','blocks'],LEARNING_PROGRAM:['title','description','blocks'],
 TRAFFIC_SIGN:['name','category','categoryName','meaning','quickTip','sourceImage','mediaFileId','applicableLicenses'],MEMORY_TIP:['title','quickRule','explanation','sortOrder']};
export function editorialChanges(kind:EditorialKind,before:Record<string,unknown>,after:Record<string,unknown>){
 kindOk(kind);const changes:Record<string,unknown>={};for(const k of allowedFields[kind])if(Object.prototype.hasOwnProperty.call(after,k)&&JSON.stringify(before[k])!==JSON.stringify(after[k]))changes[k]=after[k];
 if(!Object.keys(changes).length)throw new Error('Không có nội dung thay đổi để lưu.');
 return changes;
}
export async function patchEditorial(kind:EditorialKind,id:string,revision:number,changes:Record<string,unknown>,reason:string){
 kindOk(kind);draftIdOk(id);revOk(revision);reasonOk(reason);
 const list=Object.keys(changes);if(!list.length||list.some(x=>!allowedFields[kind].includes(x)))throw new Error('Trường chỉnh sửa không thuộc hợp đồng BE03.');
 return parseEditorialDraft(await write(`editor/drafts/${kind}/${id}`,'patch',{expectedRevision:revision,changes,reason:reasonOk(reason)}),kind,id);
}
export type DraftValidation={draftId:string;revision:number;structurallyValid:boolean;canPublish:boolean;errors:string[];blockers:string[]};
function parseValidation(value:unknown,id:string):DraftValidation{const r=obj(value);if(r.draftId!==id||!safeInt(r.revision)||typeof r.structurallyValid!=='boolean'||typeof r.canPublish!=='boolean'||!Array.isArray(r.errors)||r.errors.some(x=>typeof x!=='string')||!Array.isArray(r.blockers)||r.blockers.some(x=>typeof x!=='string'))throw new Error('Biên nhận kiểm tra backend không hợp lệ.');return r as DraftValidation;}
export async function validateEditorial(kind:EditorialKind,id:string,revision:number){kindOk(kind);draftIdOk(id);revOk(revision);return parseValidation(await write(`editor/drafts/${kind}/${id}/validate`,'post',{expectedRevision:revision}),id);}
export type DraftAudit={id:string;action:string;revision:number;message:string};
export async function editorialAudit(kind:EditorialKind,id:string,signal?:AbortSignal):Promise<DraftAudit[]>{kindOk(kind);draftIdOk(id);const data=await read(`editor/drafts/${kind}/${id}/audit`,signal);
 if(!Array.isArray(data)||data.some(x=>{try{const r=obj(x);return !uuid(r.id)||typeof r.action!=='string'||!safeInt(r.revision)||typeof r.message!=='string';}catch{return true;}}))throw new Error('Nhật ký bản nháp không hợp lệ.');return data as DraftAudit[];}

export type ReviewStatus={kind:string;draftId:string;revisionId:string;frozenDraftRevision:number;revisionStatus:string;resourceType:string;resourceId:string;frozenSha256:string;sourceIntegrityVerified:boolean;approvedMetadata:boolean;canPublish:boolean;blockers:string[]};
export function parseReview(value:unknown,kind:string,id:string):ReviewStatus{const r=obj(value);if(r.kind!==kind||r.draftId!==id||!uuid(r.revisionId)||!safeInt(r.frozenDraftRevision)||typeof r.revisionStatus!=='string'||typeof r.resourceType!=='string'||typeof r.resourceId!=='string'||typeof r.frozenSha256!=='string'||typeof r.sourceIntegrityVerified!=='boolean'||typeof r.approvedMetadata!=='boolean'||typeof r.canPublish!=='boolean'||!Array.isArray(r.blockers)||r.blockers.some(x=>typeof x!=='string'))throw new Error('Trạng thái phê duyệt không hợp lệ.');return r as ReviewStatus;}
export async function submitReview(kind:EditorialKind|'OFFICIAL_BANK',id:string,revision:number,title:string,description:string,reason:string){
 if(kind!=='OFFICIAL_BANK')kindOk(kind);draftIdOk(id);revOk(revision);
 if(!title.trim()||title.length>200||description.length>10000)throw new Error('Tiêu đề duyệt không hợp lệ.');reasonOk(reason);
 return parseReview(await write(`workflows/${kind}/${id}/submit-review`,'post',{expectedRevision:revision,title:title.trim(),description:description.trim(),reason:reasonOk(reason)}),kind,id);
}
export async function reviewStatus(kind:EditorialKind|'OFFICIAL_BANK',id:string,signal?:AbortSignal){
 if(kind!=='OFFICIAL_BANK')kindOk(kind);draftIdOk(id);
 return parseReview(await read(`workflows/${kind}/${id}/review-status`,signal),kind,id);
}
export type OfficialDraft={draftId:string;sourceBankVersion:string;targetBankVersion:string;status:string;revision:number;sourceSha256:string};
export function parseOfficialDraft(value:unknown):OfficialDraft{const r=obj(value);if(!uuid(r.draftId)||!versionOk(String(r.sourceBankVersion))||!versionOk(String(r.targetBankVersion))||typeof r.status!=='string'||!safeInt(r.revision)||!/^[a-f0-9]{64}$/i.test(String(r.sourceSha256)))throw new Error('Backend trả bản nháp ngân hàng sai hợp đồng.');return r as OfficialDraft;}
export async function cloneOfficial(sourceVersion:string,targetVersion:string){
 if(!versionOk(sourceVersion)||!versionOk(targetVersion)||sourceVersion===targetVersion)throw new Error('Phiên bản nguồn/đích chưa hợp lệ.');
 return parseOfficialDraft(await write(`theory-banks/${encodeURIComponent(sourceVersion)}/clone-draft`,'post',{sourceBankVersion:sourceVersion,targetBankVersion:targetVersion}));
}
export async function patchOfficial(draftId:string,sourceQuestionId:number,revision:number,changes:Record<string,unknown>,targetVersion:string):Promise<BankQuestionDetail>{
 draftIdOk(draftId);revOk(revision);if(!Number.isSafeInteger(sourceQuestionId)||sourceQuestionId<1||sourceQuestionId>600||!versionOk(targetVersion))throw new Error('Thông tin câu hỏi chuẩn không hợp lệ.');
 const allowed=['chapterId','questionText','options','explanation','isCritical','applicableLicenses','criticalLicenses','mediaFileIds'];
 if(!Object.keys(changes).length||Object.keys(changes).some(k=>!allowed.includes(k)))throw new Error('Nội dung chỉnh sửa câu hỏi vượt phạm vi cho phép.');
 const data=obj(await write(`theory-bank-drafts/${draftId}/questions/${sourceQuestionId}`,'patch',{expectedRevision:revision,changes}));
 if(data.bankVersion!==targetVersion||data.sourceQuestionId!==sourceQuestionId||data.status!=='DRAFT'||!safeInt(data.bankRevision)||data.bankRevision<revision)throw new Error('Biên nhận chỉnh sửa không đúng phiên bản ngân hàng.');
 return data as unknown as BankQuestionDetail;
}
export type OfficialChange={sourceQuestionId:number;impact:string;fields:string[]};
export async function officialChanges(id:string,signal?:AbortSignal):Promise<OfficialChange[]>{draftIdOk(id);const data=await read(`theory-bank-drafts/${id}/changes`,signal);
 if(!Array.isArray(data)||data.some(x=>{try{const r=obj(x);return !safeInt(r.sourceQuestionId)||typeof r.impact!=='string'||!Array.isArray(r.fields)||r.fields.some(z=>typeof z!=='string');}catch{return true;}}))throw new Error('Danh sách thay đổi ngân hàng không hợp lệ.');return data as OfficialChange[];}
export type OfficialValidation=DraftValidation&{totalQuestions:number;totalCritical:number;withMedia:number};
export async function validateOfficial(id:string,revision:number):Promise<OfficialValidation>{draftIdOk(id);revOk(revision);const data=obj(await write(`theory-bank-drafts/${id}/validate`,'post',{expectedRevision:revision}));
 if(!safeInt(data.totalQuestions)||!safeInt(data.totalCritical)||!safeInt(data.withMedia))throw new Error('Thống kê ngân hàng không hợp lệ.');return parseValidation(data,id) as OfficialValidation;}
