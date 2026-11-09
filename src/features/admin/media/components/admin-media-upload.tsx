"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileUp, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/stores/auth-store";
import { ApiError } from "@/lib/api";
import { MEDIA_UPLOAD_POLICIES, validateMediaFile, type MediaUploadTarget } from "@/features/media/media-upload-policy";
import { transferMediaFile, type MediaUploadReceipt, type MediaUploadPhase } from "@/features/media/media-service";
import { useAdminAccess } from "../../foundation/admin-access-provider";
import { restrictAdminAccess } from "../../foundation/admin-access";
import { adminFailure } from "../../foundation/admin-errors";
import { AdminPageState } from "../../foundation/components/admin-page-state";
import { canChooseAdminMedia, canUploadExistingAttachment } from "../admin-media-policy";
import { assertMediaActor, checkUploadedMedia } from "../admin-media-service";
import { formatMediaBytes, type AdminMediaItem, type AdminMediaPage } from "../admin-media-contract";
import { adminMediaKeys } from "../use-admin-media";
import { useAdminMediaSelection } from "../use-admin-media-selection";

const phaseLabels: Record<MediaUploadPhase, string> = { initializing: "Đang chuẩn bị tải lên", transferring: "Đang tải tệp", confirming: "Đang xác nhận tải lên" };

export function AdminMediaUpload({ target: fixedTarget, editableDraft = false, onChoose, onBusyChange }: {
  target?: MediaUploadTarget; editableDraft?: boolean; onChoose?: (item: AdminMediaItem) => void; onBusyChange?: (busy: boolean) => void;
}) {
  const { access, error: accessError } = useAdminAccess();
  const effectiveAccess = accessError ? null : access;
  const latest = useRef(effectiveAccess);
  useEffect(() => { latest.current = effectiveAccess; }, [effectiveAccess]);
  const client = useQueryClient();
  const inputId = useId();
  const [target, setTarget] = useState<MediaUploadTarget>(fixedTarget ?? (canUploadExistingAttachment(effectiveAccess, "QUESTION") ? "QUESTION" : canUploadExistingAttachment(effectiveAccess, "EXAM") ? "EXAM" : canUploadExistingAttachment(effectiveAccess, "TRAFFIC_SIGN") ? "TRAFFIC_SIGN" : "SIMULATION_VIDEO"));
  const [file, setFile] = useState<File | null>(null);
  const [fileEpoch, setFileEpoch] = useState(0);
  const [phase, setPhase] = useState<MediaUploadPhase | null>(null);
  const [progress, setProgress] = useState<number | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<(MediaUploadReceipt & { since: number }) | null>(null);
  const [initialized, setInitialized] = useState<Pick<MediaUploadReceipt, "mediaId" | "sessionId"> | null>(null);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const locked = useRef(false);
  const allowed = canUploadExistingAttachment(effectiveAccess, target);
  const policy = MEDIA_UPLOAD_POLICIES[target];
  const actorId = access?.actorId ?? "";
  const selection = useAdminMediaSelection(target, editableDraft, onChoose);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); }; }, []);
  useEffect(() => { if (!allowed) controller.current?.abort(); }, [allowed]);
  const check = useQuery({
    queryKey: ["admin", "media", actorId, "upload-check", receipt?.mediaId],
    queryFn: async ({ signal }) => {
      const existing = client.getQueriesData<AdminMediaPage>({ queryKey: adminMediaKeys.lists(actorId) }).flatMap(([, data]) => data?.content ?? []).find((item) => item.mediaId === receipt!.mediaId && item.status === "FAILED");
      if (existing) return { kind: "known" as const, item: existing };
      return checkUploadedMedia(actorId, receipt!.mediaId, signal);
    },
    enabled: Boolean(receipt && allowed && actorId), staleTime: 0, gcTime: 0, retry: false,
    refetchOnWindowFocus: false,
    refetchInterval: (query) => receipt && Date.now() - receipt.since < 30000 && !query.state.error && (query.state.data?.kind !== "known" || query.state.data.item.status === "UPLOADING") ? 3000 : false,
  });
  const item = check.data?.kind === "known" ? check.data.item : undefined;
  const ready = item?.status === "READY" && item.visibility === policy.visibility && policy.mimeTypes.includes(item.mimeType) && item.sizeBytes <= policy.maxBytes;
  async function start() {
    if (!file || locked.current) return;
    const invalid = validateMediaFile(file, target);
    if (invalid) { setError(invalid); return; }
    const currentActor = actorId;
    const authorize = () => {
      assertMediaActor(currentActor);
      const current = restrictAdminAccess(latest.current, useAuthStore.getState().user);
      if (!canUploadExistingAttachment(current, target)) throw new ApiError("Bạn không có quyền tải ảnh cho nội dung này.", 403);
    };
    locked.current = true;
    controller.current = new AbortController();
    onBusyChange?.(true); setReceipt(null); setInitialized(null); setError(null); setProgress(undefined); setPhase("initializing");
    try {
      const result = await transferMediaFile(file, { fileName: file.name, sizeBytes: file.size, mimeType: file.type, targetType: target, visibility: policy.visibility }, {
        signal: controller.current.signal, authorize,
        onPhase: (p) => { if (mounted.current) setPhase(p); },
        onProgress: (p) => { if (mounted.current) setProgress(p); },
        onInitialized: (ids) => { if (mounted.current) setInitialized(ids); },
      });
      if (mounted.current) {
        setReceipt({ ...result, since: Date.now() });
        void client.invalidateQueries({ queryKey: adminMediaKeys.lists(currentActor) });
      }
    } catch (reason) {
      if (mounted.current) setError(controller.current.signal.aborted ? "Đã dừng tải tệp. Vui lòng kiểm tra trạng thái trong thư viện." : adminFailure(reason, "Không thể hoàn tất tải lên. Kiểm tra tệp và kết nối trước khi bắt đầu phiên mới.").message);
    } finally {
      locked.current = false;
      if (mounted.current) { setPhase(null); onBusyChange?.(false); }
    }
  }
  return <div className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><label htmlFor={`${inputId}-target`} className="text-[14.5px]/5 font-medium">Loại tài nguyên</label><select id={`${inputId}-target`} value={target} disabled={Boolean(fixedTarget || phase || receipt)} onChange={(e) => { setTarget(e.target.value as MediaUploadTarget); setFile(null); setError(null); }} className="h-10 w-full rounded-lg border bg-background px-3 text-[14.5px]/5">{(Object.keys(MEDIA_UPLOAD_POLICIES) as MediaUploadTarget[]).map((key) => <option key={key} value={key} disabled={!canUploadExistingAttachment(effectiveAccess, key)}>{MEDIA_UPLOAD_POLICIES[key].label}</option>)}</select></div><div className="rounded-xl border bg-muted/20 p-3 text-[12.5px]/5 text-muted-foreground"><p>Giới hạn: <strong className="text-foreground">{formatMediaBytes(policy.maxBytes)}</strong></p><p>Định dạng: {policy.extensions.join(", ").toUpperCase()}</p><p>Quyền truy cập: {policy.visibility === "PRIVATE" ? "Riêng tư" : "Công khai"}</p></div></div>
    <div className="space-y-3 rounded-2xl border border-dashed bg-muted/10 p-5"><label htmlFor={inputId} className="flex items-center gap-2 font-medium"><FileUp className="size-5 text-primary" />Chọn tệp từ máy</label><Input key={`${target}-${fileEpoch}`} id={inputId} type="file" accept={policy.mimeTypes.join(",")} disabled={!allowed || Boolean(phase || receipt)} onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(null); }} />{file && <div className="text-[12.5px]/5 text-muted-foreground"><p className="break-all font-medium text-foreground">{file.name}</p><p>{formatMediaBytes(file.size)} · {file.type || "Chưa xác định định dạng"}</p></div>}</div>
    {!allowed && <p role="status" className="text-[14.5px]/5 text-muted-foreground">Bạn chưa có quyền tải tài nguyên cho nội dung này.</p>}
    {!fixedTarget && <p className="text-[12.5px]/5 text-muted-foreground">Chỉ tải các loại Media được quyền cho phép. Video mô phỏng phải là MP4; thumbnail mô phỏng phải là WebP.</p>}
    {phase && <div role="status" className="space-y-2"><p className="flex items-center gap-2 text-[14.5px]/5"><Loader2 className="size-4 animate-spin" />{phaseLabels[phase]}{phase === "transferring" && progress !== undefined ? ` · ${progress}%` : ""}</p>{phase === "transferring" && progress !== undefined && <Progress value={progress} aria-label="Tiến độ tải lên" />}</div>}
    {error && <p role="alert" className="text-[14.5px]/5 text-destructive">{error}</p>}
    {selection.message && <p role="alert" className="text-[14.5px]/5 text-destructive">{selection.message}</p>}
    {initialized && <div className="rounded-xl border bg-muted/10 p-3 text-[12.5px]/5"><p className="text-muted-foreground">Mã tài nguyên đang tải</p><p className="break-all font-mono">{initialized.mediaId}</p></div>}
    {receipt && (!ready || !allowed) && <AdminPageState state={!allowed ? "forbidden" : item?.status === "FAILED" || check.isError || item?.status === "READY" ? "error" : "processing"} title={!allowed ? "Chưa xác minh được quyền thao tác" : item?.status === "READY" ? "Tài nguyên không phù hợp với nội dung này" : item?.status === "FAILED" ? "Tệp xử lý thất bại" : check.isError ? "Chưa kiểm tra được trạng thái tài nguyên" : "Chưa xác nhận tài nguyên sẵn sàng"} error={check.error} description={!allowed ? "Quyền truy cập đã thay đổi. Kiểm tra lại quyền trước khi tiếp tục." : item?.status === "READY" ? "Định dạng hoặc quyền truy cập của tài nguyên không đáp ứng loại đã chọn." : item?.status === "FAILED" ? "Tài nguyên này không thể được chọn. Bạn có thể tải một tệp mới bằng phiên riêng." : check.isError ? adminFailure(check.error).message : receipt.confirmation === "unknown" ? "Chưa xác nhận tải tệp thành công. Chọn Kiểm tra lại trước khi tải tệp khác." : "Tệp đang được kiểm tra. Bạn có thể đóng cửa sổ và theo dõi trạng thái trong thư viện."}><Button type="button" size="sm" variant="outline" disabled={!allowed || check.isFetching} onClick={() => void check.refetch()}><RefreshCw className="size-4" />Kiểm tra lại</Button></AdminPageState>}
    {ready && allowed && item && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-[14.5px]/5 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"><CheckCircle2 className="size-5 shrink-0" />Tài nguyên đã sẵn sàng để sử dụng.</div>}
    <div className="dts-admin-actions">
      {phase ? <Button type="button" variant="outline" onClick={() => controller.current?.abort()}>Dừng tải lên</Button> : receipt ? <><Button type="button" variant="outline" onClick={() => { setReceipt(null); setInitialized(null); setError(null); setFile(null); setFileEpoch((n) => n + 1); }}>Chuẩn bị tệp khác</Button>{onChoose && item && <Button type="button" disabled={!ready || selection.pending || !canChooseAdminMedia(effectiveAccess, item, target, editableDraft)} onClick={() => void selection.choose(item)}>Chọn tài nguyên này</Button>}</> : <Button type="button" disabled={!allowed || !file} onClick={() => void start()}><FileUp className="size-4" />Tải tài nguyên lên</Button>}
    </div>
  </div>;
}
