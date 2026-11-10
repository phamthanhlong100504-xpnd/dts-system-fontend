"use client";
import Link from 'next/link';
import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useAdminAccess} from '../foundation/admin-access-provider';
import {AdminPageState} from '../foundation/components/admin-page-state';
import {AdminPageHeader} from '../foundation/components/admin-page-header';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {useLicenseCatalog} from '@/features/license/use-license';
import {getMatrix,listPractice,detailPractice} from './read-api';
import type {MatrixPolicy} from './read-contract';
import {PresetWorkflow} from './preset-workflow';
import styles from '@/features/admin/admin-business-pages.module.css';
type Filter={licenseClass:string;bankVersion:string;status:string;search:string;page:number};
const initial:Filter={licenseClass:'',bankVersion:'',status:'',search:'',page:0};
const format=(value:string|null)=>value?new Date(value).toLocaleString('vi-VN'):'Chưa có';
const labels: Record<string, string> = { DRAFT: 'Bản nháp', REJECTED: 'Đã từ chối', IN_REVIEW: 'Đang xem xét', APPROVED: 'Đã duyệt', PUBLISHED: 'Đã công bố', ARCHIVED: 'Đã lưu trữ' };

function Matrix({ value }: { value: MatrixPolicy }) {
 const metrics = [
  ['Ngân hàng câu hỏi', value.bankVersion],
  ['Số câu', value.totalQuestions],
  ['Thời gian', `${value.durationMinutes} phút`],
  ['Số câu cần đúng', value.requiredCorrect],
  ['Số câu điểm liệt', value.criticalQuestionCount],
 ] as const;
 return <section className={`${styles.panel} space-y-6`}>
  <h2 className={styles.subhead}>Cấu hình thi ngẫu nhiên — Hạng {value.licenseClass}</h2>
  <dl className={styles.matrixGrid}>{metrics.map(([name, val]) => <div key={name} className={styles.metric}><dt>{name}</dt><dd>{val}</dd></div>)}</dl>
  <div>
   <h3 className="mb-4 text-[16px] font-bold">Số câu theo chương</h3>
   <div className={styles.matrixGrid}>{Object.entries(value.chapterQuotas).map(([chapter,n]) => <div className={styles.metric} key={chapter}>Chương {chapter}: <strong>{n} câu</strong></div>)}</div>
  </div>
  {(value.effectiveFrom || value.effectiveUntil) && <p className="text-[14px] text-muted-foreground">Thời gian áp dụng: {value.effectiveFrom ? format(value.effectiveFrom) : 'Không giới hạn'} – {value.effectiveUntil ? format(value.effectiveUntil) : 'Không giới hạn'}</p>}
 </section>;
}

export function PracticeAdmin04List({ initialLicense = '' }: { initialLicense?: string }) {
 const { access, can, loading, error } = useAdminAccess();
 const catalog = useLicenseCatalog();
 const [tab, setTab] = useState<'presets' | 'matrix'>('presets');
 const [draft, setDraft] = useState<Filter>({ ...initial, licenseClass: initialLicense });
 const [filter, setFilter] = useState<Filter>({ ...initial, licenseClass: initialLicense });
 const [matrixLicense, setMatrixLicense] = useState(initialLicense);
 const permitted = Boolean(access && !error && can('practice-exam-sets', 'read'));
 const who = access?.actorId ?? '';
 const list = useQuery({ queryKey: ['admin', 'admin04', 'practice', who, filter], queryFn: ({ signal }) => listPractice(who, filter, signal), enabled: permitted && tab === 'presets', retry: false });
 const matrix = useQuery({ queryKey: ['admin', 'admin04', 'matrix', who, matrixLicense], queryFn: ({ signal }) => getMatrix(who, matrixLicense, signal), enabled: permitted && tab === 'matrix' && Boolean(matrixLicense), retry: false });
 return <div className={styles.page} data-testid="admin-practice-sets-page">
  <AdminPageHeader title="Bộ đề luyện tập" description="Quản lý bộ đề và xem cấu hình thi thử theo hạng GPLX." actions={can('practice-exam-sets', 'create') ? <Button asChild><Link href="/admin/practice-exam-sets/create">Tạo bộ đề</Link></Button> : undefined}/>
  <div className={styles.tabs} role="group" aria-label="Nội dung bộ đề">
   <Button className={styles.tabButton} variant={tab === 'presets' ? 'default' : 'outline'} onClick={() => setTab('presets')}>Bộ đề cố định</Button>
   <Button className={styles.tabButton} variant={tab === 'matrix' ? 'default' : 'outline'} onClick={() => setTab('matrix')}>Cấu hình thi ngẫu nhiên</Button>
  </div>
  {loading ? <AdminPageState state="loading"/> : !permitted ? <AdminPageState state="forbidden" title="Bạn chưa được cấp quyền xem bộ đề luyện tập"/> : tab === 'matrix' ? <>
   <section className={styles.panel}>
    <label className="flex max-w-sm flex-col gap-2 font-semibold">Hạng GPLX
     <select className="rounded-xl border bg-background px-3" value={matrixLicense} onChange={e => setMatrixLicense(e.target.value)}><option value="">Chọn hạng</option>{catalog.data?.map(l => <option value={l.code} key={l.code}>{l.code} — {l.title}</option>)}</select>
    </label>
   </section>
   {!matrixLicense ? <AdminPageState state="empty" title="Chọn hạng GPLX để xem cấu hình" /> : matrix.isPending ? <AdminPageState state="loading" /> : matrix.isError ? <AdminPageState state="error" error={matrix.error} onRetry={() => void matrix.refetch()} /> : matrix.data ? <Matrix value={matrix.data} /> : null}
  </> : <>
   <form className={`${styles.panel} ${styles.practiceFilterBar}`} onSubmit={e => { e.preventDefault(); setFilter({ ...draft, page: 0 }); }}>
    <div className={styles.formGridFour}>
     <label className="flex flex-col gap-2 font-semibold">Hạng GPLX
      <select className="rounded-xl border bg-background px-3" value={draft.licenseClass} onChange={e => setDraft(x => ({ ...x, licenseClass: e.target.value }))}><option value="">Tất cả hạng</option>{catalog.data?.map(l => <option key={l.code} value={l.code}>{l.code} — {l.title}</option>)}</select>
     </label>
     <label className="flex flex-col gap-2 font-semibold">Phiên bản câu hỏi
      <Input value={draft.bankVersion} onChange={e => setDraft(x => ({ ...x, bankVersion: e.target.value }))} placeholder="Tất cả phiên bản" />
     </label>
     <label className="flex flex-col gap-2 font-semibold">Trạng thái
      <select className="rounded-xl border bg-background px-3" value={draft.status} onChange={e => setDraft(x => ({ ...x, status: e.target.value }))}>{['', 'DRAFT', 'REJECTED', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED'].map(s => <option key={s} value={s}>{s ? labels[s] : 'Tất cả trạng thái'}</option>)}</select>
     </label>
     <label className="flex flex-col gap-2 font-semibold">Tìm bộ đề
      <Input value={draft.search} onChange={e => setDraft(x => ({ ...x, search: e.target.value }))} placeholder="Tên hoặc mã bộ đề" />
     </label>
    </div>
    <div className={styles.practiceFilterAction}><Button type="submit" disabled={list.isFetching}>Tìm kiếm</Button></div>
   </form>
   <section className={styles.tableCard}>
    <div className={styles.tableWrap}>
     <table className={styles.table}><thead><tr>{['Bộ đề', 'Hạng', 'Phiên bản câu hỏi', 'Số câu / Thời gian', 'Phiên bản', 'Trạng thái', 'Cập nhật', 'Thao tác'].map(x => <th key={x}>{x}</th>)}</tr></thead>
      <tbody>{list.data?.items.map(x => <tr key={x.id}>
       <td><p className={styles.tableTitle}>{x.title}</p><p className={styles.tableSecondary}>{x.code}</p></td>
       <td>{x.licenseClass}</td><td>{x.bankVersion}</td><td>{x.totalQuestions} câu / {x.durationMinutes} phút</td><td>{x.versionNumber}</td>
       <td>{labels[x.status] ?? x.status}</td><td>{format(x.updatedAt)}</td>
       <td><Link className="font-semibold text-primary hover:underline" href={`/admin/practice-exam-sets/${encodeURIComponent(x.id)}`}>Chi tiết</Link></td>
      </tr>)}
      {list.isSuccess && !list.data?.items.length && <tr><td colSpan={8} className={styles.emptyPanel}>Không có bộ đề phù hợp với bộ lọc.</td></tr>}</tbody>
     </table>
    </div>
    {list.data && <div className={styles.toolbarFooter}>
      <span>{list.data.total} bộ đề · Trang {filter.page + 1}</span>
      <div className="flex gap-2"><Button variant="outline" disabled={filter.page === 0 || list.isFetching} onClick={() => setFilter(x => ({ ...x, page: x.page - 1 }))}>Trước</Button><Button variant="outline" disabled={(filter.page + 1) * list.data.limit >= list.data.total || list.isFetching} onClick={() => setFilter(x => ({ ...x, page: x.page + 1 }))}>Sau</Button></div>
    </div>}
   </section>
   {list.isPending ? <AdminPageState state="loading" /> : list.isError ? <AdminPageState state="error" error={list.error} onRetry={() => void list.refetch()} /> : null}
  </>}
 </div>;
}
export function PracticeAdmin04Detail({id}:{id:string}){const {access,can,error,loading}=useAdminAccess(),who=access?.actorId??'',permitted=Boolean(access&&!error&&can('practice-exam-sets','read'));const detail=useQuery({queryKey:['admin','admin04','practice-detail',who,id],queryFn:({signal})=>detailPractice(who,id,signal),enabled:permitted,retry:false});return <div className={`${styles.page} ${styles.practiceDetail}`}><AdminPageHeader title="Chi tiết bộ đề luyện tập" description="Xem thông tin và quản lý nội dung bộ đề." actions={<Button asChild variant="outline"><Link href="/admin/practice-exam-sets">Quay lại danh sách</Link></Button>}/>{loading?<AdminPageState state="loading"/>:!permitted?<AdminPageState state="forbidden"/>:detail.isPending?<AdminPageState state="loading"/>:detail.isError?<AdminPageState state="error" error={detail.error} onRetry={()=>void detail.refetch()}/>:detail.data&&<><section className={`${styles.panel} ${styles.practiceSummary} grid gap-4 sm:grid-cols-2 lg:grid-cols-4`}>{[['Tên',detail.data.metadata.title],['Mã bộ đề',detail.data.metadata.code],['Hạng',detail.data.metadata.licenseClass],['Trạng thái',labels[detail.data.metadata.status] ?? detail.data.metadata.status],['Phiên bản',detail.data.metadata.versionNumber],['Số câu',detail.data.metadata.totalQuestions],['Thời gian',`${detail.data.metadata.durationMinutes} phút`],].map(([label,value])=><div className="min-w-0" key={label}><p className="text-sm text-muted-foreground">{label}</p><p className="break-all font-medium">{value}</p></div>)}</section><PresetWorkflow value={detail.data}/></>}</div>}
