'use client';
import {useState} from 'react';
import Link from 'next/link';
import {useQuery} from '@tanstack/react-query';
import {useAdminAccess} from '../foundation/admin-access-provider';
import {AdminPageState} from '../foundation/components/admin-page-state';
import {editorial,editorialList,editorialDetail,uuid,type EditorialKind,type EditorialItem} from './source';
import {EditorialClonePanel} from './draft-workspace';
import {EditorialDraftList} from '../content/editorial-draft-list';

function preview(v:unknown):string {return typeof v==='string'?v:typeof v==='number'?String(v):'';}
function itemTitle(x:EditorialItem){const p=x.payload;return preview(p.name)||preview(p.title)||preview(p.content)||x.id;}
export function EditorialCatalog({kind,baseHref}:{kind:EditorialKind;baseHref:string}){
 const {access,can}=useAdminAccess();const [keyword,setKeyword]=useState(''),[search,setSearch]=useState(''),[status,setStatus]=useState(''),[page,setPage]=useState(0);
 const allowed=Boolean(access&&can(editorial[kind].resource,'read'));
 const query=useQuery({queryKey:['admin03','editorial',access?.actorId,kind,status,search,page],queryFn:({signal})=>editorialList(kind,{page,size:20,status,keyword:search},signal),enabled:allowed,retry:false,staleTime:0});
 return <div className="space-y-6"><section className="rounded-2xl border bg-card p-6"><h1 className="text-2xl font-bold">{editorial[kind].title} — Nguồn quản trị</h1><p className="mt-2 text-sm text-muted-foreground">Đọc dữ liệu thực từ Content Builder BE03. Phiên bản đã công bố không thể sửa trực tiếp; bản nháp biên tập quản lý riêng với nguồn.</p></section>
 {!allowed?<AdminPageState state="error" title="Chưa xác nhận quyền đọc nội dung"/>:<>
 <EditorialDraftList kind={kind} baseHref={baseHref} actorId={access?.actorId??''} enabled={allowed}/>
 <form className="flex flex-wrap items-end gap-3 rounded-2xl border bg-card p-4" onSubmit={e=>{e.preventDefault();setSearch(keyword.trim());setPage(0)}}><label className="flex min-w-56 flex-1 flex-col gap-1 text-sm">Tìm theo nội dung<input className="h-10 rounded-lg border bg-background px-3" maxLength={128} value={keyword} onChange={e=>setKeyword(e.target.value)}/></label><label className="flex min-w-44 flex-col gap-1 text-sm">Trạng thái<select className="h-10 rounded-lg border bg-background px-3" value={status} onChange={e=>{setStatus(e.target.value);setPage(0)}}><option value="">Tất cả</option>{['DRAFT','PUBLISHED','ARCHIVED','HIDDEN'].map(s=><option value={s} key={s}>{s}</option>)}</select></label><button className="h-10 rounded-lg bg-primary px-5 text-primary-foreground" type="submit">Tìm kiếm</button></form>
 {query.isPending?<AdminPageState state="loading"/>:query.isError?<AdminPageState state="error" error={query.error} onRetry={()=>void query.refetch()}/>:<><div className="overflow-x-auto rounded-2xl border bg-card"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b bg-muted/30"><tr><th className="p-4">Nội dung nguồn</th><th className="p-4">Loại</th><th className="p-4">Trạng thái thực</th><th className="p-4">Phiên bản nguồn</th><th className="p-4 text-right">Thao tác</th></tr></thead><tbody>{query.data.content.map(x=><tr className="border-b last:border-0" key={x.id}><td className="p-4"><p className="max-w-xl break-words font-medium">{itemTitle(x)}</p><p className="mt-1 break-all text-xs text-muted-foreground">{x.id}</p></td><td className="p-4">{editorial[kind].title}</td><td className="p-4">{x.status}</td><td className="p-4">{preview(x.payload.bankVersion)||'Chưa có'}</td><td className="p-4 text-right"><Link className="rounded-lg border px-3 py-2 text-sm" href={`${baseHref}/${encodeURIComponent(x.id)}`}>Xem nguồn</Link></td></tr>)}{!query.data.content.length&&<tr><td className="p-7 text-center text-muted-foreground" colSpan={5}>Không có nội dung theo bộ lọc.</td></tr>}</tbody></table></div><div className="flex items-center justify-between gap-3 text-sm"><span>{query.data.total} mục (dữ liệu backend)</span><div className="flex items-center gap-3"><button className="rounded-lg border px-3 py-2 disabled:opacity-50" disabled={page===0||query.isFetching} onClick={()=>setPage(x=>x-1)}>Trang trước</button>Trang {page+1}<button className="rounded-lg border px-3 py-2 disabled:opacity-50" disabled={(page+1)*20>=query.data.total||query.isFetching} onClick={()=>setPage(x=>x+1)}>Trang sau</button></div></div></>}
 </>}
 </div>;
}
export function EditorialSourceDetail({kind,id,baseHref}:{kind:EditorialKind;id:string;baseHref:string}){
 const {access,can}=useAdminAccess();const allowed=Boolean(access&&can(editorial[kind].resource,'read')&&uuid(id));
 const query=useQuery({queryKey:['admin03','source',access?.actorId,kind,id],queryFn:({signal})=>editorialDetail(kind,id,signal),enabled:allowed,retry:false,staleTime:0});
 return <div className="space-y-5"><section className="rounded-2xl border bg-card p-6"><Link className="text-sm underline" href={baseHref}>Quay lại danh sách</Link><h1 className="mt-3 text-2xl font-bold">Chi tiết nguồn — {editorial[kind].title}</h1><p className="mt-2 text-sm text-muted-foreground">Đọc nguồn Content Builder; không sử dụng API cập nhật trực tiếp dữ liệu đã công bố.</p></section>
 {!allowed?<AdminPageState state="error" title="Chưa xác minh quyền hoặc mã nội dung"/>:query.isPending?<AdminPageState state="loading"/>:query.isError?<AdminPageState state="error" error={query.error} onRetry={()=>void query.refetch()}/>:<><SourceFields item={query.data}/><EditorialClonePanel kind={kind} item={query.data} baseHref={baseHref}/></>}
 </div>;
}
function SourceFields({item}:{item:EditorialItem}){
 const p=item.payload;const fields=[['Mã nguồn',p.sourceId??p.code??item.id],['Tiêu đề',p.name??p.title??p.content],['Trạng thái',item.status],['Phiên bản',p.bankVersion],['Nhóm',p.categoryName??p.category],['Thứ tự',p.sortOrder],['Mô tả/Ý nghĩa',p.meaning??p.description],['Mẹo',p.quickTip??p.quickRule],['Giải thích',p.explanation??p.explanations],['Ảnh / Media ID',p.mediaFileId]];
 return <section className="space-y-4 rounded-2xl border bg-card p-5"><div className="grid gap-4 md:grid-cols-2">{fields.filter(x=>x[1]!==null&&x[1]!==undefined&&['string','number'].includes(typeof x[1])).map(([label,value])=><div key={String(label)}><p className="text-xs text-muted-foreground">{String(label)}</p><p className="mt-1 whitespace-pre-wrap break-all text-sm">{String(value)}</p></div>)}</div>{Array.isArray(p.options)&&<div className="border-t pt-4"><h2 className="mb-3 font-semibold">Các phương án nguồn</h2>{p.options.map((value,i)=>{const opt=value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};return <p className="mb-2 text-sm" key={typeof opt.id==='string'?opt.id:i}>{i+1}. {preview(opt.content)} {opt.isCorrect===true?'(đáp án đúng)':''}</p>})}</div>}{Array.isArray(p.blocks)&&<p className="border-t pt-4 text-sm">Số khối liên kết: {p.blocks.length}. Không thay đổi liên kết của bản đã công bố.</p>}</section>;
}
