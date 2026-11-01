import {ResourceWorkspace} from '@/features/admin/workbench/components/resource-workspace';
export default async function Page({searchParams}:{searchParams:Promise<{licenseClass?:string}>}) {
 const query=await searchParams;
 return <ResourceWorkspace kind="practice-sets" baseHref="/admin/practice-exam-sets" id="create" initialLicense={typeof query.licenseClass==='string'?query.licenseClass:''}/>;
}
