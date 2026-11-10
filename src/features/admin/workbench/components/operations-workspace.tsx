'use client';
import { useRef, useState } from 'react';
import {vnTime} from '../../analytics/analytics-presentation';
import styles from './admin-operations-visual.module.css';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { ActionConfirm } from './action-confirm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminAccess } from '../../foundation/admin-access-provider';
import { canReadAdminPage } from '../../foundation/admin-access';
import { findAdminPage } from '../../foundation/admin-navigation';
import { AdminPageHeader } from '../../foundation/components/admin-page-header';
import { AdminPageState } from '../../foundation/components/admin-page-state';
import { adminFailure } from '../../foundation/admin-errors';
import { dateRangeProblem, defaultReportFilter, getAdminOperationsSource, getAdminAuditSource, type AuditFilter, type OperationsSource } from '../operations-model';

export function AuthorizedAdminLink({href,children}:{href:string|null;children:React.ReactNode}) {
  const {access}=useAdminAccess();
  const page=href?.startsWith('/admin/')&&!href.includes('\\')&&!href.includes('..')?findAdminPage(href):null;
  return page&&canReadAdminPage(access,page.id)?<Link className="font-medium text-primary underline-offset-4 hover:underline" href={href!}>{children}</Link>:null;
}
function Pager({page,size,total,busy,onPage,hasMore}:{page:number;size:number;total:number;busy:boolean;onPage:(page:number)=>void;hasMore?:boolean}) {
  return <div className="flex flex-wrap items-center justify-between gap-3 text-[14px]/6"><p>{hasMore===undefined?`${total} nội dung theo bộ lọc`:`Trang ${page+1} · ${hasMore?"Còn trang tiếp theo":"Trang cuối"}`}</p><div className="dts-admin-actions"><Button variant="outline" disabled={page===0||busy} onClick={()=>onPage(page-1)}>Trang trước</Button><span>Trang {page+1}</span><Button variant="outline" disabled={(hasMore===undefined?(page+1)*size>=total:!hasMore)||busy} onClick={()=>onPage(page+1)}>Trang sau</Button></div></div>;
}
const unavailable=<p role="status" className="rounded-xl border bg-card p-4 text-[15px]/6 text-muted-foreground">Chưa có nguồn dữ liệu quản trị đã xác nhận. Thông tin và thao tác sẽ mở khi quyền cùng dữ liệu sẵn sàng.</p>;
export function MonitoringWorkspace({sourceOverride}:{sourceOverride?:OperationsSource|null}) {
  const {access,error:accessError}=useAdminAccess();
  const source=sourceOverride===undefined?getAdminOperationsSource():sourceOverride;
  const ready=Boolean(source&&source.actorId===access?.actorId&&!accessError);
  const [filter,setFilter]=useState<{keyword:string;status:string;page:number;size:number;source:'dts-result'|'dts-progress'}>({keyword:'',status:'',page:0,size:20,source:'dts-result'}),[selected,setSelected]=useState('');
  const [confirm,setConfirm]=useState(false);
  const [busy,setBusy]=useState(false),[failure,setFailure]=useState(''),[notice,setNotice]=useState(''),[uncertain,setUncertain]=useState(false);
  const lock=useRef(false),operationKey=useRef<string|null>(null);
  const query=useQuery({queryKey:['admin','workbench','monitor',access?.actorId,filter],queryFn:async({signal})=>{
    const m=await source!.monitoring(filter,signal);
    if(m.actorId!==access?.actorId)throw new Error('Tài khoản đã thay đổi.');
    return m;
  },enabled:ready,retry:false,staleTime:0,gcTime:0});
  const detail=useQuery({queryKey:['admin','workbench','event',access?.actorId,selected],queryFn:async({signal})=>{
    const e=await source!.event(selected,signal);if(e.id!==selected)throw new Error('Thông tin không khớp sự kiện đang xem.');return e;
  },enabled:ready&&Boolean(selected),retry:false,staleTime:0,gcTime:0});
  const retry=async()=>{
    if(!ready||!source?.retryEvent||!detail.data?.canRetry||lock.current||uncertain)return false;
    const auth=useAuthStore.getState();if(auth.user?.id!==source.actorId||!auth.accessToken)return false;
    lock.current=true;setBusy(true);setFailure('');setNotice('');operationKey.current??=crypto.randomUUID();
    try {
      const fresh=await source.event(selected);
      if(!fresh.canRetry||fresh.id!==selected)throw new Error('Sự kiện không còn đủ điều kiện thử lại.');
      if(useAuthStore.getState().user?.id!==auth.user?.id||useAuthStore.getState().accessToken!==auth.accessToken)throw new Error('Tài khoản đã thay đổi.');
      await source.retryEvent(selected,operationKey.current);
      if(useAuthStore.getState().user?.id!==auth.user?.id||useAuthStore.getState().accessToken!==auth.accessToken)throw new Error('Tài khoản đã thay đổi.');
      const reread=await detail.refetch();if(reread.error)throw reread.error;
      await query.refetch();if(useAuthStore.getState().user?.id!==auth.user?.id||useAuthStore.getState().accessToken!==auth.accessToken)throw new Error('Tài khoản đã thay đổi.');operationKey.current=null;setNotice('Đã đọc lại trạng thái. Yêu cầu thử lại chưa đồng nghĩa dữ liệu đã được áp dụng.');return true;
    } catch(e) { setUncertain(true);setFailure(adminFailure(e,'Chưa xác nhận được thao tác. Tải lại trạng thái trước khi tiếp tục.').message);return false; }
    finally {lock.current=false;setBusy(false);}
  };
  const statusText = (value: string) => ({ UP: 'Hoạt động', DOWN: 'Cần kiểm tra', UNKNOWN: 'Chưa xác nhận', DELIVERED: 'Đã tiếp nhận', RECEIVED: 'Đã nhận', PENDING: 'Đang chờ', PROCESSING: 'Đang xử lý', PROCESSED: 'Đã xử lý', APPLIED: 'Đã áp dụng', SUCCESS: 'Thành công', FAILED: 'Cần xử lý', ERROR: 'Cần xử lý', RETRY: 'Đang thử lại', SKIPPED: 'Không áp dụng', ACCEPTED: 'Đã tiếp nhận', COMPLETED: 'Hoàn thành', UNAVAILABLE: 'Chưa có dữ liệu' } as Record<string, string>)[value.toUpperCase()] ?? 'Đang kiểm tra';
  const metricLabels: Record<string,string> = {
    release:'Đợt phát hành', error:'Đợt cần kiểm tra',
    resultPending:'Kết quả thi chưa cập nhật', progressPending:'Tiến độ học tập chưa cập nhật',
    notReady:'Tài nguyên cần hoàn thiện',
  };
  const data = ready && !query.isError ? query.data : undefined;
  const operational = data?.services.filter(s => s.status === 'UP').length;
  const readyGroups = data?.groups?.filter(g => g.dataStatus === 'READY').length;
  const uncertainCount = data?.services.filter(s => s.status === 'UNKNOWN').length;
  const eventStatus = (event:{deliveryStatus:string;consumerStatus:string;projectionStatus:string}) => {
    const phases=[event.deliveryStatus,event.consumerStatus,event.projectionStatus].map(v=>v?.toUpperCase()??'');
    if(phases.some(v=>['FAILED','ERROR','DOWN','DENIED'].includes(v)))return 'Cần kiểm tra';
    if(phases[2]==='APPLIED')return 'Đã cập nhật';
    if(phases.some(v=>['PENDING','PROCESSING','RETRY'].includes(v)))return 'Đang cập nhật';
    if(phases.some(v=>['DELIVERED','RECEIVED','ACCEPTED'].includes(v)))return 'Đã tiếp nhận';
    return 'Chưa xác nhận';
  };
  return <div className={styles.page} data-testid="admin-monitoring-page">
    <AdminPageHeader title="Giám sát vận hành" description="Theo dõi tình hình hoạt động, cập nhật dữ liệu và các vấn đề cần xử lý." />
    {!ready && unavailable}
    <section className={styles.metricsGrid} aria-label="Tình hình hoạt động">
      {([
        ['Khu vực có phản hồi', operational, 'success'],
        ['Nhóm đã cập nhật', readyGroups, 'neutral'],
        ['Chưa xác nhận', uncertainCount, 'danger'],
      ] as const).map(([label, value, tone]) => <div className={styles.metricCard} key={label}>
        <p>{label}</p><strong>{value ?? '—'}</strong><span className={styles.metricDescriptor}>Theo số liệu hiện tại</span>
        <span className={styles.toneMarker} data-tone={tone} aria-hidden="true" />
      </div>)}
    </section>
    {data?.dataStatus !== 'READY' && data && <p role="status" className={styles.notice}>Một số thông tin vận hành chưa được cập nhật đầy đủ.</p>}
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeading}><h2>Tình hình theo nhóm hoạt động</h2><AuthorizedAdminLink href="/admin/content-releases">Quản lý phát hành</AuthorizedAdminLink></div>
      <div className={styles.groupGrid}>
        {([['content','Nội dung đào tạo'], ['results','Kết quả và học tập'], ['media','Tài nguyên']] as const).map(([id,title]) => {
          const group = data?.groups?.find(g => g.id === id);
          const metrics = (group?.metrics ?? []).filter(m => m.value !== null && m.key !== 'resultWatermark' && m.key !== 'progressWatermark');
          return <article key={id} className={styles.groupCard}>
            <h3>{title}</h3>
            {group && group.dataStatus !== 'READY' && <p className={styles.groupNote}>Số liệu đang được cập nhật.</p>}
            {metrics.length ? <dl className={styles.groupRows}>{metrics.map(m => <div key={m.key}><dt>{metricLabels[m.key] ?? m.label}</dt><dd>{m.value!.toLocaleString('vi-VN')}{m.unit==='percent'?'%':''}</dd></div>)}</dl> : <p className={styles.groupNote}>Chưa có thống kê trong phạm vi này.</p>}
            {group?.links.map((link,i)=><AuthorizedAdminLink key={i} href={link.href}>{link.href==='/admin/content-releases'?'Phát hành & Đồng bộ':link.href==='/admin/reports'?'Báo cáo tổng hợp':link.href==='/admin/media'?'Thư viện tài nguyên':link.label}</AuthorizedAdminLink>)}
          </article>;
        })}
      </div>
    </section>
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeading}><h2>Lịch sử cập nhật</h2><Button type="button" variant="outline" disabled={!ready||busy} onClick={async()=>{const q=await query.refetch();const d=selected?await detail.refetch():null;if(!q.error&&!d?.error)setUncertain(false);}}>Làm mới</Button></div>
      <form className={styles.monitorFilters} onSubmit={e=>{e.preventDefault();setFilter(old=>({...old,keyword:'',page:0}));}}>
        <label><span>Nhóm hoạt động</span><select disabled={!ready} value={filter.source} onChange={e=>{setSelected('');setFilter(old=>({...old,source:e.target.value as 'dts-result'|'dts-progress',page:0}));}}><option value="dts-result">Kết quả thi</option><option value="dts-progress">Tiến độ học tập</option></select></label>
        <label><span>Trạng thái</span><select disabled={!ready} value={filter.status} onChange={e=>setFilter(old=>({...old,status:e.target.value,page:0}))}><option value="">Tất cả</option>{data?.statusOptions?.map(o=><option key={o.id} value={o.id}>{o.id==='APPLIED'?'Đã cập nhật':o.id==='PENDING'?'Đang chờ cập nhật':statusText(o.id)}</option>)}</select></label>
        <Button type="submit" disabled={!ready||query.isFetching}>Xem hoạt động</Button>
      </form>
      {failure && <p role="alert" className={styles.error}>{failure}</p>}{notice&&<p role="status" className={styles.notice}>{notice}</p>}
      <div className={styles.tableScroll}><table className={styles.table}><thead><tr>{['Hoạt động','Thời điểm','Tình trạng','Thao tác'].map(t=><th scope="col" key={t}>{t}</th>)}</tr></thead><tbody>
        {data?.events.items.map(e=><tr key={e.id}><td className={styles.eventTitle}>{e.label}</td><td>{vnTime(e.occurredAt)}</td><td><span className={styles.statusBadge}>{eventStatus(e)}</span></td><td><Button size="sm" variant="outline" onClick={()=>{setSelected(e.id);setFailure('');setNotice('');}}>Chi tiết</Button></td></tr>)}
        {!data?.events.items.length && <tr><td colSpan={4} className={styles.emptyCell}>{query.isFetching?'Đang tải lịch sử…':query.isError?'Không thể tải lịch sử cập nhật.':data?.eventsComplete===false?'Chưa thể lấy lịch sử của nhóm đang chọn.':'Không có sự kiện phù hợp.'}</td></tr>}
      </tbody></table></div>
      {query.isError && <AdminPageState state="error" error={query.error} onRetry={()=>void query.refetch()}/>}
      {data && <Pager page={data.events.page} size={data.events.size} total={data.events.totalElements} busy={query.isFetching} onPage={page=>setFilter(old=>({...old,page}))}/>}
    </section>
    {selected && <section className={styles.sectionCard}>
      <div className={styles.sectionHeading}><h2>Chi tiết cập nhật</h2><Button variant="outline" disabled={busy} onClick={()=>setSelected('')}>Đóng</Button></div>
      {detail.isError?<AdminPageState state="error" error={detail.error} onRetry={()=>void detail.refetch()}/>:detail.isFetching?<p role="status">Đang tải chi tiết…</p>:ready&&detail.data&&<>
        <dl className={styles.factsGrid}><div><dt>Hoạt động</dt><dd>{detail.data.label}</dd></div><div><dt>Thời điểm</dt><dd>{vnTime(detail.data.occurredAt)}</dd></div><div><dt>Tình trạng</dt><dd>{eventStatus(detail.data)}</dd></div>{detail.data.safeError&&<div className={styles.factWide}><dt>Vấn đề cần xử lý</dt><dd>{detail.data.safeError}</dd></div>}</dl>
        <div className={styles.detailActions}><AuthorizedAdminLink href={detail.data.href}>Mở nội dung liên quan</AuthorizedAdminLink>{source?.retryEvent&&detail.data.canRetry&&<Button disabled={busy||uncertain} onClick={()=>setConfirm(true)}>Yêu cầu xử lý lại</Button>}</div>
      </>}
    </section>}
    {confirm&&<ActionConfirm title="Yêu cầu xử lý lại cập nhật" description="Hệ thống sẽ kiểm tra lại quyền và tình trạng mới nhất trước khi thử lại. Sau thao tác, hãy kiểm tra trạng thái áp dụng." confirmLabel="Thử lại" onConfirm={retry} onClose={()=>setConfirm(false)}/>}
  </div>;
}
export function AuditWorkspace({sourceOverride}:{sourceOverride?:OperationsSource|null}) {
  const {access,error}=useAdminAccess();const source=sourceOverride===undefined?getAdminAuditSource(access?.actorId??''):sourceOverride;const ready=Boolean(source&&source.actorId===access?.actorId&&!error);
  const [filter,setFilter]=useState<AuditFilter>(()=>{const range=defaultReportFilter();return {from:range.from,to:range.to,actor:'',service:'',resource:'',action:'',result:'',correlationId:'',page:0,size:20};});
  const [draft,setDraft]=useState(filter),[selected,setSelected]=useState(''),[problem,setProblem]=useState('');
  const query=useQuery({queryKey:['admin','workbench','audit',access?.actorId,filter],queryFn:({signal})=>source!.audit(filter,signal),enabled:ready,retry:false,staleTime:0,gcTime:0});
  const detail=useQuery({queryKey:['admin','workbench','audit-detail',access?.actorId,selected],queryFn:async({signal})=>{const d=await source!.auditDetail(selected,signal);if(d.id!==selected)throw new Error('Bản ghi không khớp nội dung đang xem.');return d;},enabled:ready&&Boolean(selected),retry:false,staleTime:0,gcTime:0});
  const results: Record<string,string>={SUCCESS:'Thành công',DENIED:'Bị từ chối',FAILED:'Không thành công',RECORDED:'Đã ghi nhận'};
  const activityGroup = (value: string) => {
    const lower=value.toLowerCase();
    if(lower.includes('content')||lower.includes('builder'))return 'Nội dung đào tạo';
    if(lower.includes('practice'))return 'Bộ đề luyện tập';
    if(lower.includes('examination'))return 'Thi chính thức';
    return 'Hoạt động quản trị';
  };
  const data = ready && !query.isError ? query.data : undefined;
  const successCount = data?.items.filter(r=>r.result==='SUCCESS').length;
  const issueCount = data?.items.filter(r=>r.result==='DENIED'||r.result==='FAILED').length;
  return <div className={styles.page} data-testid="admin-audit-page">
    <AdminPageHeader title="Nhật ký quản trị" description="Tra cứu các thao tác quản trị và kiểm tra kết quả thực hiện." />
    {!ready && unavailable}
    <section className={styles.metricsGrid} aria-label="Tổng hợp trong trang hiện tại">
      {([['Bản ghi đang xem',data?.items.length],['Thành công',successCount],['Cần lưu ý',issueCount]] as const).map(([label,value])=><div key={label} className={styles.metricCard}><p>{label}</p><strong>{value??'—'}</strong><span className={styles.metricDescriptor}>Trong trang hiện tại</span></div>)}
    </section>
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeading}><h2>Tìm kiếm nhật ký</h2></div>
      <form className={styles.auditFilters} onSubmit={e=>{e.preventDefault();const p=dateRangeProblem(draft.from,draft.to);setProblem(p??'');if(!p){setSelected('');setFilter({...draft,page:0});}}}>
        <label><span>Từ ngày</span><Input type="date" disabled={!ready} value={draft.from} onChange={e=>setDraft(old=>({...old,from:e.target.value}))}/></label>
        <label><span>Đến ngày</span><Input type="date" disabled={!ready} value={draft.to} onChange={e=>setDraft(old=>({...old,to:e.target.value}))}/></label>
        <label><span>Nhóm hoạt động</span><select disabled={!ready} value={draft.service} onChange={e=>setDraft(old=>({...old,service:e.target.value,resource:'',correlationId:'',result:'',action:''}))}><option value="">Tất cả nhóm</option><option value="dts-content-builder">Nội dung đào tạo</option><option value="dts-practice">Bộ đề luyện tập</option><option value="dts-examination">Thi chính thức</option></select></label>
        <label><span>Kết quả</span><select disabled={!ready} value={draft.result} onChange={e=>setDraft(old=>({...old,result:e.target.value}))}><option value="">Tất cả</option>{Object.entries(results).filter(([k])=>draft.service&&draft.service!=='dts-content-builder'?k==='RECORDED':k!=='RECORDED').map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
        <details className={styles.advancedFilters}><summary>Bộ lọc nâng cao</summary><div className={styles.advancedGrid}>
          <label><span>Mã tài khoản (nếu có)</span><Input value={draft.actor} disabled={!ready} onChange={e=>setDraft(old=>({...old,actor:e.target.value}))} placeholder="Nhập mã nếu cần" /></label>
          <label><span>Loại nội dung</span><Input value={draft.resource} disabled={!ready||(Boolean(draft.service)&&draft.service!=='dts-content-builder')} onChange={e=>setDraft(old=>({...old,resource:e.target.value}))} /></label>
          <label><span>Loại thao tác</span><Input value={draft.action} disabled={!ready||draft.service==='dts-examination'} onChange={e=>setDraft(old=>({...old,action:e.target.value}))} /></label>
          <label><span>Mã đối chiếu (nếu có)</span><Input value={draft.correlationId} disabled={!ready||(Boolean(draft.service)&&draft.service!=='dts-content-builder')} onChange={e=>setDraft(old=>({...old,correlationId:e.target.value}))} /></label>
        </div></details>
        <Button className={styles.searchButton} disabled={!ready||query.isFetching} type="submit">Tìm nhật ký</Button>
      </form>
      {problem&&<p role="alert" className={styles.error}>{problem}</p>}
    </section>
    <section className={styles.sectionCard}>
      <div className={styles.sectionHeading}><h2>Lịch sử hoạt động</h2></div>
      <div className={styles.tableScroll}><table className={styles.table}><thead><tr>{['Thời điểm','Người thực hiện','Nhóm hoạt động','Thao tác','Nội dung','Kết quả','Chi tiết'].map(c=><th key={c} scope="col">{c}</th>)}</tr></thead><tbody>
        {data?.items.map(r=><tr key={r.id}><td>{vnTime(r.occurredAt)}</td><td>{r.actorLabel}</td><td>{activityGroup(r.serviceLabel)}</td><td>{r.actionLabel}</td><td>{r.resourceLabel}{r.versionLabel&&<span className={styles.minorValue}>{r.versionLabel}</span>}</td><td><span className={styles.statusBadge} data-result={r.result}>{results[r.result]}</span></td><td><Button size="sm" variant="outline" onClick={()=>setSelected(r.id)}>Xem</Button></td></tr>)}
        {!data?.items.length&&<tr><td colSpan={7} className={styles.emptyCell}>{query.isFetching?'Đang tải nhật ký…':query.isError?'Không thể tải nhật ký.':'Chưa có hoạt động trong phạm vi lọc.'}</td></tr>}
      </tbody></table></div>
      {query.isError&&<AdminPageState state="error" error={query.error} onRetry={()=>void query.refetch()}/>}
      {data&&<Pager page={data.page} size={data.size} total={data.totalElements} hasMore={data.hasMore} busy={query.isFetching} onPage={page=>setFilter(old=>({...old,page}))}/>}
    </section>
    {selected&&<section className={styles.sectionCard}>
      <div className={styles.sectionHeading}><h2>Chi tiết thao tác</h2><Button variant="outline" onClick={()=>setSelected('')}>Đóng</Button></div>
      {detail.isError?<AdminPageState state="error" error={detail.error} onRetry={()=>void detail.refetch()}/>:detail.isFetching?<p role="status">Đang tải chi tiết…</p>:ready&&detail.data&&<>
        <dl className={styles.factsGrid}><div><dt>Người thực hiện</dt><dd>{detail.data.actorLabel}</dd></div><div><dt>Thời điểm</dt><dd>{vnTime(detail.data.occurredAt)}</dd></div><div><dt>Thao tác</dt><dd>{detail.data.actionLabel}</dd></div><div><dt>Kết quả</dt><dd>{results[detail.data.result]}</dd></div><div><dt>Nội dung</dt><dd>{detail.data.resourceLabel}</dd></div><div><dt>Phiên bản</dt><dd>{detail.data.versionLabel || 'Không áp dụng'}</dd></div>{detail.data.safeReason&&<div className={styles.factWide}><dt>Thông tin bổ sung</dt><dd>{detail.data.safeReason}</dd></div>}</dl>
        <AuthorizedAdminLink href={detail.data.href}>Mở nội dung liên quan</AuthorizedAdminLink>
      </>}
    </section>}
  </div>;
}
