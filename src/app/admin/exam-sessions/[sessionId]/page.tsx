import { SessionWorkspace } from "@/features/admin/workbench/components/session-workspace";
export default async function Page({ params }: { params: Promise<{ sessionId: string }> }) { const { sessionId } = await params; return <SessionWorkspace id={sessionId} />; }
