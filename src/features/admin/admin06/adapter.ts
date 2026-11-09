/** BE06 Admin reporting adapter. All values come from owning services; never from learner /me or client-side grade/EXP math. */
import {contentBuilderApi,mediaApi,identityApi,resultApi,progressApi,ApiError} from '@/lib/api';
import {getAccessToken,useAuthStore} from '@/stores/auth-store';
import type {OperationsSource,Report,ReportFilter,ReportOptions,Metric,ReportRow,DataStatus,Monitoring,AuditFilter,AuditRow,SyncEvent} from '../workbench/operations-model';
import type {Scope,Page} from '../workbench/model';

type Obj=Record<string,unknown>;
const record=(v:unknown):v is Obj=>v!==null&&typeof v==='object'&&!Array.isArray(v);
function object(v:unknown,label:string):Obj{if(!record(v))throw Error(`${label}: sai cấu trúc đối tượng.`);return v;}
function rows(v:unknown,label:string):Obj[]{if(!Array.isArray(v)||v.some(x=>!record(x)))throw Error(`${label}: danh sách không hợp lệ.`);return v;}
function str(v:unknown):string{return typeof v==='string'?v:'';}
function nullableNumber(v:unknown):number|null{return typeof v==='number'&&Number.isFinite(v)&&v>=0?v:null;}
function num(v:unknown,label:string):number{const n=nullableNumber(v);if(n===null)throw Error(`${label}: số liệu không hợp lệ.`);return n;}
function metric(key:string,label:string,v:unknown,unit:Metric['unit']='count',href?:string):Metric{return {key,label,value:v===null||v===undefined?null:num(v,label),unit,href};}
const statuses=new Set<DataStatus>(['READY','PARTIAL','STALE','UNAVAILABLE']);
function meta(v:unknown,service:string){const d=object(v,service),state=d.dataStatus;
 if(d.sourceService!==service||!statuses.has(state as DataStatus)||typeof d.asOf!=='string'||!Number.isFinite(Date.parse(d.asOf)))throw Error(`${service}: trạng thái hoặc nguồn số liệu không được xác minh.`);
 return {data:d,status:state as DataStatus,asOf:d.asOf as string,warnings:Array.isArray(d.warnings)?d.warnings.filter((x):x is string=>typeof x==='string'):[],missingSources:Array.isArray(d.missingSources)?d.missingSources.filter((x):x is string=>typeof x==='string'):[]};}
function currentActor(expected:string){getAccessToken();const initial=useAuthStore.getState();
 if(!expected||initial.user?.id!==expected||!initial.accessToken)throw new ApiError('Phiên Admin không hợp lệ.',401);
 const token=initial.accessToken;return()=>{const now=useAuthStore.getState();if(now.user?.id!==expected||now.accessToken!==token)throw new ApiError('Tài khoản Admin thay đổi trong lúc tải báo cáo.',401);};}
function isoDate(date:string,addDays=0):string{if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('Ngày lọc không hợp lệ.');const d=new Date(date+'T00:00:00+07:00');if(!Number.isFinite(d.getTime()))throw Error('Ngày lọc không hợp lệ.');d.setUTCDate(d.getUTCDate()+addDays);return d.toISOString();}
function timeScope(f:ReportFilter){if(f.from>f.to)throw Error('Khoảng thời gian không hợp lệ.');const start=isoDate(f.from),rawEnd=isoDate(f.to,1),now=new Date().toISOString(),end=rawEnd>now?now:rawEnd;
 if(start>=end||new Date(end).getTime()-new Date(start).getTime()>366*86400000)throw Error('Khoảng thời gian cần nằm trong 366 ngày và không vượt tương lai.');
 const licenses=new Set(['A1','A','B1','B','C1','C','D1','D2','D','BE','C1E','CE','D1E','D2E','DE','A2','B2','E','F']);
 if(f.licenseClass&&!licenses.has(f.licenseClass)||f.module&&!['THEORY','SIMULATION'].includes(f.module)||f.examType&&!['RANDOM','PRESET','OFFICIAL'].includes(f.examType)||f.module==='SIMULATION'&&f.examType==='OFFICIAL')throw Error('Bộ lọc không thuộc phạm vi Backend hỗ trợ.');
 return {from:start,to:end,licenseClass:f.licenseClass||undefined,module:f.module||'ALL',examMode:f.examType||'ALL'};}
function report(actorId:string,name:string,m:{dataStatus:DataStatus;asOf:string|null;warnings:string[];missingSources:string[]},metrics:Metric[],rowsData:ReportRow[]=[],columns:string[]=[],trend:Report['trend']=[]):Report{
 return {actorId,sourceLabel:name,dataStatus:m.dataStatus,asOf:m.asOf,warnings:m.warnings,missingSources:m.missingSources,metrics,rows:rowsData,columns,totalElements:rowsData.length,page:0,size:Math.max(1,rowsData.length),trend};}
function unavailable(actorId:string,name:string,message:string):Report{return report(actorId,name,{dataStatus:'UNAVAILABLE',asOf:null,warnings:[message],missingSources:[name]},[]);}
function bMeta(v:unknown,s:string){const m=meta(v,s);return {dataStatus:m.status,asOf:m.asOf,warnings:m.warnings,missingSources:m.missingSources};}
function grouped(rowsData:unknown,label:string,status?:string):number{const data=rows(rowsData,label);return data.reduce((n,row)=>n+((!status||str(row.status)===status)?num(row.total,`${label}.total`):0),0);}
function contentReport(who:string,response:unknown):Report{const m=meta(response,'dts-content-builder'),d=m.data;
 const current=rows(d.simulations,'simulations').filter(x=>x.is_current===true&&x.status==='PUBLISHED');const versions=new Set(current.map(x=>str(x.bank_version)));const scenarios=rows(d.simulationScenarios,'scenarios').filter(x=>versions.has(str(x.bank_version)));
 const scenarioCount=versions.size===1?scenarios.reduce((n,r)=>n+num(r.total,'simulation scenarios'),0):null;
 return report(who,'Content Builder — nội dung',{dataStatus:m.status,asOf:m.asOf,warnings:[...m.warnings,'Số lượng theo trạng thái có thể bao gồm nhiều phiên bản; không coi là số nguồn hiện hành.'],missingSources:m.missingSources},[
 metric('standard','Câu hỏi ngân hàng chuẩn (chưa phân loại)',null),metric('questions','Câu hỏi tự biên (chưa phân loại)',null),
 metric('chapters','Bản ghi chương đã công bố (mọi phiên bản)',grouped(d.chapters,'chapters','PUBLISHED'),'count','/admin/chapters/versions'),
 metric('programs','Bản ghi chương trình đã công bố',grouped(d.programs,'programs','PUBLISHED'),'count','/admin/programs/versions'),
 metric('signs','Bản ghi biển báo đã công bố (mọi phiên bản)',grouped(d.signs,'signs','PUBLISHED'),'count','/admin/traffic-signs/drafts'),
 metric('tips','Bản ghi mẹo ghi nhớ đã công bố (mọi phiên bản)',grouped(d.tips,'tips','PUBLISHED'),'count','/admin/memory-tips/drafts'),
 metric('simScenarios','Tình huống của ngân hàng mô phỏng hiện hành',scenarioCount,'count','/admin/simulations/scenarios'),
 metric('simPresets','Phiên bản bộ đề mô phỏng công bố (mọi phiên bản)',grouped(d.simulationPresets,'simulationPresets','PUBLISHED'),'count','/admin/simulations/exam-sets')]);}
function mediaReport(who:string,response:unknown):Report{const m=meta(response,'dts-media'),d=m.data;const mediaRows=rows(d.byMediaTypeAndStatus,'media statuses');let ready=0;for(const r of mediaRows){if(r.status==='READY')ready+=num(r.total,'media READY');}
 return report(who,'Media — trạng thái tài nguyên',bMeta(response,'dts-media'),[metric('ready','Media READY (mọi loại)',ready,'count','/admin/media'),metric('notReady','Media chưa READY',d.notReadyCount,'count','/admin/media'),metric('referenced','Media đã xác minh nơi sử dụng',d.referencedCount)]);}
function userReport(who:string,response:unknown):Report{const d=meta(response,'dts-identity').data;return report(who,'Identity — tài khoản',bMeta(response,'dts-identity'),[metric('accounts','Tài khoản (mọi trạng thái)',grouped(d.accountsByStatus,'account statuses'),'count','/admin/users'),metric('signedIn','Tài khoản từng đăng nhập trong kỳ',d.uniqueSignedInAccounts),metric('activeLearners','Học viên thực sự học tập',d.activeLearners)]);}
function resultReport(who:string,response:unknown):Report{const m=meta(response,'dts-result'),s=m.data.summary===null?null:object(m.data.summary,'result summary');return report(who,'Result — kỳ báo cáo 30 ngày',bMeta(response,'dts-result'),[
 metric('completed','Phiên thi hợp lệ hoàn thành',s?.completedAttempts),metric('passed','Phiên đạt',s?.passedAttempts),metric('passRate','Tỷ lệ đạt',s?.passRate,'percent'),metric('learners','Học viên có phiên thi hợp lệ',s?.activeLearners)]);}
function progressReport(who:string,response:unknown):Report{const m=meta(response,'dts-progress'),theory=m.data.theory===undefined?[]:rows(m.data.theory,'theory progress'),simulation=m.data.simulation===null?[]:m.data.simulation===undefined?[]:rows(m.data.simulation,'simulation progress');
 const t=theory.find(x=>str(x.group_key)==='ALL'),s=simulation.find(x=>str(x.group_key)==='ALL');return report(who,'Progress — học tập 30 ngày',bMeta(response,'dts-progress'),[
 metric('tLearn','Người học lý thuyết',t?.learners),metric('tReview','Câu lý thuyết cần ôn',t?.need_review),metric('sLearn','Người học mô phỏng',s?.learners),metric('sReview','Tình huống cần ôn',s?.need_review)]);}
async function getDashboard(who:string,signal?:AbortSignal):Promise<Report[]>{const done=currentActor(who),jobs=[
 {label:'Content Builder',get:()=>contentBuilderApi.get<unknown>('/v1/admin/analytics/content-summary',{signal}),parse:contentReport},
 {label:'Media',get:()=>mediaApi.get<unknown>('/admin/summary',{signal}),parse:mediaReport},
 {label:'Identity',get:()=>identityApi.get<unknown>('/v1/admin/analytics/users-summary',{signal}),parse:userReport},
 {label:'Result',get:()=>resultApi.get<unknown>('/v1/results/admin/analytics/overview',{signal}),parse:resultReport},
 {label:'Progress',get:()=>progressApi.get<unknown>('/v1/progress/admin/analytics/overview',{signal}),parse:progressReport}];
 const data=await Promise.allSettled(jobs.map(async job=>{const v=await job.get();done();return job.parse(who,v);}));done();return data.map((r,i)=>r.status==='fulfilled'?r.value:unavailable(who,jobs[i].label,'Không tải được số liệu từ service; không thay thế bằng số 0.'));}
function asBreakdown(v:unknown,label:string):ReportRow[]{return rows(v,label).map((x,i)=>({id:`${label}:${i}`,cells:[str(x.sourceGroup),formatNullable(x.completedAttempts),formatNullable(x.passedAttempts),formatNullable(x.passRate)]}));}
function formatNullable(v:unknown):string{const n=nullableNumber(v);return n===null?'Chưa tính được':n.toLocaleString('vi-VN');}
async function reports(who:string,tab:'results'|'progress'|'exp',f:ReportFilter,signal?:AbortSignal):Promise<Report>{const done=currentActor(who),params=timeScope(f);
 if(tab==='results'){
  const [main,trends,groups]=await Promise.allSettled([
   resultApi.get<unknown>('/v1/results/admin/analytics/overview',{params,signal}),
   resultApi.get<unknown>('/v1/results/admin/analytics/trends',{params,signal}),
   resultApi.get<unknown>('/v1/results/admin/analytics/breakdown',{params,signal})]);done();if(main.status==='rejected')throw main.reason;
  const m=meta(main.value,'dts-result'),s=m.data.summary===null?null:object(m.data.summary,'summary');const warnings=[...m.warnings],missing=[...m.missingSources];let trend:Report['trend']=[],rowsData:ReportRow[]=[];
  if(trends.status==='fulfilled'){const t=meta(trends.value,'dts-result');if(t.data.dailyTrend!==null&&t.data.dailyTrend!==undefined)trend=rows(t.data.dailyTrend,'dailyTrend').map(x=>({date:str(x.date),value:nullableNumber(x.completedAttempts)}));}else{warnings.push('Không tải được xu hướng từ Result.');missing.push('dts-result-trends');}
  if(groups.status==='fulfilled'){const g=meta(groups.value,'dts-result');if(g.data.items!==null&&g.data.items!==undefined)rowsData=asBreakdown(g.data.items,'result-breakdown');}else{warnings.push('Không tải được bảng phân loại từ Result.');missing.push('dts-result-breakdown');}
  return report(who,'Result — kết quả thi',{dataStatus:m.status==='READY'&&(trends.status==='rejected'||groups.status==='rejected')?'PARTIAL':m.status,asOf:m.asOf,warnings,missingSources:missing},[
   metric('completed','Phiên thi hoàn thành',s?.completedAttempts),metric('passed','Phiên PASSED',s?.passedAttempts),metric('failed','Phiên FAILED',s?.failedAttempts),metric('rate','Tỷ lệ đạt',s?.passRate,'percent'),metric('score','Điểm chuẩn hóa trung bình',s?.averageNormalizedScore,'score'),metric('active','Học viên có thi hợp lệ',s?.activeLearners)],rowsData,['Nguồn','Số phiên','Phiên đạt','Tỷ lệ đạt (%)'],trend);
 }
 if(tab==='progress'){
  const [overview,chapters]=await Promise.allSettled([
   progressApi.get<unknown>('/v1/progress/admin/analytics/overview',{params:{from:params.from,to:params.to,licenseClass:params.licenseClass,module:params.module,bankVersion:f.bankVersion||undefined},signal}),
   progressApi.get<unknown>('/v1/progress/admin/analytics/chapters',{params:{from:params.from,to:params.to,licenseClass:params.licenseClass,module:params.module,bankVersion:f.bankVersion||undefined},signal})]);done();if(overview.status==='rejected')throw overview.reason;
  const m=meta(overview.value,'dts-progress'),t=m.data.theory?rows(m.data.theory,'theory'):[],s=m.data.simulation?rows(m.data.simulation,'simulation'):[],tt=t.find(x=>str(x.group_key)==='ALL'),ss=s.find(x=>str(x.group_key)==='ALL');const rowsData:ReportRow[]=[],warnings=[...m.warnings];
  if(chapters.status==='fulfilled'){const c=meta(chapters.value,'dts-progress');for(const [kind,values] of [['Lý thuyết',c.data.theory],['Mô phỏng',c.data.simulation]] as const){if(values)for(const row of rows(values,'chapters'))rowsData.push({id:`${kind}:${row.group_key}`,cells:[kind,str(row.group_key),formatNullable(row.learners),formatNullable(row.need_review)]});}}else warnings.push('Bảng tiến độ theo chương chưa truy cập được.');
  return report(who,'Progress — tiến độ',{dataStatus:m.status==='READY'&&chapters.status==='rejected'?'PARTIAL':m.status,asOf:m.asOf,warnings,missingSources:m.missingSources},[
   metric('tLearners','Học viên ôn lý thuyết',tt?.learners),metric('tStudies','Lượt câu lý thuyết theo phạm vi projection',tt?.studied_questions),metric('tReview','Câu lý thuyết cần ôn',tt?.need_review),metric('sLearners','Học viên luyện mô phỏng',ss?.learners),metric('sScenarios','Tình huống đã luyện',ss?.practiced_scenarios),metric('sPerfect','Tình huống đạt 5/5',ss?.perfect_scenarios),metric('sReview','Tình huống cần ôn',ss?.need_review)],rowsData,['Phân hệ','Chương','Học viên','Cần ôn']);
 }
 if(!f.licenseClass)return unavailable(who,'Result — EXP & Xếp hạng','Chọn hạng GPLX để xem EXP đúng chính sách.');
 const apiParams={from:params.from,to:params.to,licenseClass:f.licenseClass,module:params.module};
 const [exp,leader]=await Promise.allSettled([
  resultApi.get<unknown>('/v1/results/admin/exp/summary',{params:apiParams,signal}),resultApi.get<unknown>('/v1/results/admin/leaderboards',{params:{...apiParams,limit:20},signal})]);done();if(exp.status==='rejected')throw exp.reason;
 const m=meta(exp.value,'dts-result'),warnings=[...m.warnings];let rowsData:ReportRow[]=[];
 if(leader.status==='fulfilled'){const l=meta(leader.value,'dts-result');if(l.data.items)rowsData=rows(l.data.items,'leaderboard').map((x,i)=>({id:String(i),cells:[formatNullable(x.rank),str(x.learner_reference),formatNullable(x.ranking_score)]}));}else warnings.push('Xếp hạng chưa truy cập được từ Result.');
 return report(who,'Result — EXP & Xếp hạng',{dataStatus:m.status==='READY'&&leader.status==='rejected'?'PARTIAL':m.status,asOf:m.asOf,warnings,missingSources:m.missingSources},[
 metric('exp','EXP đã ghi nhận hợp lệ',m.data.totalCreditedExp,'exp'),metric('activities','Hoạt động được ghi EXP',m.data.creditedActivities)],rowsData,['Hạng','Mã học viên ẩn danh','EXP']);
}
async function monitor(who:string,signal?:AbortSignal):Promise<Monitoring>{
 const done=currentActor(who);
 const jobs=[
  {label:'Đồng bộ nội dung',service:'dts-content-builder',call:()=>contentBuilderApi.get<unknown>('/v1/admin/integrations/content-sync',{signal})},
  {label:'Đồng bộ kết quả',service:'dts-result',call:()=>resultApi.get<unknown>('/v1/results/admin/integrations/result-sync',{signal})},
  {label:'Đồng bộ tiến độ',service:'dts-progress',call:()=>progressApi.get<unknown>('/v1/progress/admin/integrations/progress-sync',{signal})},
  {label:'Media',service:'dts-media',call:()=>mediaApi.get<unknown>('/admin/summary',{signal})}
 ];
 const loaded=await Promise.allSettled(jobs.map(async j=>{const value=meta(await j.call(),j.service);done();return value;}));done();
 const find=(i:number)=>loaded[i].status==='fulfilled'?(loaded[i] as PromiseFulfilledResult<ReturnType<typeof meta>>).value:null;
 const content=find(0),result=find(1),progress=find(2),media=find(3);
 const groups:NonNullable<Monitoring['groups']>=[];
 function item(id:'content'|'results'|'media',label:string,sources:Array<ReturnType<typeof meta>|null>,data:Metric[],links:Array<{label:string;href:string}>){
  const good=sources.filter((x):x is ReturnType<typeof meta>=>x!==null),allGood=good.length===sources.length;
  const state:DataStatus=good.length===0?'UNAVAILABLE':!allGood||good.some(x=>x.status!=='READY')?'PARTIAL':'READY';
  const times=good.map(x=>x.asOf).sort();groups.push({id,label,dataStatus:state,asOf:times.length?times[times.length-1]:null,
   warnings:[...(allGood?[]:['Một hoặc nhiều nguồn báo cáo không khả dụng; không suy ra số 0.']),...good.flatMap(x=>x.warnings)],metrics:data,links});
 }
 let contentMetrics:Metric[]=[],mediaMetrics:Metric[]=[];const resultMetrics:Metric[]=[];
 if(content){const rs=rows(content.data.releases,'release sync');contentMetrics=[metric('release','Đợt phát hành trong sổ đồng bộ',rs.reduce((n,r)=>n+num(r.total,'release total'),0)),metric('error','Đợt có lỗi',rs.reduce((n,r)=>n+num(r.with_error,'release error'),0))];}
 if(result){const s=object(result.data.simulationStream,'result sync');resultMetrics.push(metric('resultPending','Sự kiện Result chưa áp dụng',s.pending),metric('resultWatermark','Watermark Result',s.watermark));}
 if(progress){const s=object(progress.data.simulationStream,'progress sync');resultMetrics.push(metric('progressPending','Sự kiện Progress chưa áp dụng',s.pending),metric('progressWatermark','Watermark Progress',s.watermark));}
 if(media)mediaMetrics=[metric('notReady','Media chưa READY',media.data.notReadyCount)];
 item('content','Đồng bộ nội dung',[content],contentMetrics,[{label:'Phát hành & Đồng bộ',href:'/admin/content-releases'}]);
 item('results','Đồng bộ kết quả và tiến độ',[result,progress],resultMetrics,[{label:'Báo cáo tổng hợp',href:'/admin/reports'}]);
 item('media','Trạng thái Media',[media],mediaMetrics,[{label:'Thư viện Media',href:'/admin/media'}]);
 const metaTimes=groups.map(x=>x.asOf).filter((x):x is string=>x!==null).sort();
 return {actorId:who,dataStatus:'PARTIAL',asOf:metaTimes.length?metaTimes[metaTimes.length-1]:null,
  services:[{id:'service-health',label:'Tình trạng service (chưa có API health tổng hợp đủ quyền)',status:'UNKNOWN',checkedAt:null}],
  events:{items:[],page:0,size:20,totalElements:0},eventsComplete:false,groups,
  warnings:['Hiện chỉ có thống kê đồng bộ theo nguồn. Chưa có API danh sách sự kiện liên service có phân trang; không suy luận Kafka ACK là đã cập nhật projection.']};
}
const licenses=['A','A1','B','B1','C1','C','D1','D2','D','BE','C1E','CE','D1E','D2E','DE'].map(id=>({id,label:`Hạng ${id}`}));
function opts(who:string):ReportOptions{return {actorId:who,licenses,modules:[{id:'THEORY',label:'Lý thuyết'},{id:'SIMULATION',label:'Mô phỏng'}],examTypes:[{id:'RANDOM',label:'RANDOM'},{id:'PRESET',label:'PRESET'},{id:'OFFICIAL',label:'Thi chính thức',module:'THEORY'}],banks:[],policies:[],canExport:false};}
/** BE06 V1 deliberately does not implement cross-service event-list, retries or CSV export. */
export function getAdmin06OperationsSource():OperationsSource|null{const who=useAuthStore.getState().user?.id??'';if(!who)return null;
 return {actorId:who,reportOptions:async()=>{currentActor(who)();return opts(who);},report:(tab,f,signal)=>reports(who,tab,f,signal),dashboard:(_scope:Partial<Scope>,signal)=>getDashboard(who,signal),monitoring:(_filter,signal)=>monitor(who,signal),event:async(_id:string,_signal?:AbortSignal):Promise<SyncEvent>=>{throw new Error('Chưa có danh sách sự kiện được xác minh để mở chi tiết.');},audit:async(_filter:AuditFilter,_signal?:AbortSignal):Promise<Page<AuditRow>>=>{throw new Error('Nhật ký vẫn dùng nguồn Admin01; adapter BE06 chưa hỗ trợ hợp nhất liên service.');},auditDetail:async(_id:string,_signal?:AbortSignal):Promise<AuditRow>=>{throw new Error('Chưa có nguồn chi tiết audit tổng hợp được xác minh.');}};}
