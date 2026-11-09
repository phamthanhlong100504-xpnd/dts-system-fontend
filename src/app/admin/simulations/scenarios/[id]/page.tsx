import {SimulationScenarioDetail} from '@/features/admin/admin05/read-pages';
export default async function Page({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{bankVersion?:string}>}){const {id}=await params;const {bankVersion}=await searchParams;return <SimulationScenarioDetail id={id} bankVersion={bankVersion??''}/>;}
