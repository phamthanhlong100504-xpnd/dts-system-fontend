'use client';
import { useRef, useState } from 'react';
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
import { dateRangeProblem, defaultReportFilter, getAdminOperationsSource, type AuditFilter, type OperationsSource } from '../operations-model';

export function AuthorizedAdminLink({href,children}:{href:string|null;children:React.ReactNode}) {
  const {access}=useAdminAccess();
  const page=href?.startsWith('/admin/')&&!href.includes('\\')&&!href.includes('..')?findAdminPage(href):null;
  return page&&canReadAdminPage(access,page.id)?<Link className="font-medium text-primary underline-offset-4 hover:underline" href={href!}>{children}</Link>:null;
}
function Pager({page,size,total,busy,onPage}:{page:number;size:number;total:number;busy:boolean;onPage:(page:number)=>void}) {
  return <div className="flex flex-wrap items-center justify-between gap-3 text-[14px]/6"><p>{total} nội dung theo bộ lọc</p><div className="dts-admin-actions"><Button variant="outline" disabled={page===0||busy} onClick={()=>onPage(page-1)}>Trang trước</Button><span>Trang {page+1}</span><Button variant="outline" disabled={(page+1)*size>=total||busy} onClick={()=>onPage(page+1)}>Trang sau</Button></div></div>;
}
const unavailable=<p role="status" className="rounded-xl border bg-card p-4 text-[15px]/6 text-muted-foreground">Chưa có nguồn dữ liệu quản trị đã xác nhận. Thông tin và thao tác sẽ mở khi quyền cùng dữ liệu sẵn sàng.</p>;
export function MonitoringWorkspace({sourceOverride}:{sourceOverride?:OperationsSource|null}) {
  const {access,error:accessError}=useAdminAccess();
  const source=sourceOverride===undefined?getAdminOperationsSource():sourceOverride;
  const ready=Boolean(source&&source.actorId===access?.actorId&&!accessError);
  const [filter,setFilter]=useState({keyword:'',status:'',page:0,size:20}),[draft,setDraft]=useState(''),[selected,setSelected]=useState('');
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
  return <div className="space-y-6"><AdminPageHeader title="Giám sát vận hành" description="Theo dõi dịch vụ, việc tiếp nhận sự kiện và tình trạng áp dụng dữ liệu."/>{!ready&&unavailable}
    <section className="space-y-4 rounded-xl border bg-card p-5"><h2>Tình trạng dịch vụ</h2><p className="text-[14px]/6 text-muted-foreground">Cập nhật: {query.data?.asOf??'Chưa có thông tin'}</p>{query.data?.warnings.map((w,i)=><p key={i} role="status" className="text-[15px]/6 text-amber-800 dark:text-amber-300">{w}</p>)}<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{(ready&&!query.isError?query.data:undefined)?.services.map(s=><div className="rounded-lg border p-4 text-[15px]/6" key={s.id}><p className="font-semibold">{s.label}</p><p>{s.status==='UP'?'Đang hoạt động':s.status==='DOWN'?'Có gián đoạn':'Chưa xác minh'}</p><p className="text-[14px] text-muted-foreground">{s.checkedAt??'Chưa có thời điểm kiểm tra'}</p></div>)}</div>{!(ready&&!query.isError?query.data:undefined)?.services.length&&<p className="text-[15px]/6 text-muted-foreground">Chưa có tình trạng dịch vụ được xác nhận.</p>}</section>
    <div className="grid gap-4 xl:grid-cols-3">{([['content','Đồng bộ nội dung'],['results','Đồng bộ kết quả'],['media','Tài nguyên']] as const).map(([id,label])=>{const group=ready&&!query.isError?query.data?.groups?.find(g=>g.id===id):undefined;return <section key={label} className="space-y-3 rounded-xl border bg-card p-5"><h2>{group?.label??label}</h2><p className="text-[14px]/6 text-muted-foreground">Cập nhật: {group?.asOf??'Chưa có thông tin'}</p>{!group||group.dataStatus==='UNAVAILABLE'?<p role="status" className="text-[15px]/6 text-muted-foreground">Chưa có số liệu được xác nhận.</p>:<><p className="text-[14px]/6">{group.dataStatus==='READY'?'Đã cập nhật':group.dataStatus==='STALE'?'Số liệu chưa cập nhật':'Chưa đủ nguồn dữ liệu'}</p>{group.warnings.map((w,n)=><p role="status" className="text-[14px]/6 text-amber-800 dark:text-amber-300" key={n}>{w}</p>)}<dl className="space-y-2 text-[15px]/6">{group.metrics.map(m=><div key={m.key} className="flex justify-between gap-3"><dt>{m.label}</dt><dd className="font-semibold">{m.value??'Chưa tính được'}</dd></div>)}</dl>{group.links.map((link,n)=><AuthorizedAdminLink key={n} href={link.href}>{link.label}</AuthorizedAdminLink>)}</>}</section>;})}</div>
    <form onSubmit={e=>{e.preventDefault();setFilter(old=>({...old,keyword:draft,page:0}));}} className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-5"><label className="min-w-60 flex-1 space-y-2 text-[15px] font-medium"><span className="block">Mã sự kiện hoặc mã đối chiếu</span><Input value={draft} disabled={!ready} onChange={e=>setDraft(e.target.value)}/></label><label className="space-y-2 text-[15px] font-medium"><span className="block">Trạng thái sự kiện</span><select className="h-10 rounded-lg border bg-background px-3" disabled={!ready} value={filter.status} onChange={e=>setFilter(old=>({...old,status:e.target.value,page:0}))}><option value="">Tất cả</option>{query.data?.statusOptions?.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label><Button type="submit" disabled={!ready||query.isFetching}>Tìm kiếm</Button><Button type="button" variant="outline" disabled={!ready||busy} onClick={async()=>{const q=await query.refetch();const d=selected?await detail.refetch():null;if(!q.error&&!d?.error)setUncertain(false);}}>Tải lại trạng thái</Button></form>
    {failure&&<p role="alert" className="text-destructive">{failure}</p>}{notice&&<p role="status" className="text-[15px]/6">{notice}</p>}
    <section className="overflow-x-auto rounded-xl border bg-card"><table className="w-full min-w-[850px] text-left text-[15px]/6"><thead><tr className="border-b bg-muted/30">{['Sự kiện','Nguồn / Đích','Gửi nhận','Xử lý','Áp dụng','Số lần thử','Thao tác'].map(c=><th className="p-3" key={c}>{c}</th>)}</tr></thead><tbody>{(ready&&!query.isError?query.data:undefined)?.events.items.map(e=><tr className="border-b" key={e.id}><td className="p-3"><p className="font-medium">{e.label}</p><p className="text-[14px] text-muted-foreground">{e.occurredAt}</p></td><td className="p-3">{e.sourceLabel} / {e.targetLabel}</td><td className="p-3">{e.deliveryStatus}</td><td className="p-3">{e.consumerStatus}</td><td className="p-3">{e.projectionStatus}</td><td className="p-3">{e.attemptCount}</td><td className="p-3"><Button variant="outline" size="sm" onClick={()=>{setSelected(e.id);setFailure('');setNotice('');}}>Chi tiết</Button></td></tr>)}{!(ready&&!query.isError?query.data:undefined)?.events.items.length&&<tr><td colSpan={7} className="p-8 text-center text-muted-foreground">{query.isFetching?'Đang tải sự kiện…':query.isError?'Không thể tải danh sách sự kiện.':ready?'Không có sự kiện theo bộ lọc.':'Chưa có danh sách được xác nhận.'}</td></tr>}</tbody></table></section>
    {query.isError&&<AdminPageState state="error" error={query.error} onRetry={()=>void query.refetch()}/>}{query.data&&<Pager page={query.data.events.page} size={query.data.events.size} total={query.data.events.totalElements} busy={query.isFetching} onPage={page=>setFilter(old=>({...old,page}))}/>}
    {selected&&<section className="space-y-4 rounded-xl border bg-card p-5"><h2>Chi tiết sự kiện</h2>{detail.isError?<AdminPageState state="error" error={detail.error} onRetry={()=>void detail.refetch()}/>:detail.isFetching?<p role="status">Đang tải chi tiết…</p>:ready&&detail.data&&<><dl className="grid gap-3 text-[15px]/6 sm:grid-cols-2">{[['Mã sự kiện',detail.data.id],['Mã đối chiếu',detail.data.correlationId??'Chưa có'],['Thông tin lỗi',detail.data.safeError??'Chưa có lỗi được xác nhận'],['Trạng thái áp dụng',detail.data.projectionStatus]].map(([label,value])=><div key={label}><dt className="font-medium">{label}</dt><dd className="break-all">{value}</dd></div>)}</dl><AuthorizedAdminLink href={detail.data.href}>Mở nội dung liên quan</AuthorizedAdminLink>{source?.retryEvent&&detail.data.canRetry&&<Button disabled={busy||uncertain} onClick={()=>setConfirm(true)}>Yêu cầu thử lại</Button>}</>}<Button variant="outline" disabled={busy} onClick={()=>setSelected('')}>Đóng chi tiết</Button></section>}
    <AuthorizedAdminLink href="/admin/content-releases">Phát hành & Đồng bộ</AuthorizedAdminLink>{confirm&&<ActionConfirm title="Yêu cầu xử lý lại sự kiện" description="Hệ thống sẽ kiểm tra lại quyền và điều kiện của sự kiện. Sau thao tác, cần đọc lại trạng thái áp dụng." confirmLabel="Yêu cầu thử lại" onConfirm={retry} onClose={()=>setConfirm(false)}/>}
  </div>;
}
export function AuditWorkspace({sourceOverride}:{sourceOverride?:OperationsSource|null}) {
  const {access,error}=useAdminAccess();const source=sourceOverride===undefined?getAdminOperationsSource():sourceOverride;const ready=Boolean(source&&source.actorId===access?.actorId&&!error);
  const [filter,setFilter]=useState<AuditFilter>(()=>{const range=defaultReportFilter();return {from:range.from,to:range.to,actor:'',service:'',resource:'',action:'',result:'',correlationId:'',page:0,size:20};});
  const [draft,setDraft]=useState(filter),[selected,setSelected]=useState(''),[problem,setProblem]=useState('');
  const query=useQuery({queryKey:['admin','workbench','audit',access?.actorId,filter],queryFn:({signal})=>source!.audit(filter,signal),enabled:ready,retry:false,staleTime:0,gcTime:0});
  const detail=useQuery({queryKey:['admin','workbench','audit-detail',access?.actorId,selected],queryFn:async({signal})=>{const d=await source!.auditDetail(selected,signal);if(d.id!==selected)throw new Error('Bản ghi không khớp nội dung đang xem.');return d;},enabled:ready&&Boolean(selected),retry:false,staleTime:0,gcTime:0});
  const results={SUCCESS:'Thành công',DENIED:'Bị từ chối',FAILED:'Không thành công'};
  return <div className="space-y-6"><AdminPageHeader title="Nhật ký quản trị" description="Tra cứu người thao tác, nội dung và kết quả theo phạm vi được cấp quyền."/>{!ready&&unavailable}
    <form onSubmit={e=>{e.preventDefault();const p=dateRangeProblem(draft.from,draft.to);setProblem(p??'');if(!p){setSelected('');setFilter({...draft,page:0});}}} className="grid items-end gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2 xl:grid-cols-4">
      {([['from','Từ ngày'],['to','Đến ngày'],['actor','Người thao tác'],['service','Dịch vụ'],['resource','Nội dung'],['action','Thao tác'],['correlationId','Mã đối chiếu']] as const).map(([key,label])=><label key={key} className="space-y-2 text-[15px] font-medium"><span className="block">{label}</span><Input type={key==='from'||key==='to'?'date':'text'} disabled={!ready} value={draft[key]} onChange={e=>setDraft(old=>({...old,[key]:e.target.value}))}/></label>)}
      <label className="space-y-2 text-[15px] font-medium"><span className="block">Kết quả</span><select disabled={!ready} value={draft.result} onChange={e=>setDraft(old=>({...old,result:e.target.value}))} className="h-10 w-full rounded-lg border bg-background px-3"><option value="">Tất cả</option>{Object.entries(results).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label><div className="flex flex-col items-end gap-2 sm:col-span-2 xl:col-span-4"><p className="text-right text-[14px]/6 text-muted-foreground">Múi giờ lọc: Việt Nam (UTC+7).</p><Button className="h-10 w-auto shrink-0 whitespace-nowrap" type="submit" disabled={!ready||query.isFetching}>Tìm nhật ký</Button></div>
    </form>{problem&&<p role="alert" className="text-destructive">{problem}</p>}
    <section className="overflow-x-auto rounded-xl border bg-card"><table className="w-full min-w-[850px] text-left text-[15px]/6"><thead><tr className="border-b bg-muted/30">{['Thời điểm','Người thao tác','Dịch vụ','Thao tác','Nội dung / Phiên bản','Kết quả','Chi tiết'].map(c=><th className="p-3" key={c}>{c}</th>)}</tr></thead><tbody>{(ready&&!query.isError?query.data:undefined)?.items.map(r=><tr key={r.id} className="border-b"><td className="p-3">{r.occurredAt}</td><td className="p-3">{r.actorLabel}</td><td className="p-3">{r.serviceLabel}</td><td className="p-3">{r.actionLabel}</td><td className="p-3">{r.resourceLabel} · {r.versionLabel}</td><td className="p-3">{results[r.result]}</td><td className="p-3"><Button size="sm" variant="outline" onClick={()=>setSelected(r.id)}>Xem</Button></td></tr>)}{!(ready&&!query.isError?query.data:undefined)?.items.length&&<tr><td colSpan={7} className="p-8 text-center text-muted-foreground">{query.isFetching?'Đang tải nhật ký…':query.isError?'Không thể tải nhật ký.':ready?'Không có bản ghi theo bộ lọc.':'Chưa có nhật ký được xác nhận.'}</td></tr>}</tbody></table></section>
    {query.isError&&<AdminPageState state="error" error={query.error} onRetry={()=>void query.refetch()}/>}{query.data&&<Pager page={query.data.page} size={query.data.size} total={query.data.totalElements} busy={query.isFetching} onPage={page=>setFilter(old=>({...old,page}))}/>}
    {selected&&<section className="space-y-4 rounded-xl border bg-card p-5"><h2>Thông tin bản ghi</h2>{detail.isError?<AdminPageState state="error" error={detail.error} onRetry={()=>void detail.refetch()}/>:detail.isFetching?<p role="status">Đang tải bản ghi…</p>:ready&&detail.data&&<><dl className="grid gap-4 text-[15px]/6 sm:grid-cols-2">{[['Nội dung',detail.data.resourceLabel],['Mã nội dung',detail.data.resourceId],['Phiên bản',detail.data.versionLabel],['Lý do',detail.data.safeReason??'Chưa có thông tin'],['Mã đối chiếu',detail.data.correlationId??'Chưa có thông tin']].map(([label,value])=><div key={label}><dt className="font-medium">{label}</dt><dd className="break-all">{value}</dd></div>)}</dl><AuthorizedAdminLink href={detail.data.href}>Mở nội dung liên quan</AuthorizedAdminLink></>}<Button variant="outline" onClick={()=>setSelected('')}>Đóng chi tiết</Button></section>}
  </div>;
}
