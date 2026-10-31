'use client';
import {AuthorizedAdminLink} from './operations-workspace';
import { useQuery } from '@tanstack/react-query';
import { useAdminAccess } from '../../foundation/admin-access-provider';
import { AdminPageState } from '../../foundation/components/admin-page-state';
import { checkReport,getAdminOperationsSource,type OperationsSource } from '../operations-model';
export function DashboardData({sourceOverride}:{sourceOverride?:OperationsSource|null}) {
 const {access,error}=useAdminAccess();const source=sourceOverride===undefined?getAdminOperationsSource():sourceOverride;const ready=Boolean(source&&source.actorId===access?.actorId&&!error);
 const query=useQuery({queryKey:['admin','workbench','dashboard',access?.actorId],queryFn:async({signal})=>(await source!.dashboard({},signal)).map(r=>checkReport(r,access!.actorId)),enabled:ready,retry:false,staleTime:0,gcTime:0});
 if(!ready)return <p role="status" className="rounded-xl border bg-card p-4 text-[15px]/6 text-muted-foreground">Số liệu tổng hợp hiện chưa khả dụng. Bạn có thể tiếp tục mở các mục quản trị được cấp quyền.</p>;
 if(query.isError)return <AdminPageState state="error" error={query.error} onRetry={()=>void query.refetch()}/>;
 if(query.isFetching)return <AdminPageState state="loading"/>;
 return <div className="grid gap-4 md:grid-cols-2">{query.data?.map((r,i)=><section key={`${r.sourceLabel}:${i}`} className="space-y-4 rounded-xl border bg-card p-5"><h2>{r.sourceLabel}</h2><p className="text-[14px]/6 text-muted-foreground">Cập nhật: {r.asOf??'Chưa có thông tin'}</p>{r.warnings.map((w,j)=><p key={j} role="status" className="text-[15px]/6 text-amber-800 dark:text-amber-300">{w}</p>)}{r.missingSources.length>0&&<p className="text-[14px]/6">Nguồn còn thiếu: {r.missingSources.join(', ')}</p>}{r.dataStatus==='UNAVAILABLE'?<p role="status" className="text-[15px]/6 text-muted-foreground">Chưa có số liệu được xác nhận.</p>:<><p className="text-[14px]/6">{r.dataStatus==='READY'?'Đã cập nhật':r.dataStatus==='PARTIAL'?'Chưa đủ nguồn dữ liệu':'Số liệu chưa cập nhật'}</p><dl className="grid grid-cols-2 gap-4">{r.metrics.map(m=><div key={m.key}><dt className="text-[15px]/6 text-muted-foreground">{m.href?<AuthorizedAdminLink href={m.href}>{m.label}</AuthorizedAdminLink>:m.label}</dt><dd className="text-[20px] font-semibold">{m.value===null?'Chưa tính được':`${m.value.toLocaleString('vi-VN')}${m.unit==='percent'?'%':m.unit==='exp'?' EXP':''}`}</dd></div>)}</dl></>}</section>)}</div>;
}
