import {resultApi,progressApi} from '@/lib/api';
import {useAuthStore} from '@/stores/auth-store';
import type {SyncEvent} from '../workbench/operations-model';

const UUID=/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const rec=(value:unknown):Record<string,unknown>=>{
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Dữ liệu sự kiện Result không hợp lệ.');
 return value as Record<string,unknown>;
};
const timestamp=(value:unknown):string=>typeof value==='string'&&Number.isFinite(Date.parse(value))?value: (()=>{throw new Error('Thời điểm sự kiện chưa hợp lệ.');})();
function row(value:unknown,source:'dts-result'|'dts-progress'):SyncEvent{
 const e=rec(value),id=e.event_id;
 if(typeof id!=='string'||!UUID.test(id)||typeof e.event_type!=='string'||typeof e.applied!=='boolean'||!Number.isSafeInteger(e.event_sequence))
  throw new Error('Bằng chứng sự kiện Result không hợp lệ.');
 return {id:`${source}:${id}`,label:e.event_type,correlationId:null,sourceLabel:'Nguồn mô phỏng',targetLabel:source==='dts-result'?'Result (inbox)':'Progress (inbox)',
   occurredAt:timestamp(e.occurred_at),deliveryStatus:'Chưa xác minh ACK broker',
   consumerStatus:'Đã ghi vào inbox',projectionStatus:e.applied?'Đã áp dụng':'Đang chờ áp dụng',
   attemptCount:0,safeError:null,canRetry:false,href:null};
}
function actor(actorId:string){const state=useAuthStore.getState();if(!state.accessToken||state.user?.id!==actorId)throw new Error('Phiên quản trị đã thay đổi.');}
export async function listResultEvents(actorId:string,filter:{keyword:string;status:string;page:number;size:number;source?:'dts-result'|'dts-progress'},signal?:AbortSignal){
 actor(actorId);
 if(filter.page<0||!Number.isInteger(filter.page)||filter.page>1000||filter.size<1||filter.size>100||!Number.isInteger(filter.size))
  throw new Error('Phân trang sự kiện không hợp lệ.');
 if(filter.keyword&&!UUID.test(filter.keyword))throw new Error('Mã sự kiện cần là UUID hợp lệ.');
 if(filter.status&&!['APPLIED','PENDING'].includes(filter.status))throw new Error('Trạng thái sự kiện không hợp lệ.');
 const source=filter.source||'dts-result';if(!['dts-result','dts-progress'].includes(source))throw new Error('Nguồn sự kiện không hợp lệ.');
 const params={page:filter.page,size:filter.size,status:filter.status||'ALL',keyword:filter.keyword||undefined};
 const response=source==='dts-result'?await resultApi.get<unknown>('/v1/results/admin/integrations/events',{params,signal}):await progressApi.get<unknown>('/v1/progress/admin/integrations/events',{params,signal});
 const value=rec(response);actor(actorId);
 if(value.sourceService!==source||value.dataStatus!=='READY'||value.page!==filter.page||value.size!==filter.size||!Array.isArray(value.items)||value.items.length>filter.size||typeof value.totalElements!=='number'||!Number.isSafeInteger(value.totalElements)||value.totalElements<0)
  throw new Error('Phân trang sự kiện Result chưa được xác minh.');
 const items=value.items.map(item=>row(item,source));
 if(new Set(items.map(item=>item.id)).size!==items.length)throw new Error('Sự kiện Result bị trùng mã.');
 return {items,page:filter.page,size:filter.size,totalElements:value.totalElements};
}
export async function resultEventDetail(actorId:string,eventId:string,signal?:AbortSignal):Promise<SyncEvent>{
 actor(actorId);const [source,eventUuid]=eventId.split(':');
 if(!['dts-result','dts-progress'].includes(source)||!UUID.test(eventUuid))throw new Error('Mã sự kiện không hợp lệ.');
 const result=source==='dts-result'
  ?await resultApi.get<unknown>(`/v1/results/admin/integrations/events/${encodeURIComponent(eventUuid)}`,{signal})
  :await progressApi.get<unknown>(`/v1/progress/admin/integrations/events/${encodeURIComponent(eventUuid)}`,{signal});
 const value=rec(result);actor(actorId);
 if(value.sourceService!==source||value.dataStatus!=='READY')throw new Error('Nguồn chi tiết sự kiện không được xác minh.');
 const item=row(value.event,source as 'dts-result'|'dts-progress');if(item.id!==eventId)throw new Error('Mã chi tiết không khớp.');
 return item;
}
