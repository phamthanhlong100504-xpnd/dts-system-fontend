'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs,TabsContent,TabsList,TabsTrigger } from '@/components/ui/tabs';
import { ResourceWorkspace } from './resource-workspace';
export function SimulationHub() {
 return <div className="space-y-6"><Tabs defaultValue="scenarios"><div className="overflow-x-auto"><TabsList className="w-max"><TabsTrigger value="scenarios">Tình huống</TabsTrigger><TabsTrigger value="chapters">Chương mô phỏng</TabsTrigger><TabsTrigger value="banks">Phiên bản ngân hàng</TabsTrigger></TabsList></div><TabsContent value="scenarios" className="pt-4"><ResourceWorkspace kind="scenarios" baseHref="/admin/simulations/scenarios"/></TabsContent><TabsContent value="chapters" className="pt-4"><ResourceWorkspace kind="simulation-chapters" baseHref="/admin/simulations/scenarios/chapters"/></TabsContent><TabsContent value="banks" className="pt-4"><ResourceWorkspace kind="simulation-banks" baseHref="/admin/simulations/scenarios/banks"/></TabsContent></Tabs><div className="dts-admin-actions"><Button asChild variant="outline"><Link href="/admin/simulation-guide">Hướng dẫn mô phỏng</Link></Button><Button asChild variant="outline"><Link href="/admin/content-releases">Phát hành & Đồng bộ</Link></Button></div></div>;
}
