'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs,TabsContent,TabsList,TabsTrigger } from '@/components/ui/tabs';
import { OfficialBankBrowser } from '../../components/official-bank-browser';
import { AdminPageHeader } from '../../foundation/components/admin-page-header';
import { ResourceWorkspace } from './resource-workspace';
export function TheoryBanksHub() {
 return <div className="space-y-6"><AdminPageHeader title="Phiên bản ngân hàng chuẩn" description="Tra cứu ngân hàng đã công bố và quản lý nội dung theo từng phiên bản." actions={<Button asChild variant="outline"><Link href="/admin/questions">Ngân hàng câu hỏi</Link></Button>}/><Tabs defaultValue="published"><div className="overflow-x-auto"><TabsList className="w-max"><TabsTrigger value="published">Ngân hàng đã công bố</TabsTrigger><TabsTrigger value="versions">Quản lý phiên bản</TabsTrigger></TabsList></div><TabsContent value="published" className="pt-4"><OfficialBankBrowser view="questions" showVersionLink={false}/></TabsContent><TabsContent value="versions" className="space-y-4 pt-4"><ResourceWorkspace kind="theory-banks" baseHref="/admin/questions/banks" embedded/><Button asChild variant="outline"><Link href="/admin/questions/versions">Biên soạn câu hỏi theo phiên bản</Link></Button></TabsContent></Tabs></div>;
}
