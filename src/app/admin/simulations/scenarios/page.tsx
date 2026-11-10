import {ScenarioList} from '@/features/admin/admin05/read-pages';
export default async function Page({searchParams}:{searchParams:Promise<{bankVersion?:string;chapterId?:string}>}){const {bankVersion,chapterId}=await searchParams;return <ScenarioList bankVersion={bankVersion??''} chapterId={chapterId??''}/>;}
