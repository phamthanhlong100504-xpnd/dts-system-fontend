'use client';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useState} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {useAdminAccess} from '../foundation/admin-access-provider';
import {AdminPageState} from '../foundation/components/admin-page-state';
import {editorial,uuid,type EditorialKind,type EditorialItem} from './source';
import {cloneEditorial,editorialAudit,patchEditorial,readEditorialDraft,reviewStatus,submitReview,validateEditorial,type EditorialDraft,type DraftValidation} from './write-source';
import {draftFieldDefinitions,initialDraftFields,parseDraftFieldChanges} from '../content/editorial-draft-fields';
import {EditorialSourceCreation} from '../content/editorial-source-creation';

const brief=(e:unknown)=>e instanceof Error?e.message:'Backend từ chối thao tác, vui lòng thử lại sau khi kiểm tra quyền.';
const code=(s:string)=>s.replace(/[^A-Za-z0-9._-]/g,'').slice(0,128);

/** BE03 supports cloning existing source rows only, not creating a blank editorial row. */
export function EditorialDraftLanding({kind,baseHref}:{kind:EditorialKind;baseHref:string}){
 return <section className="space-y-4 rounded-2xl border bg-card p-6"><h1 className="text-2xl font-bold">Tạo bản nháp — {editorial[kind].title}</h1>
 <p className="text-sm text-muted-foreground">Có thể tạo nguồn mới ở trạng thái DRAFT hoặc sao chép một nguồn đã tồn tại. Chưa có thao tác công bố cho học viên tại đây.</p>
 <Link className="inline-flex rounded-lg border px-4 py-2" href={baseHref}>Chọn nội dung nguồn có sẵn</Link><EditorialSourceCreation kind={kind} baseHref={baseHref}/></section>;
}
export function EditorialClonePanel({kind,item,baseHref}:{kind:EditorialKind;item:EditorialItem;baseHref:string}){
 const {can}=useAdminAccess();const router=useRouter();const [version,setVersion]=useState('');const [error,setError]=useState('');const resource=editorial[kind].resource;
 const op=useMutation({mutationFn:()=>cloneEditorial(kind,item.id,version.trim()),onSuccess:d=>router.push(`${baseHref}/draft/${encodeURIComponent(d.draftId)}`),onError:e=>setError(brief(e))});
 if(!can(resource,'create')||!['PUBLISHED','DRAFT'].includes(item.status))return null;
 return <section className="space-y-3 rounded-2xl border bg-card p-5"><h2 className="font-semibold">Sao chép thành bản nháp mới</h2><p className="text-sm text-muted-foreground">Không thay đổi bản nguồn. Hãy đặt mã phiên bản mới, không trùng với phiên bản khác.</p>
 <form className="flex flex-wrap items-end gap-3" onSubmit={e=>{e.preventDefault();setError('');op.mutate()}}><label className="flex min-w-64 flex-1 flex-col gap-1 text-sm">Mã phiên bản đề xuất<input className="h-10 rounded-lg border bg-background px-3" required minLength={2} maxLength={128} pattern="[A-Za-z0-9][A-Za-z0-9._-]{1,127}" value={version} onChange={e=>setVersion(code(e.target.value))} placeholder="vd: custom-v2"/></label><button type="submit" disabled={op.isPending} className="h-10 rounded-lg bg-primary px-4 text-primary-foreground disabled:opacity-50">{op.isPending?'Đang tạo...':'Tạo bản nháp'}</button></form>
 {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}</section>;
}

export function EditorialDraftWorkspace({kind,draftId,baseHref}:{kind:EditorialKind;draftId:string;baseHref:string}){
 const {access,can}=useAdminAccess(),resource=editorial[kind].resource;
 const actor=access?.actorId??'',qc=useQueryClient();const [receipt,setReceipt]=useState<DraftValidation|null>(null);const [message,setMessage]=useState('');
 const allowed=Boolean(actor&&can(resource,'read')&&uuid(draftId));
 const query=useQuery({queryKey:['admin03','draft',actor,kind,draftId],queryFn:({signal})=>readEditorialDraft(kind,draftId,signal),enabled:allowed,retry:false,staleTime:0});
 const audit=useQuery({queryKey:['admin03','audit',actor,kind,draftId],queryFn:({signal})=>editorialAudit(kind,draftId,signal),enabled:allowed,retry:false,staleTime:0});
 const review=useQuery({queryKey:['admin03','review',actor,kind,draftId],queryFn:({signal})=>reviewStatus(kind,draftId,signal),enabled:allowed&&query.data?.state==='IN_REVIEW',retry:false,staleTime:0});
 const refresh=()=>{void qc.invalidateQueries({queryKey:['admin03','draft',actor,kind,draftId]});void qc.invalidateQueries({queryKey:['admin03','audit',actor,kind,draftId]});void qc.invalidateQueries({queryKey:['admin03','review',actor,kind,draftId]});};
 if(!allowed)return <AdminPageState state="error" title="Không đủ quyền đọc hoặc mã bản nháp chưa hợp lệ"/>;
 return <div className="space-y-5"><section className="rounded-2xl border bg-card p-6"><Link href={baseHref} className="text-sm underline">Về danh sách nguồn</Link><h1 className="mt-3 text-2xl font-bold">Bản nháp — {editorial[kind].title}</h1><p className="mt-2 break-all text-xs text-muted-foreground">Draft ID: {draftId}</p><p className="mt-2 text-sm text-muted-foreground">Mọi thay đổi lưu vào bản nháp BE03. Không có thao tác phát hành hoặc thay đổi dữ liệu học viên trên trang này.</p></section>
 {query.isPending?<AdminPageState state="loading"/>:query.isError?<AdminPageState state="error" error={query.error} onRetry={()=>void query.refetch()}/>:<>
 <div className="rounded-xl border bg-card p-4 text-sm">Phiên bản: <strong>{query.data.proposedVersion}</strong> · Trạng thái: <strong>{query.data.state}</strong> · Revision: <strong>{query.data.revision}</strong> · Công bố cho học viên: <strong>Chưa hỗ trợ</strong></div>
 {query.data.sourceStatus==='NEW'&&<p className="rounded-xl border bg-card p-4 text-sm">Đây là bản nháp mới chưa có nguồn phát hành. Có thể lưu/chỉnh sửa, nhưng chưa được gửi duyệt công bố cho tới khi Backend tạo nguồn đã kiểm chứng.</p>}
 {query.data.state==='DRAFT'&&can(resource,'update')?<DraftForm key={`${draftId}:${query.data.revision}`} draft={query.data} canSubmit={query.data.sourceStatus!=='NEW'&&can(resource,'submit')} receipt={receipt} onReceipt={setReceipt} onMessage={setMessage} refresh={refresh}/>:<p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">Bản nháp ở trạng thái chỉ đọc hoặc tài khoản không có quyền chỉnh sửa.</p>}
 {query.data.state==='IN_REVIEW'&&<section className="space-y-2 rounded-xl border bg-card p-5"><h2 className="font-semibold">Trạng thái phê duyệt độc lập</h2>{review.isPending?<p className="text-sm">Đang kiểm tra...</p>:review.isError?<AdminPageState state="error" error={review.error} onRetry={()=>void review.refetch()}/>:<><p className="text-sm">Phiên bản BE01: {review.data.revisionId}</p><p className="text-sm">Trạng thái: {review.data.revisionStatus} · Đã phê duyệt metadata: {review.data.approvedMetadata?'Có':'Chưa'} · Được phát hành: <strong>Không</strong></p><p className="text-sm">Các điều kiện chặn: {review.data.blockers.join(', ')}</p></>}</section>}
 {!!query.data.blockers.length&&<p className="rounded-xl border p-4 text-xs text-muted-foreground">Backend đang chặn phát hành: {query.data.blockers.join(', ')}</p>}
 {message&&<p role="status" className="rounded-xl border p-3 text-sm">{message}</p>}
 <section className="rounded-2xl border bg-card p-5"><h2 className="mb-3 font-semibold">Nhật ký bản nháp</h2>{audit.isPending?<p className="text-sm">Đang tải...</p>:audit.isError?<p role="alert" className="text-sm text-destructive">{brief(audit.error)}</p>:audit.data.length===0?<p className="text-sm">Chưa có nhật ký.</p>:<div className="space-y-2">{audit.data.slice(-30).map(a=><p key={a.id} className="border-b py-2 text-sm">{a.action} · Revision {a.revision} · {a.message}</p>)}</div>}</section>
 </>}</div>;
}
function DraftForm({draft,receipt,canSubmit,onReceipt,onMessage,refresh}:{draft:EditorialDraft;receipt:DraftValidation|null;canSubmit:boolean;onReceipt:(r:DraftValidation|null)=>void;onMessage:(s:string)=>void;refresh:()=>void}){
 const defs=draftFieldDefinitions(draft.kind);const initial=initialDraftFields(draft.kind,draft.payload);
 const [fields,setFields]=useState<Record<string,string>>(initial),[reason,setReason]=useState(''),[title,setTitle]=useState(''),[description,setDescription]=useState(''),[reviewReason,setReviewReason]=useState(''),[error,setError]=useState('');
 const changed=Object.keys(fields).some(k=>fields[k]!==initial[k]);
 const save=useMutation({mutationFn:()=>patchEditorial(draft.kind,draft.draftId,draft.revision,parseDraftFieldChanges(draft.kind,draft.payload,fields),reason),onSuccess:()=>{onReceipt(null);onMessage('Đã lưu bản nháp. Revision đã được cập nhật từ backend.');setError('');refresh()},onError:e=>setError(brief(e))});
 const check=useMutation({mutationFn:()=>validateEditorial(draft.kind,draft.draftId,draft.revision),onSuccess:r=>{onReceipt(r);onMessage(r.structurallyValid?'Đã kiểm tra cấu trúc bản nháp. Chưa được công bố.':'Backend phát hiện lỗi cấu trúc, cần sửa lại.');setError('');refresh()},onError:e=>setError(brief(e))});
 const submit=useMutation({mutationFn:()=>submitReview(draft.kind,draft.draftId,draft.revision,title,description,reviewReason),onSuccess:()=>{onReceipt(null);onMessage('Đã gửi phê duyệt độc lập. Nội dung chưa phát hành cho học viên.');setError('');refresh()},onError:e=>setError(brief(e))});
 const valid=receipt?.draftId===draft.draftId&&receipt.revision===draft.revision&&receipt.structurallyValid&&!changed;
 return <div className="space-y-5"><section className="space-y-4 rounded-2xl border bg-card p-5"><h2 className="font-semibold">Chỉnh sửa có kiểm soát (chỉ các trường BE03 xác nhận)</h2><p className="text-xs text-muted-foreground">Chỉ các trường đã thay đổi mới được gửi tới BE03. Các cấu trúc JSON giữ nguyên ID; việc thay Media vẫn phải được Backend kiểm chứng, không tự công bố.</p>
 {defs.map(f=><label key={f.id} className="block space-y-1 text-sm">{f.label}{f.mode==='json'||f.mode==='paragraph'?<textarea className={`w-full rounded-lg border bg-background p-3 ${f.mode==='json'?'font-mono text-xs':''}`} rows={f.mode==='json'?7:3} maxLength={f.mode==='json'?120000:50000} value={fields[f.id]??''} onChange={e=>setFields(p=>({...p,[f.id]:e.target.value}))}/>:f.mode==='select'?<select className="h-10 w-full rounded-lg border bg-background px-3" value={fields[f.id]??''} onChange={e=>setFields(p=>({...p,[f.id]:e.target.value}))}>{f.choices?.map(value=><option key={value} value={value}>{value}</option>)}</select>:<input className="h-10 w-full rounded-lg border bg-background px-3" type={f.mode==='number'?'number':'text'} min={f.mode==='number'?1:undefined} maxLength={f.mode==='number'?undefined:1000} value={fields[f.id]??''} onChange={e=>setFields(p=>({...p,[f.id]:e.target.value}))}/>}</label>)}
 <label className="block space-y-1 text-sm">Lý do chỉnh sửa<input className="h-10 w-full rounded-lg border bg-background px-3" maxLength={500} value={reason} onChange={e=>setReason(e.target.value)}/></label>
 <button className="rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50" disabled={!changed||!reason.trim()||save.isPending||check.isPending||submit.isPending} onClick={()=>{setError('');save.mutate()}}>Lưu bản nháp (revision {draft.revision})</button>
 </section><section className="space-y-3 rounded-2xl border bg-card p-5"><h2 className="font-semibold">Kiểm tra trước khi gửi duyệt</h2><button className="rounded-lg border px-4 py-2 disabled:opacity-50" disabled={changed||check.isPending||save.isPending} onClick={()=>{setError('');check.mutate()}}>Kiểm tra bằng Backend</button>
 {receipt?.draftId===draft.draftId&&<div className="text-sm"><p>{receipt.structurallyValid?'Cấu trúc hợp lệ':'Cấu trúc chưa hợp lệ'} · Revision đã kiểm tra: {receipt.revision}</p>{receipt.errors.length>0&&<p className="text-destructive">Lỗi: {receipt.errors.join(', ')}</p>}<p className="text-xs text-muted-foreground">Chặn công bố: {receipt.blockers.join(', ')}</p></div>}</section>
 {canSubmit&&<section className="space-y-3 rounded-2xl border bg-card p-5"><h2 className="font-semibold">Gửi phê duyệt nội dung đã kiểm tra</h2><p className="text-sm text-muted-foreground">Chỉ mở khi backend đã xác nhận đúng revision của nội dung. Phê duyệt thực hiện độc lập ở BE01; không tự kích hoạt phát hành.</p>
 <input className="h-10 w-full rounded-lg border bg-background px-3" placeholder="Tiêu đề yêu cầu duyệt" maxLength={200} value={title} onChange={e=>setTitle(e.target.value)}/><textarea className="w-full rounded-lg border bg-background p-3" placeholder="Mô tả thay đổi" maxLength={10000} value={description} onChange={e=>setDescription(e.target.value)}/><input className="h-10 w-full rounded-lg border bg-background px-3" placeholder="Lý do gửi duyệt" maxLength={500} value={reviewReason} onChange={e=>setReviewReason(e.target.value)}/>
 <button className="rounded-lg border px-4 py-2 disabled:opacity-50" disabled={!valid||!title.trim()||!reviewReason.trim()||submit.isPending} onClick={()=>{setError('');submit.mutate()}}>Gửi duyệt bản nháp</button></section>}
 {error&&<p role="alert" className="rounded-xl border border-destructive p-3 text-sm text-destructive">{error} {error.toLowerCase().includes('revision')?'Tải lại bản nháp trước khi thao tác tiếp.':''}</p>}
 </div>;
}
