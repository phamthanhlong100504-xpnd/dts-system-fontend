"use client";
import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useRouter} from 'next/navigation';
import {Button} from '@/components/ui/button';
import {useAdminAccess} from '../foundation/admin-access-provider';
import {canAdmin} from '../foundation/admin-access';
import {approvedSimulationVersions,createSimulationRelease} from './release-workflow-client';
import styles from "@/features/admin/workbench/components/admin-management-visual.module.css";

/** Release creation is not an inferred publishing action: it only creates a ledger intent. */
export function ReleaseCreationPanel(){
  const router=useRouter();
  const {access,error}=useAdminAccess();
  const authorized=Boolean(access&&!error&&canAdmin(access,'content-releases','create')&&
    canAdmin(access,'simulation-scenarios','publish'));
  const [selected,setSelected]=useState('');
  const [busy,setBusy]=useState(false);
  const [failure,setFailure]=useState('');
  const page=useQuery({
    queryKey:['admin','approved-simulation-release-candidates',access?.actorId],
    queryFn:()=>approvedSimulationVersions(access!),enabled:authorized,
    staleTime:0,retry:false,refetchOnWindowFocus:false
  });
  if(!authorized||!access)return null;
  return <div className={styles.releaseInlineControls}>


    {page.isLoading?<p>Đang kiểm tra các phiên bản được duyệt...</p>:page.isError?<p role="alert" className="text-destructive">Không đọc được phiên bản đã duyệt. Thao tác bị khóa.</p>:
    <div className={styles.releaseInlineActions}>
      <select className={styles.releaseInlineSelect} value={selected}
        onChange={e=>setSelected(e.target.value)} disabled={busy} aria-label="Phiên bản đã duyệt">
        <option value="">Chọn phiên bản đã duyệt</option>
        {page.data?.map(x=><option key={x.versionId} value={x.versionId}>{x.bankVersion} · Lần sửa {x.revision}</option>)}
      </select>
      <Button variant="outline" disabled={busy||!selected} onClick={async()=>{
        const target=page.data?.find(x=>x.versionId===selected);
        if(!target||busy)return;
        setBusy(true);setFailure('');
        try{const id=await createSimulationRelease(access,target);router.push(`/admin/content-releases/${encodeURIComponent(id)}`);}
        catch(e){setFailure(e instanceof Error?e.message:'Chưa xác nhận được đợt phát hành.');}
        finally{setBusy(false);}
      }}>Tạo đợt phát hành</Button>
      <Button variant="outline" disabled={busy||page.isFetching} onClick={()=>void page.refetch()}>Làm mới</Button>
    </div>}
    {failure&&<p role="alert" className="text-sm text-destructive">{failure}</p>}
  </div>;
}
