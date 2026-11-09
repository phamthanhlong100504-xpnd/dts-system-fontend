import {BankVersionQuestionDetail} from '@/features/admin/admin03/bank-pages';
export default async function Page({params}:{params:Promise<{versionId:string;sourceQuestionId:string}>}){const {versionId,sourceQuestionId}=await params;return <BankVersionQuestionDetail version={versionId} sourceId={sourceQuestionId}/>;}
