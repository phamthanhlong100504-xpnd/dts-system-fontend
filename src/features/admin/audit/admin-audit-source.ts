import {contentBuilderApi,examinationApi,practiceApi} from '@/lib/api';
import {useAuthStore} from '@/stores/auth-store';
import type {AuditFilter,AuditPage,AuditRow,OperationsSource} from '../workbench/operations-model';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const own=Object.prototype.hasOwnProperty;
const text=(v:unknown):string=>typeof v==='string'?v:'';
const record=(v:unknown):Record<string,unknown>=>{
 if(!v||typeof v!=='object'||Array.isArray(v))throw new Error('Nhật ký trả về sai cấu trúc.');
 return v as Record<string,unknown>;
};
function actorIsCurrent(actorId:string):void{
 const auth=useAuthStore.getState();
 if(auth.user?.id!==actorId||!auth.accessToken)throw new Error('Phiên đăng nhập đã thay đổi.');
}
function row(raw:unknown,service:string):AuditRow{
 const r=record(raw),id=text(r.auditId),actorId=text(r.actorId),action=text(r.action),occurredAt=text(r.occurredAt);
 if(!UUID.test(id)||!UUID.test(actorId)||!action||!Number.isFinite(Date.parse(occurredAt)))
  throw new Error('Bản ghi nhật ký không hợp lệ.');
 const value=text(r.result);
 if(!['SUCCESS','DENIED','FAILED','RECORDED'].includes(value))throw new Error('Trạng thái nhật ký không hợp lệ.');
 // RECORDED is evidence only of the journal row, not publication/projection success.
 return {id,actorLabel:actorId,serviceLabel:service,actionLabel:action,
  resourceLabel:text(r.resourceType),resourceId:text(r.resourceId),versionLabel:text(r.versionId),
  occurredAt, result:value as AuditRow['result'],safeReason:service==='Content Builder'?text(r.reason)||null:
   'Nguồn chỉ cung cấp siêu dữ liệu nhật ký; không công bố nội dung hoặc lý do chi tiết.',
  correlationId:text(r.requestId)||null,href:null};
}
function begin(day:string):string{
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw new Error('Ngày lọc không hợp lệ.');
 const stamp=new Date(`${day}T00:00:00+07:00`);
 const [year,month,date]=day.split('-').map(Number);
 const check=new Date(Date.UTC(year,month-1,date));
 if(!Number.isFinite(stamp.getTime())||check.getUTCFullYear()!==year||check.getUTCMonth()+1!==month||check.getUTCDate()!==date)throw new Error('Ngày lọc không hợp lệ.');
 return stamp.toISOString();
}
function exclusiveEnd(day:string):string{
 const stamp=new Date(begin(day));stamp.setUTCDate(stamp.getUTCDate()+1);
 const now=Date.now();return new Date(Math.min(stamp.getTime(),now)).toISOString();
}
function validateFilter(filter:AuditFilter):void{
 if(filter.page<0||filter.page>1000||!Number.isInteger(filter.page)||!Number.isInteger(filter.size)||filter.size<1||filter.size>100)
  throw new Error('Phân trang nhật ký không hợp lệ.');
 if(filter.from>filter.to)throw new Error('Khoảng ngày không hợp lệ.');
 if(filter.actor&&!UUID.test(filter.actor))throw new Error('Mã người thao tác phải là UUID.');
 if(filter.correlationId.length>128||filter.action.length>32||filter.resource.length>128)
  throw new Error('Bộ lọc nhật ký quá dài.');
 if(filter.result&&!['SUCCESS','DENIED','FAILED','RECORDED'].includes(filter.result))throw new Error('Trạng thái lọc không hợp lệ.');
}
const SERVICES:Record<string,string>={
 'dts-content-builder':'Content Builder','dts-practice':'Practice','dts-examination':'Examination'
};
function selected(filter:AuditFilter):string{
 const name=filter.service||'dts-content-builder';
 if(!own.call(SERVICES,name))throw new Error('Nguồn nhật ký chưa được xác minh.');
 return name;
}
function pageOf(raw:unknown,service:string,page:number,size:number):AuditPage{
 const d=record(raw),items=d.items;
 if(!Array.isArray(items)||typeof d.hasMore!=='boolean'||d.page!==page||d.size!==size||d.sourceService!==service)
  throw new Error('Phân trang nhật ký nguồn không hợp lệ.');
 if(items.length>size)throw new Error('Số bản ghi nguồn vượt giới hạn.');
 const mapped=items.map(x=>row(x,SERVICES[service]));
 if(new Set(mapped.map(x=>x.id)).size!==mapped.length)throw new Error('Nhật ký nguồn trùng mã.');
 return {items:mapped,page,size,totalElements:page*size+mapped.length+(d.hasMore?1:0),hasMore:d.hasMore};
}
export function getAdminAuditSource(actorId:string):Pick<OperationsSource,'actorId'|'audit'|'auditDetail'>|null{
 if(!UUID.test(actorId))return null;
 const cache=new Map<string,AuditRow>();
 return {actorId,
 async audit(filter,signal){
  actorIsCurrent(actorId);validateFilter(filter);
  const service=selected(filter);
  if(service==='dts-content-builder'){
   if(filter.result==='RECORDED')throw new Error('Content Builder không có trạng thái RECORDED.');
   const d=await contentBuilderApi.get<unknown>('/v1/admin/audit-logs',{params:{
    resourceType:filter.resource||undefined,actorId:filter.actor||undefined,action:filter.action||undefined,
    result:filter.result||undefined,
    requestId:filter.correlationId||undefined,from:filter.from||undefined,to:filter.to||undefined,
    page:filter.page,size:filter.size},signal});
   actorIsCurrent(actorId);const data=record(d);
   if(!Array.isArray(data.content)||!Number.isSafeInteger(data.totalElements)||
      !Number.isSafeInteger(data.number)||data.number!==filter.page||data.size!==filter.size)
     throw new Error('Phân trang nhật ký Content Builder không hợp lệ.');
   const items=data.content.map(x=>row(x,'Content Builder'));
   for(const item of items)cache.set(item.id,item);
   return {items,page:filter.page,size:filter.size,totalElements:data.totalElements as number};
  }
  if(filter.resource||filter.correlationId||filter.result&&filter.result!=='RECORDED')
   throw new Error('Bộ lọc này chưa được Backend của dịch vụ hỗ trợ.');
  if(filter.action&&service==='dts-examination')throw new Error('Bộ lọc thao tác chưa được Examination hỗ trợ.');
  if(filter.action&&!/^[A-Z_]{1,24}$/.test(filter.action))throw new Error('Mã thao tác không hợp lệ.');
  if(Date.parse(begin(filter.to))>Date.now())throw new Error('Không lọc nhật ký trong tương lai.');
  const from=begin(filter.from),to=exclusiveEnd(filter.to);
  if(Date.parse(from)>=Date.parse(to))throw new Error('Khoảng ngày nhật ký chưa hợp lệ.');
  if(Date.parse(to)-Date.parse(from)>90*86400000)throw new Error('Nguồn nhật ký chỉ hỗ trợ tối đa 90 ngày.');
  const params={from,to,actorId:filter.actor||undefined,
                page:filter.page,size:filter.size};
  const d=service==='dts-practice'
    ?await practiceApi.get<unknown>('/v1/exams/admin/audit/preset-sets',{params:{...params,action:filter.action||undefined},signal})
    :await examinationApi.get<unknown>('/v1/admin/audit/official-reviews',{params,signal});
  actorIsCurrent(actorId);
  const result=pageOf(d,service,filter.page,filter.size);
  for(const item of result.items)cache.set(item.id,item);
  return result;
 },
 async auditDetail(id,signal){
  actorIsCurrent(actorId);
  if(!UUID.test(id))throw new Error('Mã nhật ký không hợp lệ.');
  const cached=cache.get(id);
  if(cached&&cached.serviceLabel!=='Content Builder')return cached;
  const value=await contentBuilderApi.get<unknown>(`/v1/admin/audit-logs/${encodeURIComponent(id)}`,{signal});
  actorIsCurrent(actorId);const detail=row(value,'Content Builder');
  if(detail.id!==id)throw new Error('Nhật ký chi tiết không trùng mã yêu cầu.');
  return detail;
 }};
}
