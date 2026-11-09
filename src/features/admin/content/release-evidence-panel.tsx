"use client";

import { useQuery } from '@tanstack/react-query';
import { contentBuilderApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { useAdminAccess } from '../foundation/admin-access-provider';
import styles from '@/features/admin/workbench/components/admin-management-visual.module.css';

const steps = [
  {path: 'manifest-evidence', label: 'Kiểm tra nội dung nguồn'},
  {path: 'review-evidence', label: 'Nội dung cần thẩm định'},
  {path: 'content-review', label: 'Phê duyệt độc lập'},
  {path: 'approval-reconciliation', label: 'Đối soát điều kiện phát hành'},
  {path: 'media-verification', label: 'Kiểm tra tài nguyên'},
  {path: 'sync-status', label: 'Chuẩn bị ở nơi tiếp nhận'},
] as const;
const statusLabel=(value:string)=>({READY:'Sẵn sàng',ACTIVE:'Đã kích hoạt',PREPARED:'Đã chuẩn bị',APPROVED:'Đã duyệt',FAILED:'Cần xử lý',PENDING:'Đang chờ',RECEIVED:'Đã tiếp nhận'} as Record<string,string>)[value]??'Đã ghi nhận';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Read-only diagnostics. PREPARED is NOT ACTIVE and never a learner publication receipt. */
export function ReleaseEvidencePanel({releaseId}:{releaseId:string}) {
  const {access,error} = useAdminAccess();
  const actor=access?.actorId;
  const allowed=Boolean(actor && !error && uuid.test(releaseId));
  const query=useQuery({
    queryKey:['admin','content','release-evidence',actor,releaseId],
    enabled:allowed,retry:false,staleTime:0,
    queryFn:async({signal})=>{
      const check=()=>{
        const auth=useAuthStore.getState();
        if(!actor || auth.user?.id!==actor || !auth.accessToken)throw new Error('Phiên quản trị đã thay đổi.');
      };
      check();
      const entries=await Promise.all(steps.map(async step=>{
        try {
          const v=await contentBuilderApi.get<unknown>(`/v1/admin/releases/${encodeURIComponent(releaseId)}/${step.path}`,{signal});
          check();
          if(!v || typeof v!=='object'||Array.isArray(v))throw new Error('Thiếu bằng chứng hợp lệ.');
          const data=v as Record<string,unknown>;
          if(data.releaseId!==releaseId)throw new Error('Mã release không khớp.');
          const status=typeof data.releaseStatus==='string'?data.releaseStatus:
            typeof data.consumerStatus==='string'?data.consumerStatus:
            typeof data.decision==='string'?data.decision:'Đã nhận phản hồi';
          return {label:step.label,ok:true,status,reason:null};
        } catch {
          check();
          return {label:step.label,ok:false,status:'Chưa có hoặc chưa truy cập được',reason:'Cần kiểm tra lại trước khi phát hành.'};
        }
      }));
      check();return entries;
    },
  });
  if(!allowed)return null;
  return <section className={styles.releaseCard}>
    <h3 className="font-semibold">Kiểm tra điều kiện phát hành</h3>
    
    {query.isPending?<p role="status" className="text-sm">Đang kiểm tra bằng chứng…</p>:
      query.isError?<p role="alert" className="text-sm text-destructive">Chưa kiểm tra được bằng chứng. Không thực hiện kích hoạt.</p>:
      <div className="grid gap-2 sm:grid-cols-2">{query.data.map(item=><div key={item.label} className="rounded-lg border p-3 text-sm">
        <p className="font-medium">{item.label}</p><p>{statusLabel(item.status)}</p>
        {item.reason&&<p className="text-xs text-muted-foreground">{item.reason}</p>}
      </div>)}</div>}
  </section>;
}
