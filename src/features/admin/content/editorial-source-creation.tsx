'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {useMutation} from '@tanstack/react-query';
import {contentBuilderApi} from '@/lib/api';
import {useAuthStore} from '@/stores/auth-store';
import {useAdminAccess} from '../foundation/admin-access-provider';
import {editorial,uuid,type EditorialKind} from '../admin03/source';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';

type Option={content:string;isCorrect:boolean};
const categories=['cam','nguy_hiem','hieu_lenh','chi_dan','phu'];
const licenseList=['A1','A','B1','B','C1','C','D1','D2','D','BE','C1E','CE','D1E','D2E','DE'];
const version=/^[A-Za-z0-9][A-Za-z0-9._-]{1,63}$/;
const programCode=/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;
function parseCreated(value:unknown,kind:EditorialKind){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Backend trả nguồn tạo mới không hợp lệ.');
 const r=value as Record<string,unknown>;
 if(!uuid(r.draftId)||r.kind!==kind||r.state!=='DRAFT')throw Error('Nguồn tạo mới không đúng trạng thái DRAFT.');
 return r.draftId;
}
export function EditorialSourceCreation({kind,baseHref}:{kind:EditorialKind;baseHref:string}){
 const {access,can}=useAdminAccess(),router=useRouter();
 const [title,setTitle]=useState(''),[code,setCode]=useState(''),[description,setDescription]=useState(''),[proposedVersion,setProposedVersion]=useState('');
 const [contentType,setType]=useState('SINGLE_CHOICE'),[options,setOptions]=useState<Option[]>([{content:'',isCorrect:true},{content:'',isCorrect:false}]);
 const [bankVersion,setVersion]=useState(''),[sourceNumber,setSourceNumber]=useState(''),[sortOrder,setSort]=useState('');
 const [quickRule,setRule]=useState(''),[explanation,setExplanation]=useState(''),[category,setCategory]=useState('cam');
 const [categoryName,setCategoryName]=useState(''),[meaning,setMeaning]=useState(''),[quickTip,setQuickTip]=useState('');
 const [imageFilename,setImage]=useState(''),[mediaFileId,setMedia]=useState(''),[licenses,setLicenses]=useState('A1,B');
 const [failure,setFailure]=useState('');const resource=editorial[kind].resource;
 const allowed=Boolean(access&&can(resource,'create'));
 const make=useMutation({mutationFn:async()=>{
   const before=useAuthStore.getState();const actor=before.user?.id,token=before.accessToken;
   if(!actor||!token||actor!==access?.actorId)throw Error('Phiên Admin không hợp lệ.');
   if(!/^[A-Za-z0-9][A-Za-z0-9._-]{1,127}$/.test(proposedVersion))throw Error('Phiên bản bản nháp không hợp lệ.');
   const req:Record<string,unknown>={title:title.trim(),proposedVersion};
   if(kind==='LEARNING_PROGRAM'){if(code&&!programCode.test(code))throw Error('Mã chương trình không hợp lệ.');req.code=code.trim();req.description=description.trim();}
   if(kind==='CUSTOM_QUESTION'){
     if(options.length<2||options.length>4||options.filter(o=>o.isCorrect).length!==1||options.some(o=>!o.content.trim()))throw Error('Cần 2–4 đáp án và đúng 1 đáp án đúng.');
     req.contentType=contentType;req.options=options.map(o=>({content:o.content.trim(),isCorrect:o.isCorrect}));req.explanation=explanation.trim();
   }
   if(kind==='MEMORY_TIP'||kind==='TRAFFIC_SIGN'){
     if(!version.test(bankVersion)||!/^\d+$/.test(sourceNumber)||Number(sourceNumber)<1||Number(sourceNumber)>1000000)throw Error('Phiên bản hoặc mã nguồn không hợp lệ.');
     req.bankVersion=bankVersion;req.sourceNumber=Number(sourceNumber);
   }
   if(kind==='MEMORY_TIP'){
     if(!/^\d+$/.test(sortOrder)||Number(sortOrder)<1||!quickRule.trim()||!explanation.trim())throw Error('Thiếu thứ tự, quy tắc hoặc giải thích.');
     req.sortOrder=Number(sortOrder);req.quickRule=quickRule.trim();req.explanation=explanation.trim();
   }
   if(kind==='TRAFFIC_SIGN'){
     if(!code.trim()||!categoryName.trim()||!meaning.trim()||!quickTip.trim()||!imageFilename.trim())throw Error('Cần điền đầy đủ thông tin biển báo.');
     const parsed=licenses.split(',').map(x=>x.trim().toUpperCase()).filter(Boolean);
     if(!parsed.length||new Set(parsed).size!==parsed.length||parsed.some(x=>!licenseList.includes(x)))throw Error('Hạng GPLX không hợp lệ hoặc bị trùng.');
     if(mediaFileId&&!uuid(mediaFileId))throw Error('Media ID không hợp lệ.');
     Object.assign(req,{code:code.trim(),category,categoryName:categoryName.trim(),meaning:meaning.trim(),quickTip:quickTip.trim(),imageFilename:imageFilename.trim(),mediaFileId:mediaFileId||null,applicableLicenses:parsed});
   }
   const response=await contentBuilderApi.post<unknown>(`/v1/admin/editor/${kind}/sources`,req);
   const now=useAuthStore.getState();if(now.user?.id!==actor||now.accessToken!==token)throw Error('Phiên Admin thay đổi trong khi tạo nguồn.');
   return parseCreated(response,kind);
 },onSuccess:id=>router.push(`${baseHref}/draft/${encodeURIComponent(id)}`),onError:e=>setFailure(e instanceof Error?e.message:'Không thể tạo nguồn.')});
 const field=(label:string,value:string,set:(v:string)=>void,max=255)=><label className="block space-y-1 text-sm"><span>{label}</span><Input required value={value} maxLength={max} onChange={e=>set(e.target.value)}/></label>;
 if(!allowed)return <p className="rounded-lg border p-4 text-sm">Cần quyền tạo nội dung {editorial[kind].title}.</p>;
 return <form className="space-y-4 rounded-2xl border bg-card p-5" onSubmit={e=>{e.preventDefault();setFailure('');if(window.confirm('Tạo nguồn mới ở trạng thái DRAFT? Chưa công bố cho học viên.'))make.mutate()}}>
 <h2 className="font-semibold">Tạo đề xuất {editorial[kind].title} mới — bản nháp Admin</h2>
 <p className="text-xs text-muted-foreground">Bản mới chỉ được lưu trong bảng nháp riêng của Admin. Chưa ghi vào nguồn học viên; công bố vẫn bị khóa cho tới khi có quy trình duyệt và phát hành đầy đủ.</p>
 {field(kind==='CUSTOM_QUESTION'?'Nội dung câu hỏi':'Tiêu đề / Tên',title,setTitle)}{field('Mã phiên bản đề xuất',proposedVersion,setProposedVersion,128)}
 {(kind==='LEARNING_PROGRAM'||kind==='TRAFFIC_SIGN')&&field(kind==='TRAFFIC_SIGN'?'Mã biển báo':'Mã chương trình',code,setCode,100)}
 {kind==='LEARNING_PROGRAM'&&<label className="block space-y-1 text-sm"><span>Mô tả</span><textarea className="w-full rounded-lg border bg-background p-2" rows={3} maxLength={10000} value={description} onChange={e=>setDescription(e.target.value)}/></label>}
 {kind==='CUSTOM_QUESTION'&&<><label className="block space-y-1 text-sm"><span>Kiểu câu hỏi</span><select className="w-full rounded-lg border bg-background p-2" value={contentType} onChange={e=>{setType(e.target.value);if(e.target.value==='TRUE_FALSE')setOptions(x=>x.slice(0,2))}}><option value="SINGLE_CHOICE">Một đáp án đúng</option><option value="TRUE_FALSE">Đúng / Sai</option></select></label>{options.map((opt,i)=><div className="flex items-center gap-2" key={i}><input aria-label={`Đúng cho đáp án ${i+1}`} type="radio" name="correct" checked={opt.isCorrect} onChange={()=>setOptions(a=>a.map((o,j)=>({...o,isCorrect:i===j})))}/><Input aria-label={`Đáp án ${i+1}`} required maxLength={10000} value={opt.content} onChange={e=>setOptions(a=>a.map((o,j)=>i===j?{...o,content:e.target.value}:o))}/></div>)}{contentType==='SINGLE_CHOICE'&&<div className="flex gap-2"><Button type="button" variant="outline" disabled={options.length>=4} onClick={()=>setOptions(x=>[...x,{content:'',isCorrect:false}])}>Thêm đáp án</Button><Button type="button" variant="outline" disabled={options.length<=2} onClick={()=>setOptions(x=>x.slice(0,-1).map((o,i,a)=>({...o,isCorrect:a.some(z=>z.isCorrect)?o.isCorrect:i===0})))}>Bỏ đáp án cuối</Button></div>}</>}
 {(kind==='TRAFFIC_SIGN'||kind==='MEMORY_TIP')&&<>{field('Phiên bản nội dung',bankVersion,setVersion,64)}{field('Mã nguồn (số)',sourceNumber,setSourceNumber,7)}</>}
 {kind==='MEMORY_TIP'&&<>{field('Thứ tự',sortOrder,setSort,7)}{field('Quy tắc nhớ',quickRule,setRule,10000)}</>}
 {kind==='TRAFFIC_SIGN'&&<><label className="block space-y-1 text-sm">Nhóm biển báo<select className="w-full rounded-lg border bg-background p-2" value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(x=><option key={x} value={x}>{x}</option>)}</select></label>{field('Tên nhóm',categoryName,setCategoryName,100)}{field('Ý nghĩa',meaning,setMeaning,10000)}{field('Mẹo nhanh',quickTip,setQuickTip,10000)}{field('Tên tệp ảnh nguồn',imageFilename,setImage,255)}<label className="block space-y-1 text-sm">Media UUID (có thể bổ sung sau khi xác minh)<Input value={mediaFileId} onChange={e=>setMedia(e.target.value)}/></label>{field('Hạng GPLX, phân cách dấu phẩy',licenses,setLicenses,120)}</>}
 {(kind==='MEMORY_TIP'||kind==='CUSTOM_QUESTION')&&<label className="block space-y-1 text-sm">Giải thích<textarea className="w-full rounded-lg border bg-background p-2" rows={3} maxLength={10000} value={explanation} onChange={e=>setExplanation(e.target.value)}/></label>}
 <Button type="submit" disabled={make.isPending}>{make.isPending?'Đang tạo...':'Tạo bản nháp Admin'}</Button>
 {failure&&<p role="alert" className="text-sm text-destructive">{failure}</p>}
 </form>;
}
