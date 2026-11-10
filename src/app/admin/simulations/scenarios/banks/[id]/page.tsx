import {SimulationBankDraftDetail} from '@/features/admin/admin05/draft-pages';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <SimulationBankDraftDetail id={id}/>;}
