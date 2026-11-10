'use client';
import Link from 'next/link';
import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {editorial,type EditorialKind} from '../admin03/source';
import {editorialDraftPage} from '../admin03/write-source';

/** Resumable drafts are separate from published source catalog; listing never mutates. */
export function EditorialDraftList({kind,baseHref,actorId,enabled}:{kind:EditorialKind;baseHref:string;actorId:string;enabled:boolean}){
 const [page,setPage]=useState(0),[state,setState]=useState('');
 const result=useQuery({queryKey:['content','editorial-drafts',actorId,kind,state,page],
   queryFn:({signal})=>editorialDraftPage(kind,page,15,state?state as 'DRAFT'|'IN_REVIEW'|'ARCHIVED':undefined,signal),
   enabled:enabled&&Boolean(actorId),retry:false,staleTime:0});
 if(!enabled)return null;
 return <section className="space-y-3 rounded-2xl border bg-card p-5">
 <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Bản nháp {editorial[kind].title}</h2><p className="text-xs text-muted-foreground">Danh sách riêng lấy từ Backend; không bao gồm bản đã công bố của học viên.</p></div>
 <label className="text-sm">Trạng thái <select className="ml-2 rounded-lg border bg-background px-3 py-2" value={state} onChange={e=>{setState(e.target.value);setPage(0)}}><option value="">Tất cả</option><option value="DRAFT">Đang soạn</option><option value="IN_REVIEW">Đang duyệt</option><option value="ARCHIVED">Đã lưu trữ</option></select></label></div>
 {result.isPending?<p className="text-sm">Đang tải bản nháp...</p>:result.isError?<p role="alert" className="text-sm text-destructive">{result.error instanceof Error?result.error.message:'Không tải được bản nháp'}</p>:<>
 {result.data.content.length===0?<p className="text-sm text-muted-foreground">Không có bản nháp theo bộ lọc.</p>:<div className="divide-y">{result.data.content.map(d=><div className="flex flex-wrap items-center justify-between gap-3 py-3" key={d.draftId}><div><p className="text-sm font-medium">{d.proposedVersion} · {d.state}</p><p className="text-xs text-muted-foreground">Revision {d.revision} · {new Date(d.updatedAt).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'})}</p></div><Link className="rounded-lg border px-3 py-2 text-sm" href={`${baseHref}/draft/${encodeURIComponent(d.draftId)}`}>Mở bản nháp</Link></div>)}</div>}
 <div className="flex items-center justify-between gap-2 text-xs"><span>{result.data.total} bản nháp</span><div className="flex items-center gap-2"><button className="rounded-lg border px-3 py-2 disabled:opacity-50" disabled={page===0||result.isFetching} onClick={()=>setPage(p=>p-1)}>Trước</button><span>Trang {page+1}</span><button className="rounded-lg border px-3 py-2 disabled:opacity-50" disabled={(page+1)*15>=result.data.total||result.isFetching} onClick={()=>setPage(p=>p+1)}>Sau</button></div></div></>}
 </section>;
}
