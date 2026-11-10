"use client";
import {useState} from 'react';
import {useMutation,useQueryClient} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import {useAdminAccess} from '../foundation/admin-access-provider';
import {publishManualOfficialResult} from './manual-result-release';
import type {OfficialRelease} from '../admin04/read-contract';
/** No automatic invocation, no learner API, no inferred permissions. */
export function ManualOfficialResultRelease({sessionId,release}:{sessionId:string;release:OfficialRelease}){
 const {access,can}=useAdminAccess();const qc=useQueryClient();const [message,setMessage]=useState('');
 const actor=access?.actorId??'';
 const grant=can('official-exams','release-result');
 const eligible=release.canRelease&&release.resultReleaseMode==='MANUAL'&&grant;
 const mutation=useMutation({mutationFn:()=>publishManualOfficialResult(actor,sessionId,release),onSuccess:({confirmed})=>{
    setMessage(confirmed?'Kết quả đã được công bố.':'Yêu cầu công bố chưa hoàn tất. Vui lòng kiểm tra lại trạng thái phiên thi.');
    void qc.invalidateQueries({queryKey:['admin','admin04','release-status',actor,sessionId]});
    void qc.invalidateQueries({queryKey:['admin','admin04','official-session',actor,sessionId]});
  },onError:e=>setMessage(e instanceof Error?e.message:'Không thể công bố kết quả.')});
 if(!grant)return <p className="text-xs text-muted-foreground">Tài khoản hiện không có quyền công bố kết quả.</p>;
 return <div className="space-y-2 border-t pt-4">
  <Button type="button" disabled={!eligible||mutation.isPending} onClick={()=>{
    if(!eligible)return;
    const confirmation=window.prompt('Thao tác này công bố kết quả thi của phiên được chọn. Nhập CONG BO để xác nhận:');
    if(confirmation!=='CONG BO')return;
    setMessage('');mutation.mutate();
  }}>{mutation.isPending?'Đang công bố...':'Công bố kết quả thủ công'}</Button>
  {!release.canRelease&&<p className="text-xs text-muted-foreground">Phiên thi chưa đủ điều kiện để công bố kết quả.</p>}
  {message&&<p role="status" className="text-sm">{message}</p>}
 </div>;
}
