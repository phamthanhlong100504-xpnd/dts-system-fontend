import { ResourceWorkspace } from "@/features/admin/workbench/components/resource-workspace";
export default async function Page({ params }: { params: Promise<{ versionId: string }> }) { const { versionId } = await params; return <ResourceWorkspace kind="theory-banks" baseHref="/admin/questions/banks" id={versionId} />; }
