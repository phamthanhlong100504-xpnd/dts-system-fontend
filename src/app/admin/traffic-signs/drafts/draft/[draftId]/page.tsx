import {EditorialDraftWorkspace} from '@/features/admin/admin03/draft-workspace';
export default async function Page({params}:{params:Promise<{draftId:string}>}){const {draftId}=await params;return <EditorialDraftWorkspace kind="TRAFFIC_SIGN" draftId={draftId} baseHref="/admin/traffic-signs/drafts"/>;}
