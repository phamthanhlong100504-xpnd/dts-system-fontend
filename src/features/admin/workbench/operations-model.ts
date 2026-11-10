import {getAdminAnalyticsOperationsSource} from '../analytics/analytics-operations-source';
import type { Choice,Page,Scope } from './model';
export type DataStatus='READY'|'PARTIAL'|'STALE'|'UNAVAILABLE';
export interface Metric { key:string; label:string; value:number|null; unit:'count'|'percent'|'score'|'exp';href?:string|null }
export interface ReportRow { id:string; cells:string[]; href?:string|null }
export interface Report { actorId:string; dataStatus:DataStatus; asOf:string|null; sourceLabel:string; warnings:string[]; missingSources:string[]; metrics:Metric[]; columns:string[]; rows:ReportRow[]; totalElements:number; page:number; size:number; trend:Array<{date:string;value:number|null}>;series?:ReportSeries[];breakdowns?:ReportBreakdown[] }
export interface ReportFilter { from:string;to:string;timeZone:'Asia/Ho_Chi_Minh';licenseClass:string;module:string;examType:string;bankVersion:string;policyVersion:string;rankingPeriod?:string;page:number;size:number }
export interface ReportOptions { actorId:string;licenses:Choice[];modules:Choice[];examTypes:Array<Choice&{module?:string}>;periods?:Choice[];banks:Choice[];policies:Choice[];canExport:boolean }
export interface AuditRow { id:string;actorLabel:string;serviceLabel:string;actionLabel:string;resourceLabel:string;resourceId:string;versionLabel:string;occurredAt:string;result:'SUCCESS'|'DENIED'|'FAILED'|'RECORDED';safeReason:string|null;correlationId:string|null;href:string|null }
export type AuditPage=Page<AuditRow>&{hasMore?:boolean};
export interface SyncEvent { id:string;correlationId:string|null;label:string;sourceLabel:string;targetLabel:string;occurredAt:string;deliveryStatus:string;consumerStatus:string;projectionStatus:string;attemptCount:number;safeError:string|null;canRetry:boolean;href:string|null }
export interface Monitoring { actorId:string;dataStatus:DataStatus;asOf:string|null;services:Array<{id:string;label:string;status:'UP'|'DOWN'|'UNKNOWN';checkedAt:string|null}>;events:Page<SyncEvent>;eventsComplete?:boolean;warnings:string[];statusOptions?:Choice[];groups?:Array<{id:'content'|'results'|'media';label:string;dataStatus:DataStatus;asOf:string|null;warnings:string[];metrics:Metric[];links:Array<{label:string;href:string}>}> }
export interface AuditFilter {from:string;to:string;actor:string;service:string;resource:string;action:string;result:string;correlationId:string;page:number;size:number}
export interface OperationsSource {
 actorId:string;
 reportOptions(signal?:AbortSignal):Promise<ReportOptions>;
 report(tab:'results'|'progress'|'exp',filter:ReportFilter,signal?:AbortSignal):Promise<Report>;
 dashboard(scope:Partial<Scope>,signal?:AbortSignal):Promise<Report[]>;
 monitoring(filter:{keyword:string;status:string;page:number;size:number;source?:'dts-result'|'dts-progress'},signal?:AbortSignal):Promise<Monitoring>;
 event(id:string,signal?:AbortSignal):Promise<SyncEvent>;
 retryEvent?(id:string,operationKey:string):Promise<void>;
 audit(filter:AuditFilter,signal?:AbortSignal):Promise<AuditPage>;
 auditDetail(id:string,signal?:AbortSignal):Promise<AuditRow>;
 exportReport? (tab:'results'|'progress'|'exp',filter:ReportFilter):Promise<{blob:Blob;filename:string}>;
}
/** No guessed API routes, no use of learner /me analytics. */
export function getAdminOperationsSource():OperationsSource|null{return getAdminAnalyticsOperationsSource();}
export function checkReport(r:Report,actorId:string):Report{
 if(r.actorId!==actorId||!['READY','PARTIAL','STALE','UNAVAILABLE'].includes(r.dataStatus)||!Array.isArray(r.metrics)||r.metrics.some(x=>x.value!==null&&(!Number.isFinite(x.value)||x.value<0))||r.trend.some(x=>x.value!==null&&!Number.isFinite(x.value)))throw new Error('Số liệu báo cáo chưa hợp lệ với phạm vi đang xem.');
 if(r.dataStatus!=='UNAVAILABLE'&&(!r.asOf||!Number.isFinite(Date.parse(r.asOf))))throw new Error('Chưa xác minh được thời điểm cập nhật số liệu.');
 if(r.series?.some(s=>!['READY','PARTIAL','STALE','UNAVAILABLE'].includes(s.dataStatus)||s.points.some(p=>p.value!==null&&(!Number.isFinite(p.value)||p.value<0))))throw new Error('Biểu đồ chưa có dữ liệu hợp lệ.');
 if(r.breakdowns?.some(b=>!['READY','PARTIAL','STALE','UNAVAILABLE'].includes(b.dataStatus)||b.rows.some(x=>x.cells.length!==b.columns.length)))throw new Error('Bảng phân tích chưa hợp lệ.');
 return r;
}
export function dateRangeProblem(from:string,to:string):string|null {if(!/^\d{4}-\d{2}-\d{2}$/.test(from)||!/^\d{4}-\d{2}-\d{2}$/.test(to)||!Number.isFinite(Date.parse(from))||!Number.isFinite(Date.parse(to))||new Date(from).toISOString().slice(0,10)!==from||new Date(to).toISOString().slice(0,10)!==to||from>to)return 'Ngày bắt đầu cần trước hoặc bằng ngày kết thúc.';return null;}
export function defaultReportFilter():ReportFilter {const now=new Date();const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);const pick=(type:string)=>parts.find(p=>p.type===type)!.value;const to=`${pick('year')}-${pick('month')}-${pick('day')}`;const start=new Date(`${to}T00:00:00Z`);start.setUTCDate(start.getUTCDate()-29);return {from:start.toISOString().slice(0,10),to,timeZone:'Asia/Ho_Chi_Minh',licenseClass:'',module:'',examType:'',bankVersion:'',policyVersion:'',rankingPeriod:'',page:0,size:20};}
export interface ReportSeries {id:string;label:string;unitLabel:string;dataStatus:DataStatus;asOf:string|null;warnings:string[];points:Array<{label:string;value:number|null}>}
export interface ReportBreakdown {id:string;label:string;dataStatus:DataStatus;asOf:string|null;warnings:string[];columns:string[];rows:ReportRow[]}

/** Versioned, source-owned Admin journals. Never infer downstream publication from an audit event. */
export {getAdminAuditSource} from '../audit/admin-audit-source';
