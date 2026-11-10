'use client';
import {useState} from 'react';
import {useMutation,useQuery,useQueryClient} from '@tanstack/react-query';
import {useRouter} from 'next/navigation';
import {useAdminAccess} from '../foundation/admin-access-provider';
import {AdminPageState} from '../foundation/components/admin-page-state';
import {bankVersions,type BankVersion,type BankQuestionDetail} from './source';
import {cloneOfficial,officialChanges,patchOfficial,reviewStatus,submitReview,validateOfficial,type OfficialValidation} from './write-source';
import {officialFields,initialOfficialFields,changedOfficialFields} from '../content/official-question-editor-fields';

const err=(e:unknown)=>e instanceof Error?e.message:'Backend từ chối thao tác.';
export function BankCloneCard({version}:{version:BankVersion}){
 const router=useRouter();const {can}=useAdminAccess();const [target,setTarget]=useState(''),[error,setError]=useState('');
 const op=useMutation({mutationFn:()=>cloneOfficial(version.bankVersion,target.trim()),onSuccess:r=>router.push(`/admin/questions/banks/${encodeURIComponent(r.targetBankVersion)}`),onError:e=>setError(err(e))});
 if(!can('questions','create')||version.status!=='PUBLISHED')return null;
 return <section className="space-y-3 rounded-2xl border bg-card p-5"><h2 className="font-semibold">Tạo bản nháp ngân hàng từ phiên bản đã công bố</h2><p className="text-sm text-muted-foreground">Sao chép đủ 600 câu theo bản nguồn; không thay đổi ngân hàng đang sử dụng cho học viên.</p><form className="flex flex-wrap items-end gap-3" onSubmit={e=>{e.preventDefault();setError('');op.mutate()}}><label className="flex min-w-64 flex-1 flex-col gap-1 text-sm">Mã phiên bản đích<input className="h-10 rounded-lg border bg-background px-3" value={target} onChange={e=>setTarget(e.target.value)} required minLength={2} maxLength={128} pattern="[A-Za-z0-9][A-Za-z0-9._-]{1,127}" placeholder="vd: dts-2026-600-v2"/></label><button type="submit" disabled={op.isPending} className="h-10 rounded-lg border px-4 disabled:opacity-50">Tạo bản nháp</button></form>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}</section>;
}
export function BankDraftPanel({version}:{version:BankVersion}){
 const {access,can}=useAdminAccess(),actor=access?.actorId??'',qc=useQueryClient(),[receipt,setReceipt]=useState<OfficialValidation|null>(null),[reviewTitle,setTitle]=useState(''),[reviewReason,setReason]=useState(''),[description,setDesc]=useState(''),[error,setError]=useState(''),[message,setMessage]=useState('');
 const id=version.draftId??'',isDraft=version.status==='DRAFT';
 const changes=useQuery({queryKey:['admin03','bank-changes',actor,id,version.revision],queryFn:({signal})=>officialChanges(id,signal),enabled:Boolean(id&&can('questions','read')),retry:false,staleTime:0});
 const review=useQuery({queryKey:['admin03','bank-review',actor,id],queryFn:({signal})=>reviewStatus('OFFICIAL_BANK',id,signal),enabled:Boolean(id&&version.status==='IN_REVIEW'),retry:false,staleTime:0});
 const check=useMutation({mutationFn:()=>validateOfficial(id,version.revision),onSuccess:v=>{setReceipt(v);setMessage(v.structurallyValid?'Đã kiểm tra ngân hàng; chưa thể công bố.':'Ngân hàng có lỗi cấu trúc.');setError('')},onError:e=>setError(err(e))});
 const submit=useMutation({mutationFn:()=>submitReview('OFFICIAL_BANK',id,version.revision,reviewTitle,description,reviewReason),onSuccess:()=>{setReceipt(null);setMessage('Đã gửi duyệt. Nội dung vẫn chưa kích hoạt cho học viên.');setError('');void qc.invalidateQueries({queryKey:['admin03','bank-versions',actor]});void qc.invalidateQueries({queryKey:['admin03','bank-review',actor,id]})},onError:e=>setError(err(e))});
 const validated=receipt?.draftId===id&&receipt.revision===version.revision&&receipt.structurallyValid;
 if(!id)return null;
 return <section className="space-y-4 rounded-2xl border bg-card p-5"><h2 className="text-lg font-semibold">Bản nháp ngân hàng — {version.bankVersion}</h2><p className="text-sm">Trạng thái: <strong>{version.status}</strong> · Revision: <strong>{version.revision}</strong></p><p className="break-all text-xs text-muted-foreground">Draft ID: {id}</p>
 {changes.isPending?<p className="text-sm">Đang tải danh sách thay đổi...</p>:changes.isError?<AdminPageState state="error" error={changes.error} onRetry={()=>void changes.refetch()}/>:<div className="text-sm">Đã chỉnh {changes.data.length} câu. {changes.data.length>0&&<div className="mt-2 max-h-32 overflow-auto">{changes.data.slice(0,20).map(x=><p key={x.sourceQuestionId} className="py-1">Câu {x.sourceQuestionId}: {x.fields.join(', ')} · {x.impact}</p>)}</div>}</div>}
 {isDraft&&can('questions','update')&&<><button className="rounded-lg border px-4 py-2 disabled:opacity-50" disabled={check.isPending||changes.isPending} onClick={()=>{setError('');check.mutate()}}>Validate ngân hàng theo BE03</button>{receipt&&<div className="text-sm"><p>{receipt.structurallyValid?'Cấu trúc hợp lệ':'Cấu trúc chưa hợp lệ'} · {receipt.totalQuestions} câu · {receipt.totalCritical} điểm liệt · {receipt.withMedia} câu có Media</p>{receipt.errors.length>0&&<p className="text-destructive">Lỗi: {receipt.errors.join(', ')}</p>}<p className="text-muted-foreground">Backend chặn công bố: {receipt.blockers.join(', ')}</p></div>}</>}
 {isDraft&&can('questions','submit')&&<div className="space-y-2 border-t pt-4"><p className="text-sm font-semibold">Gửi duyệt độc lập — sau khi validate đúng revision</p><input className="h-10 w-full rounded-lg border bg-background px-3 text-sm" maxLength={200} placeholder="Tiêu đề yêu cầu" value={reviewTitle} onChange={e=>setTitle(e.target.value)}/><textarea className="w-full rounded-lg border bg-background p-3 text-sm" maxLength={10000} placeholder="Mô tả thay đổi" value={description} onChange={e=>setDesc(e.target.value)}/><input className="h-10 w-full rounded-lg border bg-background px-3 text-sm" maxLength={500} placeholder="Lý do gửi duyệt" value={reviewReason} onChange={e=>setReason(e.target.value)}/><button className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50" disabled={!validated||changes.isPending||!changes.data?.length||!reviewTitle.trim()||!reviewReason.trim()||submit.isPending} onClick={()=>{setError('');submit.mutate()}}>Gửi duyệt ngân hàng</button></div>}
 {version.status==='IN_REVIEW'&&<div className="space-y-2 border-t pt-4"><p className="font-semibold">Phê duyệt metadata BE01</p>{review.isPending?<p className="text-sm">Đang tải...</p>:review.isError?<AdminPageState state="error" error={review.error} onRetry={()=>void review.refetch()}/>:<><p className="text-sm">Phiên bản phê duyệt: {review.data.revisionId}</p><p className="text-sm">Trạng thái: {review.data.revisionStatus} · Đã duyệt metadata: {review.data.approvedMetadata?'Có':'Chưa'} · Có thể công bố: Không</p><p className="text-xs text-muted-foreground">Điều kiện chặn: {review.data.blockers.join(', ')}</p></>}</div>}
 {message&&<p role="status" className="text-sm">{message}</p>}{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
 </section>;
}
export function BankQuestionEdit({item}:{item:BankQuestionDetail}){
 return <OfficialQuestionDraftEditor key={`${item.bankVersion}:${item.sourceQuestionId}:${item.bankRevision}`} item={item}/>;
}
/** Kept within the source-version boundary; React remounts when server revision changes. */
function OfficialQuestionDraftEditor({item}:{item:BankQuestionDetail}){
 const {access,can}=useAdminAccess();const actor=access?.actorId??'',qc=useQueryClient();
 const initial=initialOfficialFields(item.payload);
 const [fields,setFields]=useState<Record<string,string>>(initial),[error,setError]=useState(''),[message,setMessage]=useState('');
 const version=useQuery({queryKey:['admin03','bank-versions',actor],queryFn:({signal})=>bankVersions(signal),retry:false,staleTime:0});
 const row=version.data?.find(x=>x.bankVersion===item.bankVersion),draft=row?.draftId??'';
 const dirty=officialFields.some(f=>fields[f.key]!==initial[f.key]);
 const op=useMutation({mutationFn:()=>patchOfficial(draft,item.sourceQuestionId,item.bankRevision,
   changedOfficialFields(item.payload,fields),item.bankVersion),onSuccess:()=>{
   setError('');setMessage('Đã lưu thay đổi vào bản nháp. Revision được lấy lại từ Backend.');
   void qc.invalidateQueries({queryKey:['admin03','bank-question-detail',actor,item.bankVersion,String(item.sourceQuestionId)]});
   void qc.invalidateQueries({queryKey:['admin03','bank-question-list',actor,item.bankVersion]});
   void qc.invalidateQueries({queryKey:['admin03','bank-versions',actor]});
   void qc.invalidateQueries({queryKey:['admin03','bank-changes',actor]});
 },onError:e=>setError(err(e))});
 if(item.status!=='DRAFT'||!draft||row?.status!=='DRAFT'||!can('questions','update'))return null;
 return <section className="space-y-3 rounded-2xl border bg-card p-5">
 <h2 className="font-semibold">Biên tập bản nháp câu nguồn {item.sourceQuestionId}</h2>
 <p className="text-xs text-muted-foreground">Backend xác minh toàn bộ nội dung và ma trận 600 câu. Chỉ gửi trường đã thay đổi; ID gốc, phiên bản đã công bố và kết quả học viên bất biến. Thay đáp án/hạng/Media có thể khiến validate toàn ngân hàng thất bại.</p>
 {officialFields.map(f=><label key={f.key} className="block space-y-1 text-sm">{f.label}
 {f.mode==='paragraph'||f.mode==='json'?<textarea rows={f.mode==='json'?6:3} className={`w-full rounded-lg border bg-background p-3 ${f.mode==='json'?'font-mono text-xs':''}`} maxLength={f.mode==='json'?120000:50000} value={fields[f.key]??''} onChange={e=>setFields(p=>({...p,[f.key]:e.target.value}))}/>:f.mode==='boolean'?<select className="h-10 w-full rounded-lg border bg-background px-3" value={fields[f.key]??'false'} onChange={e=>setFields(p=>({...p,[f.key]:e.target.value}))}><option value="false">Không</option><option value="true">Có</option></select>:<input className="h-10 w-full rounded-lg border bg-background px-3" type={f.mode==='integer'?'number':'text'} min={f.mode==='integer'?1:undefined} max={f.mode==='integer'?6:undefined} maxLength={f.mode==='text'?50000:undefined} value={fields[f.key]??''} onChange={e=>setFields(p=>({...p,[f.key]:e.target.value}))}/>}
 </label>)}
 <button className="rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50" disabled={!dirty||op.isPending} onClick={()=>{setMessage('');setError('');op.mutate()}}>Lưu bản nháp (revision {item.bankRevision})</button>
 {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}{message&&<p role="status" className="text-sm">{message}</p>}
 </section>;
}
