import {SimulationPresetDetail} from '@/features/admin/admin05/read-pages';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <SimulationPresetDetail id={id}/>;}
