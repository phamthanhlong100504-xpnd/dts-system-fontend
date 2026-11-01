"use client";
import Link from "next/link";
import { Bell, Shield, Database, Palette, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/features/admin/foundation/components/admin-page-header";
import { useAdminAccess } from "@/features/admin/foundation/admin-access-provider";
import { canReadAdminPage } from "@/features/admin/foundation/admin-access";
const sections = [
 { title:"Thông báo",icon:Bell,description:"Cấu hình thông báo hiện chưa khả dụng.",links:[] },
 { title:"Bảo mật và quyền truy cập",icon:Shield,description:"Quản lý tài khoản, vai trò và quyền tại các trang quản trị tương ứng.",links:[["users","Người dùng","/admin/users"],["roles","Vai trò & Quyền","/admin/roles"]] },
 { title:"Dữ liệu và lịch sử thay đổi",icon:Database,description:"Tra cứu nhật ký thay đổi. Chức năng sao lưu và khôi phục dữ liệu chưa được cung cấp trên trang này.",links:[["audit-logs","Nhật ký quản trị","/admin/audit-logs"]] },
 { title:"Giao diện",icon:Palette,description:"Sử dụng giao diện và hệ chữ hiện hành. Trang này chưa hỗ trợ tùy chỉnh giao diện.",links:[] },
 { title:"Kết nối hệ thống",icon:Globe,description:"Xem tình trạng ứng dụng và theo dõi việc cập nhật nội dung, kết quả học tập.",links:[["system-monitoring","Giám sát vận hành","/admin/system-monitoring"],["content-releases","Phát hành & Đồng bộ","/admin/content-releases"]] },
];
export default function AdminSettingsPage() { const {access}=useAdminAccess();return <div className="space-y-6"><AdminPageHeader title="Cài đặt hệ thống" description="Truy cập các chức năng quản trị và xem những cài đặt hiện được hỗ trợ." /><div className="grid gap-4 md:grid-cols-2">{sections.map(section=>{const Icon=section.icon;const links=section.links.filter(([id])=>canReadAdminPage(access,id));return <Card key={section.title} className="rounded-2xl"><CardHeader><div className="flex items-center gap-3"><Icon className="size-5 shrink-0 text-primary" /><CardTitle>{section.title}</CardTitle></div></CardHeader><CardContent className="space-y-4"><p className="text-[15px]/6 text-muted-foreground">{section.description}</p>{links.length>0&&<div className="flex flex-wrap gap-3">{links.map(([id,label,href])=><Button key={id} asChild variant="outline"><Link href={href}>{label}</Link></Button>)}</div>}</CardContent></Card>;})}</div></div>; }
