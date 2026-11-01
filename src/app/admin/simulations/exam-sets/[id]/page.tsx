import { ResourceWorkspace } from "@/features/admin/workbench/components/resource-workspace";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <ResourceWorkspace kind="simulation-sets" baseHref="/admin/simulations/exam-sets" id={id} />; }
