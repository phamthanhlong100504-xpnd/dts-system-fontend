import { EditorialSourceDetail } from "@/features/admin/admin03/editorial-pages";
export default async function Page({params}:{params:Promise<{id:string}>}) {const {id}=await params;return <EditorialSourceDetail kind="TRAFFIC_SIGN" id={id} baseHref="/admin/traffic-signs/drafts"/>;}
