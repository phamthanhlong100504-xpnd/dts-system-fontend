"use client";

import { Settings, Bell, Shield, Database, Palette, Globe, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const settingsSections = [
  {
    icon: Bell,
    title: "Thông báo",
    description: "Cấu hình email, push notification và cảnh báo hệ thống",
    badge: null,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Shield,
    title: "Bảo mật",
    description: "Chính sách mật khẩu, xác thực 2 bước và phiên đăng nhập",
    badge: "Khuyến nghị",
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  {
    icon: Database,
    title: "Dữ liệu & Sao lưu",
    description: "Quản lý backup tự động, export dữ liệu và lịch sử thay đổi",
    badge: null,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
  {
    icon: Palette,
    title: "Giao diện",
    description: "Tùy chỉnh theme, ngôn ngữ và bố cục trang admin",
    badge: null,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    icon: Globe,
    title: "API & Tích hợp",
    description: "Quản lý API keys, webhook và kết nối với hệ thống bên ngoài",
    badge: "Beta",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
];

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between rounded-2xl bg-card p-6 shadow-sm border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Cài đặt hệ thống</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý cấu hình, bảo mật và tùy chỉnh hệ thống DTS.
          </p>
        </div>
        <div className="p-3 rounded-xl bg-muted">
          <Settings className="h-6 w-6 text-muted-foreground" />
        </div>
      </div>

      {/* Settings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card
              key={section.title}
              className="group cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary/30"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`p-2.5 rounded-xl ${section.bg}`}>
                    <Icon className={`h-5 w-5 ${section.color}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    {section.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {section.badge}
                      </Badge>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <CardTitle className="text-base mt-3">{section.title}</CardTitle>
                <CardDescription className="text-sm">{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" size="sm" className="w-full justify-start text-primary hover:text-primary">
                  Cấu hình →
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin hệ thống</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[
              { label: "Phiên bản", value: "v1.0.0" },
              { label: "Môi trường", value: "Development" },
              { label: "Next.js", value: "16.3.0" },
              { label: "API Gateway", value: "localhost:8080" },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <p className="text-muted-foreground">{item.label}</p>
                <p className="font-mono font-medium">{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
