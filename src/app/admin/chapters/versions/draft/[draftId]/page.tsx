import {EditorialDraftWorkspace} from '@/features/admin/admin03/draft-workspace';
export default async function Page({params}:{params:Promise<{draftId:string}>}){const {draftId}=await params;return <EditorialDraftWorkspace kind="CHAPTER" draftId={draftId} baseHref="/admin/chapters/versions"/>;}
