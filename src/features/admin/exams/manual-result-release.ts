import {examinationApi,ApiError} from '@/lib/api';
import {getAccessToken,useAuthStore} from '@/stores/auth-store';
import {officialRelease,validId,type OfficialRelease} from '../admin04/read-contract';
/** Admin-only mutation. A live read-back is required; 204 alone does not prove delivery. */
export async function publishManualOfficialResult(actorId:string,sessionId:string,expected:OfficialRelease){
 if(!validId(sessionId)||expected.sessionId.toLowerCase()!==sessionId.toLowerCase()||
    !expected.canRelease||expected.resultReleaseMode!=='MANUAL')throw Error('Backend chưa xác nhận phiên thi đủ điều kiện công bố.');
 getAccessToken();const before=useAuthStore.getState(),token=before.accessToken;
 if(!actorId||actorId!==before.user?.id||!token)throw new ApiError('Phiên Admin không hợp lệ.',401);
 const unchanged=()=>{const s=useAuthStore.getState();if(s.user?.id!==actorId||s.accessToken!==token)throw new ApiError('Phiên Admin đã thay đổi.',401)};
 // The dedicated Admin route has independent server-side release_result authorization.
 await examinationApi.post<void>(`/v1/admin/exam-sessions/${encodeURIComponent(sessionId)}/release-result`,{});
 unchanged();
 const status=officialRelease(await examinationApi.get<unknown>(`/v1/admin/exam-sessions/${encodeURIComponent(sessionId)}/result-release`));
 unchanged();
 if(status.sessionId.toLowerCase()!==sessionId.toLowerCase()||
    !['RELEASED','PUBLISHED'].includes(status.resultReleaseStatus.toUpperCase())){
   // Do not claim success: operation may be recorded while external delivery is still pending.
   return {status,confirmed:false};
 }
 return {status,confirmed:true};
}
