"use client";
import Link from "next/link";
import { Shield, Database, Globe } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import styles from "../admin-identity.module.css";
import { AdminPageHeader } from "@/features/admin/foundation/components/admin-page-header";
import { useAdminAccess } from "@/features/admin/foundation/admin-access-provider";
import { canReadAdminPage } from "@/features/admin/foundation/admin-access";
const sections = [
 { title:"Bảo mật và quyền truy cập",icon:Shield,description:"Quản lý tài khoản và phân quyền.",links:[["users","Người dùng","/admin/users"],["roles","Vai trò & Quyền","/admin/roles"]] },
 { title:"Dữ liệu và lịch sử thay đổi",icon:Database,description:"Xem lịch sử thay đổi trên hệ thống.",links:[["audit-logs","Nhật ký quản trị","/admin/audit-logs"]] },
 { title:"Vận hành và phát hành",icon:Globe,description:"Theo dõi hoạt động và các đợt cập nhật nội dung.",links:[["system-monitoring","Giám sát vận hành","/admin/system-monitoring"],["content-releases","Phát hành & Đồng bộ","/admin/content-releases"]] },
];
export default function AdminSettingsPage() {
  const { access } = useAdminAccess();
  const visible = sections.map(section => ({
    ...section,
    links: section.links.filter(([id]) => canReadAdminPage(access, id)),
  })).filter(section => section.links.length > 0);
  return <div className={styles.page} data-testid="admin-settings-page">
    <AdminPageHeader title="Cài đặt hệ thống" description="Chọn khu vực bạn muốn quản lý." />
    <div className={styles.settingsGrid}>
      {visible.map(section => {
        const Icon = section.icon;
        return <section className={styles.settingsCard} key={section.title}>
          <div className={styles.settingsHeading}>
            <span className={styles.settingsIcon}><Icon className="size-5" aria-hidden="true" /></span>
            <h2>{section.title}</h2>
          </div>
          <p className={styles.settingsDescription}>{section.description}</p>
          <div className={styles.settingsLinks}>
            {section.links.map(([id, label, href]) => <Link href={href} key={id} className={styles.settingsLink}>
              <span>{label}</span><ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>)}
          </div>
        </section>;
      })}
    </div>
  </div>;
}
