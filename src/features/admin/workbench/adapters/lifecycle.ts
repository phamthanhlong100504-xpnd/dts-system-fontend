import {contentBuilderApi} from '@/lib/api';
import type {LifecycleSource,LifecycleSubject,LifecycleAction,VersionContext} from '../lifecycle-model';
import type {Page,HistoryRow,Difference,Issue} from '../model';
import {actorId,read,write,obj,recordList,str,optStr,int,stamp,uuid,unavailable} from './common';
import {canAdmin,canEnterCurrentAdmin,type AdminAccess} from '../../foundation/admin-access';

type R=Record<string,unknown>;
const kinds:Partial<Record<LifecycleSubject['kind'],string>>={QUESTION:'questions',CHAPTER:'chapters',PROGRAM:'learning-programs',
 TRAFFIC_SIGN:'traffic-signs',MEMORY_TIP:'memory-tips',SCENARIO:'simulation-scenarios',SIMULATION_SET:'simulation-exam-sets'};
const validationReceipts=new Map<string,{revision:number;checkedAt:string;issues:Issue[]}>();
// The effective Identity grant is the intersection of DB and JWT; a JWT claim alone cannot enable a UI action.
const permission=(access:AdminAccess,resource:string,action:string)=>canAdmin(access,resource,action);
function resource(kind:LifecycleSubject['kind']):string{const value=kinds[kind];if(!value)unavailable('Chưa có hợp đồng vòng đời phiên bản tương ứng tại service sở hữu nội dung.');return value;}
function snapshot(actor:string,access:AdminAccess,subject:LifecycleSubject,r:R):VersionContext{
 const id=str(r.versionId),revision=int(r.revision),type=resource(subject.kind);
 if(!uuid.test(id)||str(r.resourceType)!==type||str(r.resourceId)!==subject.id||revision===null)
  throw new Error('Phiên bản không trùng mã nguồn nội dung được yêu cầu.');
 const status=str(r.status);
 if(!['DRAFT','IN_REVIEW','APPROVED','PUBLISHED','ARCHIVED'].includes(status))throw new Error('Trạng thái phiên bản chưa được hỗ trợ.');
 const author=str(r.createdBy),updated=str(r.updatedBy),separate=r.changeImpact==='SCORING'||r.changeImpact==='POLICY';
 const actions:VersionContext['actions']=[];
 if(status==='DRAFT'&&permission(access,type,'update'))actions.push('validate');
 const receipt=validationReceipts.get(`${actor}:${id}`);
 if(status==='DRAFT'&&receipt?.revision===revision&&!receipt.issues.some(x=>x.severity==='ERROR')&&permission(access,type,'submit'))actions.push('submit');
 if(status==='IN_REVIEW'&&permission(access,type,'approve')&&(!separate||author!==actor&&updated!==actor))actions.push('approve','reject');
 const c=obj(r.content,'nội dung metadata'),valid=receipt?.revision===revision?receipt:null;
 return {actorId:actor,subject:{...subject,versionId:id},versionId:id,revision,versionLabel:String(int(r.versionNumber)??id),
  status:status as VersionContext['status'],publishedVersionLabel:null,draftVersionLabel:null,sourceVersionLabel:optStr(r.sourceVersionId),
  updatedByLabel:optStr(r.updatedBy),approvedByLabel:optStr(r.approvedBy),updatedAt:stamp(r.updatedAt),
  changeImpact:r.changeImpact==='SCORING'||r.changeImpact==='POLICY'||r.changeImpact==='EDITORIAL'?r.changeImpact:'UNKNOWN',
  actions,separateApprover:separate,updatedByActorId:updated||null,canPublish:false,
  validation:valid?{...valid,summary:[{label:'Kiểm tra metadata',value:valid.issues.length===0?'Hợp lệ':'Có vấn đề'}]}:null,
  dependencies:[],totalDependencies:0,activeSessionsCount:null,release:null};
}
const toHistory=(r:R):HistoryRow=>({versionId:str(r.versionId),versionNumber:int(r.versionNumber)??0,
 revision:int(r.revision)??0,status:str(r.status) as HistoryRow['status'],actorLabel:str(r.updatedBy),
 occurredAt:str(r.updatedAt),summary:str(obj(r.content).title)||'Phiên bản metadata'});
export function makeAdminLifecycleSource(subject?:LifecycleSubject,access?:AdminAccess|null):LifecycleSource|null{
 const actor=actorId();if(!actor||!access||access.actorId!==actor||!canEnterCurrentAdmin(access)||!access.capabilities)return null;
 if(subject&&!kinds[subject.kind])return null;
 const source:LifecycleSource={actorId:actor,
  async read(subject,signal){
   const type=resource(subject.kind);
   if(subject.versionId){
    if(!uuid.test(subject.versionId))throw new Error('Mã phiên bản chưa hợp lệ.');
    return snapshot(actor,access,subject,obj(await read<unknown>(actor,contentBuilderApi,`/v1/admin/revisions/${subject.versionId}`,undefined,signal)));
   }
   const page=obj(await read<unknown>(actor,contentBuilderApi,'/v1/admin/revisions',
     {resourceType:type,resourceId:subject.id,page:0,size:20},signal));
   const items=recordList(page.content,'phiên bản');
   if(!items.length)throw new Error('Nội dung này chưa có bản ghi phiên bản theo quy trình Admin 01; không suy đoán từ nội dung cũ.');
   return snapshot(actor,access,subject,items[0]);
  },
  async validate(c){
   if(c.actorId!==actor)throw new Error('Tài khoản thay đổi.');
   const r=obj(await write(actor,()=>contentBuilderApi.post<unknown>(`/v1/admin/revisions/${c.versionId}/validate`,{expectedRevision:c.revision,reason:''})));
   if(str(r.versionId)!==c.versionId||int(r.revision)!==c.revision)throw new Error('Kết quả kiểm tra sai phiên bản.');
   if(typeof r.valid!=='boolean'||!Array.isArray(r.errors)||r.errors.some(x=>typeof x!=='string'))
    throw new Error('Backend không trả kết quả kiểm tra metadata hợp lệ.');
   if(r.valid&&r.errors.length)throw new Error('Kết quả kiểm tra backend mâu thuẫn.');
   const issues:Issue[]=r.errors.map(x=>({severity:'ERROR',message:x as string,field:null,itemId:null}));
   if(!r.valid&&!issues.length)issues.push({severity:'ERROR',message:'Backend xác nhận phiên bản chưa hợp lệ.',field:null,itemId:null});
   const checkedAt=stamp(r.checkedAt);if(!checkedAt)throw new Error('Không có mốc kiểm tra từ backend.');
   validationReceipts.set(`${actor}:${c.versionId}`,{revision:c.revision,checkedAt,issues});
   return source.read(c.subject);
  },
  async transition(c,action,reason,operationKey){
   if(!['submit','approve','reject'].includes(action))unavailable('Thao tác chưa có hợp đồng an toàn qua BE Admin 01.');
   if(c.actorId!==actor||!c.actions.includes(action as LifecycleAction))throw new Error('Thiếu quyền hoặc trạng thái phiên bản không hợp lệ.');
   const r=obj(await write(actor,()=>contentBuilderApi.post<unknown>(`/v1/admin/revisions/${c.versionId}/${action}`,
    {expectedRevision:c.revision,reason:reason.trim()})));
   if(str(r.versionId)!==c.versionId)throw new Error('Biên nhận không khớp phiên bản.');
   validationReceipts.delete(`${actor}:${c.versionId}`);
   return snapshot(actor,access,{...c.subject,versionId:c.versionId},r);
  },
  async history(c,page,signal):Promise<Page<HistoryRow>>{
   const type=resource(c.subject.kind),r=obj(await read<unknown>(actor,contentBuilderApi,'/v1/admin/revisions',
    {resourceType:type,resourceId:c.subject.id,page,size:20},signal));
   const total=int(r.totalElements);if(total===null)throw new Error('Backend không trả tổng số phiên bản.');
   return {items:recordList(r.content,'phiên bản').map(toHistory),page,size:20,totalElements:total};
  },
  async compare(c,otherId,signal):Promise<Difference[]>{
   if(!uuid.test(otherId))throw new Error('Mã phiên bản so sánh không hợp lệ.');
   const other=obj(await read<unknown>(actor,contentBuilderApi,`/v1/admin/revisions/${otherId}`,undefined,signal));
   if(str(other.resourceType)!==resource(c.subject.kind)||str(other.resourceId)!==c.subject.id)
    throw new Error('Không thể so sánh phiên bản của nội dung khác.');
   const current=obj(await read<unknown>(actor,contentBuilderApi,`/v1/admin/revisions/${c.versionId}`,undefined,signal));
   const left=obj(current.content),right=obj(other.content);
   return ['title','description','note'].flatMap(field=>str(left[field])===str(right[field])?[]:
    [{field,before:str(right[field]),after:str(left[field])}]);
  }
 };
 return source;
}
