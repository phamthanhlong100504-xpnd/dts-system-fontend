import {BankVersionQuestions} from '@/features/admin/admin03/bank-pages';
export default async function Page({params}:{params:Promise<{versionId:string}>}){const {versionId}=await params;return <BankVersionQuestions version={versionId}/>;}
