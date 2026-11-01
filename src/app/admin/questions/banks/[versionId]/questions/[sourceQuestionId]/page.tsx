import {BankQuestionWorkspace} from '@/features/admin/workbench/components/bank-question-workspace';
export default async function Page({params}:{params:Promise<{versionId:string;sourceQuestionId:string}>}) {
 const {versionId,sourceQuestionId}=await params;
 return <BankQuestionWorkspace bankVersionId={versionId} sourceQuestionId={sourceQuestionId}/>;
}
