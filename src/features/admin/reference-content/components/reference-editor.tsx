"use client";
import { useEffect, useId, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLicenseCatalog } from "@/features/license/use-license";
import { useAdminMutation } from "../../foundation/use-admin-mutation";
import { useAdminUnsavedChanges } from "../../foundation/use-admin-unsaved-changes";
import { AdminLeaveDialog } from "../../foundation/components/admin-leave-dialog";
import { adminFailure } from "../../foundation/admin-errors";
import { AdminMediaPicker } from "../../media/components/admin-media-picker";
import { createReferenceDraft } from "../reference-service";
import { SIGN_CATEGORIES, validateReferenceDraft, type DraftFields, type ReferenceKind, type ReferenceRecord } from "../reference-contract";
import { ReferencePreview } from "./reference-preview";

export function ReferenceEditor({ kind, bankVersion, onClose, registerClose }: { kind: ReferenceKind; bankVersion: string; onClose: () => void; registerClose: (handler: () => void) => void }) {
  const uid = useId(); const catalog = useLicenseCatalog();
  const [fields, setFields] = useState<DraftFields>({ sourceId: "", bankVersion, code: "", name: "", category: "", categoryName: "", meaning: "", quickTip: "", sourceImage: "", mediaFileId: "", applicableLicenses: [], sortOrder: "", title: "", quickRule: "", explanation: "" });
  const [saved, setSaved] = useState<ReferenceRecord | null>(null); const [uncertain, setUncertain] = useState(false); const [message, setMessage] = useState<string | null>(null);
  const [initial] = useState(JSON.stringify(fields)); const [baseline, setBaseline] = useState(initial);
  const mutation = useAdminMutation(kind, "create", { mutationFn: (data: DraftFields) => createReferenceDraft(kind, data) });
  const leave = useAdminUnsavedChanges(JSON.stringify(fields) !== baseline, mutation.isPending);
  useEffect(() => { registerClose(() => leave.requestLeave(onClose)); }, [registerClose, leave, onClose]);
  const set = (key: keyof DraftFields, value: string) => setFields(old => ({ ...old, [key]: value }));
  function field(key: keyof DraftFields, label: string, large = false, maxLength?: number) { return <label className="flex flex-col gap-2 text-[15px] font-medium" htmlFor={`${uid}-${key}`}>{label}{large ? <Textarea id={`${uid}-${key}`} rows={4} maxLength={maxLength} value={fields[key] as string} onChange={e => set(key, e.target.value)} /> : <Input id={`${uid}-${key}`} maxLength={maxLength} value={fields[key] as string} onChange={e => set(key, e.target.value)} />}</label>; }
  async function save() {
    setMessage(null); const invalid = validateReferenceDraft(fields, kind); if (invalid) { setMessage(invalid); return; }
    if (kind === "traffic-signs" && (!catalog.isSuccess || fields.applicableLicenses.some(code => !catalog.data.some(x => x.code === code)))) { setMessage("Chưa xác minh được hạng GPLX đã chọn."); return; }
    try { const result = await mutation.mutateAsync(fields); setSaved(result); setBaseline(JSON.stringify(fields)); }
    catch (error) { const failure = adminFailure(error, "Không thể xác nhận lưu bản nháp. Nội dung đang nhập được giữ nguyên."); setMessage(failure.message); const status = error && typeof error === "object" && "status" in error ? error.status : undefined; if (status === undefined || (typeof status === "number" && status >= 500)) setUncertain(true); }
  }
  return <div className="space-y-5"><AdminLeaveDialog open={leave.leaveOpen} onCancel={leave.cancelLeave} onLeave={leave.confirmLeave} /><p className="rounded-xl border bg-muted/20 p-4 text-[14px]/6 text-muted-foreground">Bạn có thể tạo bản nháp mới. Chức năng mở lại, chỉnh sửa và công bố bản nháp hiện chưa khả dụng.</p>
    <fieldset disabled={mutation.isPending || Boolean(saved) || uncertain} className="space-y-4"><div className="grid items-end gap-4 sm:grid-cols-2">{field("sourceId", "Mã đối chiếu *")}{field("bankVersion", "Phiên bản dữ liệu *", false, 64)}{kind === "memory-tips" ? <>{field("sortOrder", "Thứ tự hiển thị *")}{field("title", "Tiêu đề *", false, 255)}</> : <>{field("code", "Mã biển báo *", false, 32)}{field("name", "Tên biển báo *", false, 255)}<label className="flex flex-col gap-2 text-[15px] font-medium">Nhóm biển *<select className="h-10 rounded-lg border bg-background px-3" value={fields.category} onChange={e => { const c = SIGN_CATEGORIES.find(c => c.value === e.target.value); setFields(old => ({ ...old, category: e.target.value, categoryName: c?.label ?? "" })); }}><option value="">Chọn nhóm</option>{SIGN_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></label>{field("categoryName", "Tên nhóm *", false, 100)}</>}</div>
      {kind === "memory-tips" ? <>{field("quickRule", "Quy tắc ghi nhớ *", true)}{field("explanation", "Giải thích *", true)}</> : <>{field("meaning", "Ý nghĩa *", true)}{field("quickTip", "Mẹo nhận biết *", true)}{field("sourceImage", "Thông tin ảnh gốc *", false, 255)}<div className="space-y-3"><h4 className="text-[16px] font-semibold">Ảnh minh họa</h4><AdminMediaPicker target="TRAFFIC_SIGN" editableDraft disabled={mutation.isPending || Boolean(saved) || uncertain} onSelect={id => set("mediaFileId", id)} />{fields.mediaFileId && <div className="flex flex-wrap items-center gap-3"><span className="break-all font-mono text-[14px]">{fields.mediaFileId}</span><Button type="button" size="sm" variant="outline" onClick={() => set("mediaFileId", "")}>Bỏ lựa chọn</Button></div>}</div><div className="space-y-3"><h4 className="text-[16px] font-semibold">Hạng GPLX áp dụng *</h4>{catalog.isError ? <p role="alert" className="text-[14px]/6 text-destructive">Không tải được danh mục hạng. Tải lại trang trước khi lưu biển báo.</p> : <div className="flex flex-wrap gap-4">{catalog.data?.map(x => <label key={x.code} className="flex items-center gap-2 text-[14px]"><input type="checkbox" checked={fields.applicableLicenses.includes(x.code)} onChange={e => setFields(old => ({ ...old, applicableLicenses: e.target.checked ? [...old.applicableLicenses, x.code] : old.applicableLicenses.filter(code => code !== x.code) }))} />{x.code}</label>)}</div>}</div></>}
    </fieldset>{message && <p role="alert" className="text-[15px]/6 text-destructive">{message}</p>}{uncertain && <p role="alert" className="rounded-xl border p-4 text-[14px]/6">Chưa rõ hệ thống đã tạo nháp hay chưa. Không tự gửi lại lệnh tạo, cần kiểm tra bản nháp với người vận hành trước khi thử lại.</p>}
    {saved && <div className="space-y-3"><p role="status" className="text-[15px]/6 font-semibold text-emerald-700">Đã lưu bản nháp. Nội dung chưa hiển thị cho học viên.</p><ReferencePreview item={saved} /><p className="text-[14px]/6 text-muted-foreground">Hãy lưu mã nội dung để đối chiếu, bạn chưa thể mở lại bản nháp sau khi đóng cửa sổ.</p></div>}
    <div className="dts-admin-actions"><Button type="button" variant="outline" disabled={mutation.isPending} onClick={() => leave.requestLeave(onClose)}>Đóng</Button><Button type="button" disabled={mutation.isPending || Boolean(saved) || uncertain} onClick={() => void save()}><Save className="size-4" />{mutation.isPending ? "Đang lưu..." : "Lưu bản nháp"}</Button></div></div>;
}
