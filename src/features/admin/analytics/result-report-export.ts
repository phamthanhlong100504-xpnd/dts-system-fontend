import {getAccessToken,useAuthStore} from '@/stores/auth-store';

/** Download already aggregated Result statistics; never request raw student records. */
export async function exportResultReport(actorId:string,type:'results'|'exp'|'progress',params:{from:string;to:string;licenseClass?:string;module:string;examMode:string}){
 getAccessToken();const state=useAuthStore.getState();
 if(!state.accessToken||state.user?.id!==actorId)throw new Error('Phiên quản trị đã thay đổi.');
 if(type==='exp'&&!params.licenseClass)throw new Error('Cần chọn hạng GPLX để xuất EXP.');
 const query=new URLSearchParams({type,from:params.from,to:params.to,module:params.module,examMode:params.examMode});
 if(params.licenseClass)query.set('licenseClass',params.licenseClass);
 const progressQuery=new URLSearchParams({from:params.from,to:params.to,module:params.module});if(params.licenseClass)progressQuery.set('licenseClass',params.licenseClass);
 const url=type==='progress'?`/api/progress/v1/progress/admin/analytics/export?${progressQuery.toString()}`:`/api/result/v1/results/admin/analytics/export?${query.toString()}`;
 const response=await fetch(url,{
   method:'GET',headers:{Authorization:`Bearer ${state.accessToken}`,Accept:'text/csv'},cache:'no-store'});
 const current=useAuthStore.getState();
 if(current.user?.id!==actorId||current.accessToken!==state.accessToken)throw new Error('Phiên quản trị đã thay đổi.');
 if(!response.ok)throw new Error(response.status===409?'Nguồn báo cáo chưa đồng bộ đầy đủ, chưa thể xuất CSV.':`Backend từ chối xuất báo cáo (${response.status}).`);
 if(!response.headers.get('Content-Type')?.toLowerCase().includes('text/csv'))throw new Error('Backend không trả định dạng CSV đã xác nhận.');
 const blob=await response.blob();
 if(blob.size===0||blob.size>5_000_000)throw new Error('Dung lượng báo cáo ngoài giới hạn.');
 return {blob,filename:`dts-${type}-${params.from}-${params.to}.csv`};
}
