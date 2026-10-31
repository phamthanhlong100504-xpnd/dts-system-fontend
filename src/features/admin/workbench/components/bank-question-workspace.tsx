'use client';
import {useQuery} from '@tanstack/react-query';
import {useAdminAccess} from '../../foundation/admin-access-provider';
import {AdminPageState} from '../../foundation/components/admin-page-state';
import {getAdminResourceSource} from '../source';
import {assertSnapshot} from '../rules';
import {emptyOptions,type ResourceSource} from '../model';
import {ResourceEditor} from './resource-editor';
export function BankQuestionWorkspace({bankVersionId,sourceQuestionId,sourceOverride}:{bankVersionId:string;sourceQuestionId:string;sourceOverride?:ResourceSource|null}) {
 const {access,error}=useAdminAccess();const source=sourceOverride===undefined?getAdminResourceSource():sourceOverride;const ready=Boolean(source?.bankQuestion&&source.actorId===access?.actorId&&!error);
 const options=useQuery({queryKey:['admin','bank-question-options',access?.actorId,bankVersionId],queryFn:async({signal})=>{const o=await source!.options('questions',signal);if(o.actorId!==access?.actorId)throw new Error('Tài khoản đã thay đổi.');return o;},enabled:ready,retry:false,staleTime:0,gcTime:0});
 const detail=useQuery({queryKey:['admin','bank-question',access?.actorId,bankVersionId,sourceQuestionId],queryFn:async({signal})=>{const s=assertSnapshot(await source!.bankQuestion!(bankVersionId,sourceQuestionId,signal),access!.actorId,'questions');if(s.sourceReference?.bankVersionId!==bankVersionId||s.sourceReference.sourceQuestionId!==sourceQuestionId||s.sourceReference.origin!=='STANDARD')throw new Error('Câu hỏi không khớp phiên bản ngân hàng được yêu cầu.');return s;},enabled:ready,retry:false,staleTime:0,gcTime:0});
 if(detail.isError||options.isError)return <AdminPageState state="error" error={detail.error??options.error} onRetry={()=>{void detail.refetch();void options.refetch();}}/>;
 if(ready&&(detail.isPending||options.isPending))return <AdminPageState state="loading"/>;
 return <ResourceEditor key={`${access?.actorId}:${bankVersionId}:${sourceQuestionId}`} kind="questions" source={ready?source:null} initial={ready?detail.data??null:null} options={ready?options.data??emptyOptions():emptyOptions()} backHref={`/admin/questions/banks/${encodeURIComponent(bankVersionId)}`}/>;
}
