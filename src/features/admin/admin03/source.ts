import { contentBuilderApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

/** BE03 DTO mapping.  Only public Admin API contracts are used; never student/import APIs. */
export type EditorialKind = 'CUSTOM_QUESTION' | 'CHAPTER' | 'LEARNING_PROGRAM' | 'TRAFFIC_SIGN' | 'MEMORY_TIP';
export const editorial = {
  CUSTOM_QUESTION: {title:'Câu hỏi tự biên',resource:'questions'},
  CHAPTER: {title:'Chương',resource:'chapters'},
  LEARNING_PROGRAM: {title:'Chương trình học',resource:'learning-programs'},
  TRAFFIC_SIGN: {title:'Biển báo giao thông',resource:'traffic-signs'},
  MEMORY_TIP: {title:'Mẹo ghi nhớ',resource:'memory-tips'},
} as const;
export const uuid = (x: unknown): x is string => typeof x === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x);
export const validVersion = (x: unknown): x is string => typeof x === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{1,127}$/.test(x);
export const obj = (x:unknown):Record<string,unknown> => {
 if(x===null||typeof x!=='object'||Array.isArray(x)) throw new Error('Backend chưa trả đúng cấu trúc nội dung quản trị.');
 return x as Record<string,unknown>;
};
function nonnegative(x:unknown):x is number{return typeof x==='number'&&Number.isSafeInteger(x)&&x>=0;}
function checkedAuth(){
 const user=useAuthStore.getState();
 const actor=user.user?.id;
 if(!uuid(actor)||!user.accessToken)throw new Error('Vui lòng đăng nhập lại để xác minh quyền quản trị.');
 const id=actor;
 return ()=>{const current=useAuthStore.getState();if(current.user?.id!==id||!current.accessToken)throw new Error('Phiên quản trị đã thay đổi.');};
}
async function adminGet(path:string, params?:Record<string,string|number|boolean|undefined>, signal?:AbortSignal){
 const assert=checkedAuth();const data=await contentBuilderApi.get<unknown>(`/v1/admin/${path}`,{params,signal});assert();return data;
}
export type EditorialItem={id:string;kind:EditorialKind;status:string;payload:Record<string,unknown>};
export type EditorialPage={content:EditorialItem[];page:number;size:number;total:number};
export function parseEditorialItem(value:unknown,kind:EditorialKind):EditorialItem{
 const r=obj(value);
 if(!uuid(r.id)||r.kind!==kind||typeof r.status!=='string'||!['DRAFT','PUBLISHED','ARCHIVED','HIDDEN'].includes(r.status))throw new Error('Nguồn quản trị trả sai định danh, loại hoặc trạng thái.');
 const payload=obj(r.payload);
 if(payload.id!==r.id||payload.status!==r.status)throw new Error('Nội dung quản trị không khớp định danh hoặc trạng thái nguồn.');
 return {id:r.id,kind,status:r.status,payload};
}
export function parseEditorialPage(value:unknown,kind:EditorialKind,page:number,size:number):EditorialPage{
 const r=obj(value);
 if(!Array.isArray(r.content)||r.page!==page||r.size!==size||!nonnegative(r.total))throw new Error('Phân trang quản trị không hợp lệ.');
 const content=r.content.map((x:unknown)=>parseEditorialItem(x,kind));
 if(content.length>size||new Set(content.map(x=>x.id)).size!==content.length)throw new Error('Danh sách quản trị chứa dữ liệu trùng hoặc vượt trang.');
 return {content,page,size,total:r.total};
}
export async function editorialList(kind:EditorialKind,params:{page:number;size:number;status:string;keyword:string},signal?:AbortSignal){
 if(!nonnegative(params.page)||params.size<1||params.size>100||!Number.isSafeInteger(params.size)||params.keyword.length>128||!['','DRAFT','PUBLISHED','ARCHIVED','HIDDEN'].includes(params.status))throw new Error('Bộ lọc quản trị không hợp lệ.');
 return parseEditorialPage(await adminGet(`editor/${kind}`,{page:params.page,size:params.size,status:params.status||undefined,keyword:params.keyword.trim()||undefined},signal),kind,params.page,params.size);
}
export async function editorialDetail(kind:EditorialKind,id:string,signal?:AbortSignal){
 if(!uuid(id))throw new Error('Mã nguồn quản trị chưa hợp lệ.');
 return parseEditorialItem(await adminGet(`editor/${kind}/${id}`,undefined,signal),kind);
}
export type BankVersion={bankVersion:string;status:string;draftId:string|null;sourceBankVersion:string|null;revision:number;totalQuestions:number;learnerVisible:boolean};
export function parseBankVersions(v:unknown):BankVersion[]{
 if(!Array.isArray(v))throw new Error('Backend chưa cung cấp danh sách phiên bản ngân hàng.');
 const rows=v.map((x:unknown)=>{const r=obj(x);
  if(!validVersion(r.bankVersion)||typeof r.status!=='string'||!nonnegative(r.revision)||!nonnegative(r.totalQuestions)||typeof r.learnerVisible!=='boolean'||(r.draftId!==null&&!uuid(r.draftId))||(r.sourceBankVersion!==null&&!validVersion(r.sourceBankVersion)))throw new Error('Phiên bản ngân hàng chưa hợp lệ.');
  if(r.learnerVisible&&r.status!=='PUBLISHED')throw new Error('Phiên bản chưa công bố không được đánh dấu cho học viên.');
  return {bankVersion:r.bankVersion,status:r.status,draftId:r.draftId as string|null,sourceBankVersion:r.sourceBankVersion as string|null,revision:r.revision,totalQuestions:r.totalQuestions,learnerVisible:r.learnerVisible};
 });
 if(new Set(rows.map(x=>x.bankVersion)).size!==rows.length)throw new Error('Có phiên bản ngân hàng trùng nhau.');
 return rows;
}
export async function bankVersions(signal?:AbortSignal){return parseBankVersions(await adminGet('theory-banks',undefined,signal));}
export type BankQuestion={sourceQuestionId:number;questionId:string;bankVersion:string;status:string;chapterId:number;questionText:string;isCritical:boolean;hasMedia:boolean;applicableLicenses:string[];revision:number;contentOrigin:string};
export type BankQuestionPage={content:BankQuestion[];page:number;size:number;totalElements:number};
export function parseBankQuestionPage(value:unknown,version:string,page:number,size:number):BankQuestionPage{
 const r=obj(value);if(!Array.isArray(r.content)||r.page!==page||r.size!==size||!nonnegative(r.totalElements))throw new Error('Trang câu hỏi ngân hàng không hợp lệ.');
 const items=r.content.map((x:unknown)=>{const q=obj(x);
  if(!Number.isSafeInteger(q.sourceQuestionId)||Number(q.sourceQuestionId)<1||!uuid(q.questionId)||q.bankVersion!==version||typeof q.status!=='string'||!Number.isSafeInteger(q.chapterId)||Number(q.chapterId)<1||typeof q.questionText!=='string'||typeof q.isCritical!=='boolean'||typeof q.hasMedia!=='boolean'||!Array.isArray(q.applicableLicenses)||q.applicableLicenses.some((s:unknown)=>typeof s!=='string')||!nonnegative(q.revision)||q.contentOrigin!=='OFFICIAL_BANK')throw new Error('Câu hỏi nguồn không khớp phiên bản được yêu cầu.');
  return q as unknown as BankQuestion;
 });
 if(items.length>size||new Set(items.map(x=>x.sourceQuestionId)).size!==items.length)throw new Error('Trang câu hỏi trả dữ liệu trùng.');
 return {content:items,page,size,totalElements:r.totalElements};
}
export async function bankQuestions(version:string,opts:{page:number;size:number;keyword:string;chapterId:string;licenseClass:string;critical:string;hasMedia:string},signal?:AbortSignal){
 if(!validVersion(version)||!nonnegative(opts.page)||!Number.isSafeInteger(opts.size)||opts.size<1||opts.size>100||opts.keyword.length>200||!['','true','false'].includes(opts.critical)||!['','true','false'].includes(opts.hasMedia)||opts.chapterId!==''&&!/^[1-6]$/.test(opts.chapterId)||opts.licenseClass.length>20)throw new Error('Bộ lọc ngân hàng không hợp lệ.');
 const params={page:opts.page,size:opts.size,keyword:opts.keyword.trim()||undefined,chapterId:opts.chapterId?Number(opts.chapterId):undefined,licenseClass:opts.licenseClass||undefined,isCritical:opts.critical?opts.critical==='true':undefined,hasMedia:opts.hasMedia?opts.hasMedia==='true':undefined};
 return parseBankQuestionPage(await adminGet(`theory-banks/${encodeURIComponent(version)}/questions`,params,signal),version,opts.page,opts.size);
}
export type BankQuestionDetail={sourceQuestionId:number;questionId:string;bankVersion:string;status:string;payload:Record<string,unknown>;rowRevision:number;bankRevision:number;changeImpact:string;contentOrigin:string};
export function parseBankQuestionDetail(v:unknown,version:string,id:number):BankQuestionDetail{
 const r=obj(v);if(r.sourceQuestionId!==id||!uuid(r.questionId)||r.bankVersion!==version||typeof r.status!=='string'||!nonnegative(r.rowRevision)||!nonnegative(r.bankRevision)||typeof r.changeImpact!=='string'||r.contentOrigin!=='OFFICIAL_BANK')throw new Error('Chi tiết câu hỏi không khớp ngân hàng nguồn.');
 const payload=obj(r.payload);if(payload.sourceQuestionId!==id||payload.questionId!==r.questionId)throw new Error('Nội dung câu hỏi chưa khớp định danh nguồn.');
 return {sourceQuestionId:id,questionId:r.questionId,bankVersion:version,status:r.status,payload,rowRevision:r.rowRevision,bankRevision:r.bankRevision,changeImpact:r.changeImpact,contentOrigin:r.contentOrigin};
}
export async function bankQuestionDetail(version:string,sourceId:string,signal?:AbortSignal){
 const id=Number(sourceId);if(!validVersion(version)||!Number.isSafeInteger(id)||id<1||id>600)throw new Error('Mã câu hỏi hoặc phiên bản không hợp lệ.');
 return parseBankQuestionDetail(await adminGet(`theory-banks/${encodeURIComponent(version)}/questions/${id}`,undefined,signal),version,id);
}
