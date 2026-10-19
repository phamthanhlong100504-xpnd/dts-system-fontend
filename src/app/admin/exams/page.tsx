"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ExamItem } from "@/features/admin/admin-examination-service";
import { useLicenseCatalog } from "@/features/license/use-license";
import { 
  Plus, Loader2, Send, Trash2, BookOpen, Clock, CheckCircle2, Award, Search, Settings2, Pencil, Sparkles, UploadCloud
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAdminExams, useCreateExam, useDeleteExam, useUpdateExam } from "@/features/admin/use-admin-content";
import { uploadFileToMediaService } from "@/features/media/media-service";
import { MediaImage } from "@/components/ui/media-image";

export default function AdminExamsPage() {
  const router = useRouter();
  const { data: apiExams = [], isLoading, isError: examsError } = useAdminExams();
  const licenseCatalog = useLicenseCatalog();
  const licenseOptions = licenseCatalog.data ?? [];
  const createMutation = useCreateExam();
  const updateMutation = useUpdateExam();
  const deleteMutation = useDeleteExam();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLicense, setSelectedLicense] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [isCreating, setIsCreating] = useState(false);

  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newLicenseClass, setNewLicenseClass] = useState("");
  const [newThumbnailId, setNewThumbnailId] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [editingExam, setEditingExam] = useState<ExamItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editThumbnailId, setEditThumbnailId] = useState("");

  const [isUploadingNewThumb, setIsUploadingNewThumb] = useState(false);
  const [isUploadingEditThumb, setIsUploadingEditThumb] = useState(false);
  const newFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const examSets = apiExams;

  const filteredExams = examSets.filter((item) => {
    if (selectedLicense !== "ALL" && item.licenseType !== selectedLicense) return false;
    if (selectedStatus !== "ALL" && item.status !== selectedStatus) return false;
    if (
      searchQuery &&
      !item.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.code.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleUploadNewThumb = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dung lượng file không được vượt quá 5MB");
      return;
    }
    try {
      setIsUploadingNewThumb(true);
      const res = await uploadFileToMediaService(file, "EXAM", "PUBLIC");
      setNewThumbnailId(res.mediaId);
      toast.success("Tải ảnh lên thành công");
    } catch (error) {
      console.error(error);
      toast.error("Tải ảnh thất bại");
    } finally {
      setIsUploadingNewThumb(false);
      if (newFileInputRef.current) newFileInputRef.current.value = "";
    }
  };

  const handleUploadEditThumb = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dung lượng file không được vượt quá 5MB");
      return;
    }
    try {
      setIsUploadingEditThumb(true);
      const res = await uploadFileToMediaService(file, "EXAM", "PUBLIC");
      setEditThumbnailId(res.mediaId);
      toast.success("Tải ảnh lên thành công");
    } catch (error) {
      console.error(error);
      toast.error("Tải ảnh thất bại");
    } finally {
      setIsUploadingEditThumb(false);
      if (editFileInputRef.current) editFileInputRef.current.value = "";
    }
  };

  const handleCreate = () => {
    if (!newName.trim() || !newCode.trim() || !licenseOptions.some((item) => item.code === newLicenseClass)) {
      toast.error("Vui lòng nhập Tên kỳ thi, Mã kỳ thi và Hạng GPLX");
      return;
    }
    createMutation.mutate(
      { 
        title: newName, 
        code: newCode, 
        status: "DRAFT", 
        licenseType: newLicenseClass.trim().toUpperCase(),
        thumbnailId: newThumbnailId
      },
      {
        onSuccess: () => {
          toast.success("Đã tạo bộ đề thi nháp thành công!");
          setIsCreating(false);
          setNewName("");
          setNewCode("");
          setNewLicenseClass("");
          setNewThumbnailId("");
        },
        onError: () => {
          toast.error("Tạo bộ đề thi thất bại.");
        },
      }
    );
  };

  const handlePublish = (id: string) => {
    toast.info("Để công bố kỳ thi, hãy tạo và xuất bản ít nhất một phiên bản đề thi hợp lệ.");
    router.push(`/admin/exams/${id}`);
  };

  const handleOpenEdit = (exam: ExamItem) => {
    setEditingExam(exam);
    setEditName(exam.title);
    setEditCode(exam.code);
    setEditThumbnailId(exam.thumbnailId || "");
  };

  const handleSaveEdit = () => {
    if (!editingExam || !editName.trim() || !editCode.trim()) {
      toast.error("Vui lòng nhập Tên bộ đề và Mã bộ đề");
      return;
    }
    updateMutation.mutate(
      { 
        id: editingExam.id, 
        payload: {
          title: editName,
          code: editCode,
          status: editingExam.status,
          licenseType: editingExam.licenseType === "—" ? undefined : editingExam.licenseType,
          thumbnailId: editThumbnailId
        }
      },
      {
        onSuccess: () => {
          toast.success("Đã cập nhật bộ đề thi thành công!");
          setEditingExam(null);
        },
        onError: () => {
          toast.error("Cập nhật bộ đề thi thất bại.");
        },
      }
    );
  };

  const handleDelete = (id: string, title: string) => {
    if (!window.confirm(`Xóa bộ đề "${title}"?`)) return;
    setDeletingId(id);
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Đã xóa bộ đề thi thành công.");
        setDeletingId(null);
      },
      onError: (err: unknown) => {
        toast.error(err instanceof Error ? err.message : "Xóa bộ đề thi thất bại.");
        setDeletingId(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-card p-6 shadow-sm border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Quản lý Kỳ thi & Bộ đề thi
          </h1>
          <p className="text-[14.5px]/5 text-muted-foreground mt-1">
            Cấu hình ma trận đề thi, quy chế sát hạch và danh sách bộ đề.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/exams/structures/create">
            <Button variant="outline" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Cấu hình Ma trận
            </Button>
          </Link>
          <Button className="gap-2" onClick={() => setIsCreating(!isCreating)}>
            <Plus className="h-4 w-4" />
            {isCreating ? "Đóng form" : "Tạo bộ đề thi mới"}
          </Button>
        </div>
      </div>

      {/* Quick Create Form */}
      {isCreating && (
        <Card className="rounded-2xl border bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Tạo kỳ thi mới
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[12.5px]/4 font-semibold text-muted-foreground">Tên bộ đề *</label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="VD: Đề thi sát hạch B2"
                    className="bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12.5px]/4 font-semibold text-muted-foreground">Hạng GPLX *</label>
                  <select value={newLicenseClass} onChange={(e) => setNewLicenseClass(e.target.value)} disabled={!licenseCatalog.isSuccess} className="h-10 w-full rounded-lg border bg-background px-3 text-[14.5px]/5">
                    <option value="">{licenseCatalog.isLoading ? "Đang tải danh mục GPLX..." : "Chọn hạng GPLX từ danh mục"}</option>
                    {licenseOptions.map((item) => <option key={item.code} value={item.code}>{item.code} — {item.title}</option>)}
                  </select>
                  {licenseCatalog.isError && <p className="text-[12.5px]/4 text-destructive">Không tải được danh mục hạng GPLX. Vui lòng thử lại.</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12.5px]/4 font-semibold text-muted-foreground">Mã đề thi *</label>
                  <Input
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="VD: EX-B-04"
                    className="bg-background"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[12.5px]/4 font-semibold text-muted-foreground flex justify-between">
                  <span>Ảnh bìa (Thumbnail)</span>
                  {newThumbnailId && (
                    <span 
                      className="text-destructive cursor-pointer hover:underline" 
                      onClick={() => setNewThumbnailId("")}
                    >
                      Xóa ảnh
                    </span>
                  )}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={newFileInputRef}
                  onChange={handleUploadNewThumb}
                />
                <div 
                  className={`border-2 border-dashed rounded-xl h-[120px] flex flex-col items-center justify-center gap-2 transition-colors overflow-hidden relative ${isUploadingNewThumb ? "opacity-50 pointer-events-none" : "cursor-pointer hover:border-primary/50"} ${newThumbnailId ? "bg-muted/10 border-solid" : "bg-muted/20"}`}
                  onClick={() => !newThumbnailId && newFileInputRef.current?.click()}
                >
                  {isUploadingNewThumb ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : newThumbnailId ? (
                    <div className="relative w-full h-full group">
                      <MediaImage src={newThumbnailId} alt="Thumbnail" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); newFileInputRef.current?.click(); }}>
                          Đổi ảnh
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="h-6 w-6 text-muted-foreground" />
                      <p className="text-[12.5px]/4 font-medium text-muted-foreground">Tải ảnh lên</p>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsCreating(false)}>
                Hủy
              </Button>
              <Button size="sm" onClick={handleCreate} disabled={createMutation.isPending || !licenseCatalog.isSuccess}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu bản nháp"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parent exam state and published versions are different entities. */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          { label: "Tổng kỳ thi", value: examSets.length, icon: BookOpen, color: "text-primary" },
          { label: "Kỳ thi đang công bố", value: examSets.filter((e) => e.status === "PUBLISHED").length, icon: CheckCircle2, color: "text-emerald-500" },
          { label: "Kỳ thi bản nháp", value: examSets.filter((e) => e.status === "DRAFT").length, icon: Clock, color: "text-amber-500" },
          { label: "Phiên bản đã xuất bản", value: examSets.reduce((sum, e) => sum + e.publishedVersionCount, 0), icon: Award, color: "text-violet-500" },
          { label: "Số câu đề đã cấu hình", value: examSets.reduce((sum, e) => sum + e.questionsCount, 0).toLocaleString("vi-VN"), icon: BookOpen, color: "text-primary" },
        ].map((stat) => {
          const Icon = stat.icon;
          return <Card key={stat.label}><CardContent className="flex items-center gap-3 p-4"><div className={`rounded-xl bg-muted p-2 ${stat.color}`}><Icon className="size-5" /></div><div><p className="text-[12.5px]/4 text-muted-foreground">{stat.label}</p><p className="text-2xl font-bold">{stat.value}</p></div></CardContent></Card>;
        })}
      </div>
      <p className="text-[12.5px]/4 text-muted-foreground">Trạng thái kỳ thi và phiên bản đề được quản lý riêng. Kỳ thi đang ẩn sẽ không hiển thị cho học viên.</p>
      {examsError && <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-[14.5px]/5 text-red-700">Không tải được dữ liệu kỳ thi. Vui lòng kiểm tra kết nối hoặc quyền truy cập.</p>}

      {/* Filter Toolbar */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm bộ đề thi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-[14.5px]/5"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedLicense}
              onChange={(e) => setSelectedLicense(e.target.value)}
              className="h-9 rounded-lg border bg-background px-3 text-[14.5px]/5 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">Hạng bằng (Tất cả)</option>
              {licenseOptions.map((item) => <option key={item.code} value={item.code}>Hạng {item.code}</option>)}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 rounded-lg border bg-background px-3 text-[14.5px]/5 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">Trạng thái (Tất cả)</option>
              <option value="PUBLISHED">Đã xuất bản</option>
              <option value="DRAFT">Bản nháp</option>
              <option value="HIDDEN">Đang ẩn</option>
              <option value="ARCHIVED">Đã lưu trữ</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Main Exams Table */}
      <Card className="rounded-2xl shadow-sm overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[14.5px]/5">
            <thead className="bg-muted/50 border-b text-[12.5px]/4 font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-3.5 px-4">Mã đề</th>
                <th className="py-3.5 px-4">Tên bộ đề</th>
                <th className="py-3.5 px-4 w-28">Hạng bằng</th>
                <th className="py-3.5 px-4 w-44">Cấu trúc</th>
                <th className="py-3.5 px-4 w-32">Trạng thái</th>
                <th className="py-3.5 px-4 w-32">Cập nhật</th>
                <th className="min-w-[250px] py-3.5 px-4 text-right whitespace-nowrap">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-48" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-5 w-12 rounded-full" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-8 w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredExams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground text-[14.5px]/5">
                    Chưa có bộ đề nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredExams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-foreground">
                      {exam.code}
                    </td>
                    <td className="py-4 px-4 font-medium text-foreground max-w-xs">
                      {exam.title}
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className="font-bold">
                        {exam.licenseType}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-[12.5px]/4 text-muted-foreground">
                      {exam.versionCount === 0 ? "Chưa tạo phiên bản" : <>{exam.questionsCount ? `${exam.questionsCount} câu` : "Chưa có cấu trúc"} · {exam.durationMinutes ? `${exam.durationMinutes} phút` : "Chưa có quy chế"} · {exam.passScore ? `Đạt ≥${exam.passScore}` : "Chưa có tiêu chí"}<span className="mt-1 block font-medium text-foreground">{exam.examType === "OFFICIAL" ? "Thi chính thức" : exam.examType ?? "—"} · {exam.versionCount} phiên bản</span></>}
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="secondary" className={exam.status === "PUBLISHED" ? "bg-emerald-100 text-emerald-700" : exam.status === "HIDDEN" ? "bg-slate-200 text-slate-700" : exam.status === "ARCHIVED" ? "bg-gray-200 text-gray-700" : "bg-amber-100 text-amber-700"}>{({ DRAFT: "Bản nháp", PUBLISHED: "Đã xuất bản", HIDDEN: "Đang ẩn", ARCHIVED: "Đã lưu trữ" } as Record<string, string>)[exam.status] ?? exam.status}</Badge>
                      {exam.status === "HIDDEN" && exam.publishedVersionCount > 0 && <p className="mt-1 text-[12.5px]/4 text-amber-700">Phiên bản đã xuất bản nhưng kỳ thi đang ẩn</p>}
                    </td>
                    <td className="py-4 px-4 text-[12.5px]/4 text-muted-foreground">{exam.updatedAt}</td>
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex flex-nowrap items-center justify-end gap-1.5">
                        {/* Nút Xuất bản nếu đang là DRAFT */}
                        {exam.status === "DRAFT" && (
                          <Button
                            variant="default"
                            size="sm"
                            className="h-8 shrink-0 whitespace-nowrap gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[12.5px]/4"
                            onClick={() => handlePublish(exam.id)}
                            title="Mở trang phiên bản để xuất bản kỳ thi đúng nghiệp vụ"
                          >
                            <Send className="h-3.5 w-3.5" />
                            Thiết lập đề thi
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          title="Chỉnh sửa thông tin"
                          onClick={() => handleOpenEdit(exam)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Link href={`/admin/exams/${exam.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Cấu hình & Phiên bản">
                            <Settings2 className="h-4 w-4" />
                          </Button>
                        </Link>

                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deletingId === exam.id}
                          onClick={() => handleDelete(exam.id, exam.title)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          title="Xóa bộ đề"
                        >
                          {deletingId === exam.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      {/* Edit Exam Dialog */}
      <Dialog open={!!editingExam} onOpenChange={(open) => !open && setEditingExam(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin Bộ đề thi</DialogTitle>
          </DialogHeader>
          {editingExam && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
              <div className="space-y-1.5">
                <label className="text-[12.5px]/4 font-semibold text-muted-foreground">Tên bộ đề *</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="VD: Đề thi chính thức hạng B"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[12.5px]/4 font-semibold text-muted-foreground">Mã bộ đề *</label>
                <Input
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                  placeholder="VD: EX-B-01"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2 mt-2">
                <label className="text-[12.5px]/4 font-semibold text-muted-foreground flex justify-between">
                  <span>Ảnh bìa (Thumbnail)</span>
                  {editThumbnailId && (
                    <span 
                      className="text-destructive cursor-pointer hover:underline" 
                      onClick={() => setEditThumbnailId("")}
                    >
                      Xóa ảnh
                    </span>
                  )}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={editFileInputRef}
                  onChange={handleUploadEditThumb}
                />
                <div 
                  className={`border-2 border-dashed rounded-xl h-[160px] flex flex-col items-center justify-center gap-2 transition-colors overflow-hidden relative ${isUploadingEditThumb ? "opacity-50 pointer-events-none" : "cursor-pointer hover:border-primary/50"} ${editThumbnailId ? "bg-muted/10 border-solid" : "bg-muted/20"}`}
                  onClick={() => !editThumbnailId && editFileInputRef.current?.click()}
                >
                  {isUploadingEditThumb ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <p className="text-[12.5px]/4">Đang tải...</p>
                    </div>
                  ) : editThumbnailId ? (
                    <div className="relative w-full h-full group">
                      <MediaImage src={editThumbnailId} alt="Thumbnail" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); editFileInputRef.current?.click(); }}>
                          Đổi ảnh
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="h-8 w-8 text-muted-foreground" />
                      <p className="text-[14.5px]/5 font-medium text-muted-foreground">Tải ảnh lên (Max 5MB)</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingExam(null)}>Đóng</Button>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
