import {EditorialDraftWorkspace} from '@/features/admin/admin03/draft-workspace';
export default async function Page({params}:{params:Promise<{draftId:string}>}){const {draftId}=await params;return <EditorialDraftWorkspace kind="LEARNING_PROGRAM" draftId={draftId} baseHref="/admin/programs/versions"/>;}
