import {PracticeAdmin04List} from '@/features/admin/admin04/practice-pages';
export default async function Page({searchParams}:{searchParams:Promise<{licenseClass?:string}>}){const q=await searchParams;return <PracticeAdmin04List initialLicense={typeof q.licenseClass==='string'?q.licenseClass:''}/>}
