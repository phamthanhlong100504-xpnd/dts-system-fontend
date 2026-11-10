import {PracticeAdmin04Detail} from '@/features/admin/admin04/practice-pages';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <PracticeAdmin04Detail id={id}/>}
