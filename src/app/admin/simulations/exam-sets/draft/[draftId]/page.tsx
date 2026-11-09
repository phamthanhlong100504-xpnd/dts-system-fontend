import {SimulationPresetDraftDetail} from '@/features/admin/admin05/draft-pages';
export default async function Page({params}:{params:Promise<{draftId:string}>}){const {draftId}=await params;return <SimulationPresetDraftDetail id={draftId}/>;}
