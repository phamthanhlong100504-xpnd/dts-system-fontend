"use client";
import Link from "next/link";
import { DashboardData } from "../workbench/components/dashboard-data";
import { BookOpen, Video, ClipboardCheck, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "../foundation/components/admin-page-header";
import { useAdminAccess } from "../foundation/admin-access-provider";
import { canReadAdminPage } from "../foundation/admin-access";

const groups = [
  { title: "Nội dung lý thuyết", icon: BookOpen, description: "Ngân hàng chuẩn, nội dung tự biên, chương trình, biển báo và mẹo ghi nhớ.", links: [["questions", "Ngân hàng câu hỏi", "/admin/questions"], ["programs", "Chương trình học", "/admin/programs"]] },
  { title: "Video mô phỏng", icon: Video, description: "Tình huống, chương mô phỏng, bộ đề và tài nguyên đang sử dụng.", links: [["simulation-scenarios", "Ngân hàng tình huống", "/admin/simulations/scenarios"], ["simulation-exam-sets", "Bộ đề mô phỏng", "/admin/simulations/exam-sets"]] },
  { title: "Thi và học tập", icon: ClipboardCheck, description: "Kết quả thi, tiến độ học tập, điểm kinh nghiệm và xếp hạng.", links: [["reports", "Báo cáo & Thống kê", "/admin/reports"], ["exams", "Quản lý đề thi", "/admin/exams"]] },
  { title: "Vận hành", icon: Activity, description: "Phát hành nội dung, cập nhật dữ liệu và các vấn đề cần theo dõi.", links: [["system-monitoring", "Giám sát vận hành", "/admin/system-monitoring"], ["content-releases", "Phát hành & Đồng bộ", "/admin/content-releases"]] },
];
export function AdminDashboardPage() {
  const { access } = useAdminAccess();
  return <div className="space-y-6"><AdminPageHeader title="Tổng quan hệ thống" description="Theo dõi các khu vực quản trị và tình trạng số liệu tổng hợp." />
    <DashboardData/>
    <div className="grid gap-4 md:grid-cols-2">{groups.map(group => { const links = group.links.filter(([id]) => canReadAdminPage(access, id)); if (!links.length) return null; const Icon=group.icon;
      return <Card key={group.title} className="rounded-2xl"><CardHeader><div className="flex items-center gap-3"><Icon className="size-5 shrink-0 text-primary" /><CardTitle>{group.title}</CardTitle></div><p className="text-[15px]/6 text-muted-foreground">{group.description}</p></CardHeader><CardContent className="space-y-4"><div className="rounded-xl bg-muted/40 p-4"><p className="text-[15px] font-medium">Chưa có số liệu xác nhận</p><p className="mt-1 text-[14px]/6 text-muted-foreground">Thời điểm cập nhật: chưa có thông tin.</p></div><div className="flex flex-wrap gap-3">{links.map(([id,label,href]) => <Button key={id} asChild variant="outline"><Link href={href}>{label}</Link></Button>)}</div></CardContent></Card>;
    })}</div></div>;
}
