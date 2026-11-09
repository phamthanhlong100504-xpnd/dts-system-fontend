import {Admin04SessionDetail} from '@/features/admin/admin04/session-pages';
export default async function Page({params}:{params:Promise<{sessionId:string}>}){const {sessionId}=await params;return <Admin04SessionDetail id={sessionId}/>}
