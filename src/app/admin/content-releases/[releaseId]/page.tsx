import { ReleaseWorkspace } from "@/features/admin/workbench/components/release-workspace";
export default async function Page({ params }: { params: Promise<{ releaseId: string }> }) { const { releaseId } = await params; return <ReleaseWorkspace id={releaseId} />; }
