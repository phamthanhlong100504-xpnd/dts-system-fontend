"use client";
import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import styles from '@/features/admin/workbench/components/admin-management-visual.module.css';
import {useAdminAccess} from '../foundation/admin-access-provider';
import {canAdmin} from '../foundation/admin-access';
import {readSimulationReleaseWorkflow,runSimulationReleaseStep,type ReleaseStep} from './release-workflow-client';

const labels:Record<ReleaseStep,string>={
  capture:'Chốt nội dung',approve:'Phê duyệt nội dung',reject:'Từ chối nội dung',
  'verify-media':'Kiểm tra tài nguyên','prepare':'Chuẩn bị sử dụng',activate:'Kích hoạt ngân hàng mô phỏng'
};
/** Every operation is an explicit Admin click; all authorization and publication gates stay on Backend. */
export function ReleaseWorkflowPanel({releaseId}:{releaseId:string}){
  const {access,error}=useAdminAccess();
  const [busy,setBusy]=useState<ReleaseStep|null>(null);
  const [reason,setReason]=useState('');
  const [reviewed,setReviewed]=useState(false);
  const [suffix,setSuffix]=useState('');
  const [message,setMessage]=useState('');
  const [failure,setFailure]=useState('');
  const query=useQuery({
    queryKey:['admin','release-workflow',access?.actorId,releaseId],
    queryFn:()=>readSimulationReleaseWorkflow(access!,releaseId),
    enabled:Boolean(access&&!error&&canAdmin(access,'content-releases','read')),
    retry:false,staleTime:0,refetchOnWindowFocus:false,
  });
  if(!access||error||!canAdmin(access,'content-releases','read'))return null;
  const workflow=query.data;
  const simulation=workflow?.releaseType==='SIMULATION_BANK';
  const allowed=(step:ReleaseStep):boolean=>{
    if(!workflow||!simulation||busy)return false;
    if(step==='capture')return canAdmin(access,'content-releases','update')&&canAdmin(access,'simulation-scenarios','publish')&&
      ['CREATED','FAILED'].includes(workflow.status)&&Boolean(workflow.candidateHash)&&!workflow.snapshotHash;
    if(step==='approve'||step==='reject')return canAdmin(access,'content-releases','approve')&&
      canAdmin(access,'simulation-scenarios','approve')&&Boolean(workflow.snapshotHash)&&!workflow.contentApproved&&
      ['CREATED','FAILED'].includes(workflow.status);
    if(step==='verify-media')return canAdmin(access,'content-releases','update')&&
      canAdmin(access,'simulation-scenarios','publish')&&workflow.contentApproved&&!workflow.mediaVerified;
    if(step==='prepare')return canAdmin(access,'content-releases','update')&&
      canAdmin(access,'simulation-scenarios','publish')&&workflow.contentApproved&&workflow.mediaVerified&&
      workflow.consumerStatus!=='PREPARED';
    return canAdmin(access,'content-releases','publish')&&canAdmin(access,'simulation-scenarios','publish')&&
      canAdmin(access,'simulation-exam-sets','publish')&&workflow.status==='READY'&&workflow.canPublish&&
      workflow.snapshotHash===workflow.consumerHash;
  };
  const handle=async(step:ReleaseStep)=>{
    if(!allowed(step)||!access)return;
    setBusy(step);setFailure('');setMessage('');
    try{
      const result=await runSimulationReleaseStep(access,releaseId,step,
        {note:reason,reviewed,confirmSuffix:suffix.trim()});
      setMessage(result);setSuffix('');
      await query.refetch();
    }catch(e){setFailure(e instanceof Error?e.message:'Chưa xác nhận được kết quả thao tác; đọc lại trạng thái trước khi gửi tiếp.');
      await query.refetch().catch(()=>undefined);
    }finally{setBusy(null);}
  };
  return <section className={styles.releaseCard} aria-label="Quy trình phát hành">
    <h3 className="font-semibold">Quy trình phát hành</h3>
    
    {query.isLoading?<p role="status">Đang kiểm tra điều kiện...</p>:query.isError?<p role="alert" className="text-destructive">Không đọc được bằng chứng phát hành. Mọi thao tác bị khóa.</p>:
    workflow&&!simulation?<p role="status">Nội dung này hiện chưa đủ điều kiện để kích hoạt.</p>:
    workflow?<>
      <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <p>Trạng thái phát hành: <strong>{workflow.status==='ACTIVE'?'Đã áp dụng':workflow.status==='READY'?'Sẵn sàng':workflow.status==='FAILED'?'Cần xử lý':'Đang chuẩn bị'}</strong></p>
        <p>Đã duyệt nội dung: <strong>{workflow.contentApproved?'Có':'Chưa'}</strong></p>
        <p>Tài nguyên đã kiểm tra: <strong>{workflow.mediaCount??'—'}/{workflow.mediaExpected??'—'}</strong></p>
        <p>Chuẩn bị sử dụng: <strong>{workflow.consumerStatus==='PREPARED'?'Hoàn tất':'Chưa xác nhận'}</strong></p>
        <p>Đã kích hoạt: <strong>{workflow.status==='ACTIVE'?'Có':'Chưa'}</strong></p>
      </div>
      {workflow.blockers.length>0&&<div className="text-xs text-muted-foreground"><strong>Điều kiện còn thiếu:</strong> Vui lòng hoàn tất các bước kiểm tra đang còn thiếu.</div>}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {(['capture','verify-media','prepare'] as ReleaseStep[]).map(step=><Button key={step} type="button" variant="outline"
          disabled={!allowed(step)} onClick={()=>void handle(step)}>{busy===step?'Đang kiểm tra...':labels[step]}</Button>)}
      </div>
      <div className="space-y-2 rounded-lg border p-3">
        <p className="text-sm font-medium">Duyệt nội dung độc lập</p>
        
        <textarea className="min-h-20 w-full rounded-md border bg-background p-2 text-sm" value={reason}
          onChange={e=>setReason(e.target.value)} placeholder="Ghi nhận xét kiểm tra video và các mốc chấm điểm (20–1.000 ký tự)"
          maxLength={1000} disabled={Boolean(busy)}/>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={reviewed}
          onChange={e=>setReviewed(e.target.checked)} disabled={Boolean(busy)}/>
          Tôi đã trực tiếp thẩm định nội dung video và các mốc chấm điểm.</label>
        <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" disabled={!allowed('approve')||!reviewed||reason.trim().length<20}
          onClick={()=>void handle('approve')}>{labels.approve}</Button>
          <Button type="button" variant="outline" disabled={!allowed('reject')||reason.trim().length<20}
          onClick={()=>void handle('reject')}>{labels.reject}</Button></div>
      </div>
      <div className="space-y-2 rounded-lg border p-3">
        <p className="text-sm font-medium">Kích hoạt có xác nhận</p>
        
        <Input value={suffix} onChange={e=>setSuffix(e.target.value)} placeholder={`Nhập 8 ký tự cuối: ${releaseId.slice(-8)}`}
          maxLength={8} disabled={Boolean(busy)}/>
        <Button type="button" variant="outline" disabled={!allowed('activate')||suffix.trim()!==releaseId.slice(-8)}
          onClick={()=>void handle('activate')}>{labels.activate}</Button>
      </div>
      {message&&<p role="status" className="text-sm">{message}</p>}
      {failure&&<p role="alert" className="text-sm text-destructive">{failure}</p>}
      <Button variant="outline" type="button" disabled={Boolean(busy)||query.isFetching}
        onClick={()=>void query.refetch()}>Cập nhật trạng thái</Button>
    </>:null}
  </section>;
}
