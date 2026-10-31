import { isUuid, contentFingerprint } from '../theory/theory-contract';
import type { Action, DraftContent, Snapshot, Timeline, Validation, LinkedItem, ResourceKind, ScorePreview } from './model';
export const timelineKeys = ['t5','t4','t3','t2','t1','end'] as const;
/** Decimal seconds to integer milliseconds, without floating-point rounding. */
export function secondsToMs(value: string): number | null {
  if (!/^\d+(?:\.\d{1,3})?$/.test(value.trim())) return null;
  const [whole,fraction='']=value.trim().split('.');
  const n=Number(whole)*1000+Number(fraction.padEnd(3,'0'));
  return Number.isSafeInteger(n) ? n : null;
}
export function msToSeconds(value: number): string { if (!Number.isSafeInteger(value)||value<0) throw new Error('Thời gian không hợp lệ.');return `${Math.floor(value/1000)}${value%1000?'.'+String(value%1000).padStart(3,'0').replace(/0+$/,''):''}`; }
export function timelineProblem(value: Timeline, durationMs: number | null): string | null {
  const times=timelineKeys.map(key=>secondsToMs(value[key]));
  if(times.some(x=>x===null))return 'Nhập đủ sáu mốc, tối đa ba chữ số thập phân.';
  if(durationMs===null||!Number.isSafeInteger(durationMs)||durationMs<=0)return 'Chưa xác minh được thời lượng video đang chọn.';
  if(times.some((t,i)=>t!>durationMs||(i>0&&t!<=times[i-1]!)))return 'Các mốc phải tăng dần, không trùng và nằm trong thời lượng video.';
  return null;
}
export function assertSnapshot(s: Snapshot, actorId: string, kind: ResourceKind, id?: string): Snapshot {
  if(!s||s.actorId!==actorId||s.scope?.actorId!==actorId||s.kind!==kind||!isUuid(s.id)||!isUuid(s.versionId)||(id&&s.id!==id)||!Number.isSafeInteger(s.revision)||s.revision<0||!Array.isArray(s.actions)||!s.row||s.row.id!==s.id||!s.content||!Array.isArray(s.content.selected)||!Array.isArray(s.content.answers)||!s.constraints||!Array.isArray(s.constraints.chapterQuotas))throw new Error('Chưa xác minh được đúng tài khoản và phiên bản nội dung.');
  if(!['DRAFT','IN_REVIEW','APPROVED','PUBLISHED','ARCHIVED','REJECTED'].includes(s.row.status))throw new Error('Trạng thái nội dung chưa hợp lệ.');
  return s;
}
export function mayAct(s: Snapshot|null, action: Action, actorId: string|undefined): boolean {
  if(!s||!actorId||s.actorId!==actorId||!s.actions.includes(action))return false;
  if(s.kind==='questions'&&s.sourceReference?.origin==='STANDARD'&&action==='publish')return false;
  if(['save','media'].includes(action)&&s.row.status!=='DRAFT')return false;
  if(action==='approve'&&s.constraints.separateApprover&&s.updatedBy===actorId)return false;
  return true;
}
export function validationCurrent(v: Validation|null,s: Snapshot,content: DraftContent): boolean { return Boolean(v&&Array.isArray(v.issues)&&Number.isFinite(Date.parse(v.checkedAt))&&v.issues.every(i=>['ERROR','WARNING'].includes(i.severity)&&typeof i.message==='string')&&v.actorId===s.actorId&&v.versionId===s.versionId&&v.revision===s.revision&&contentFingerprint(content)===contentFingerprint(s.content)&&(s.kind!=='scenarios'||(v.videoId===content.mediaId&&v.durationMs===content.videoDurationMs))); }
export function mayPublish(v: Validation|null,s: Snapshot,content: DraftContent): boolean {return mayAct(s,'publish',s.actorId)&&validationCurrent(v,s,content)&&v!.canPublish&&!v!.issues.some(i=>i.severity==='ERROR');}
export function checkSelection(items: LinkedItem[],bankVersion: string): string|null { if(items.some(x=>!isUuid(x.id)||x.bankVersion!==bankVersion))return 'Có nội dung không thuộc phiên bản ngân hàng đã chọn.';if(new Set(items.map(x=>x.id)).size!==items.length)return 'Không được chọn trùng nội dung.';return null; }
export function moveItem<T>(items:T[],from:number,to:number):T[]{if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=items.length||to>=items.length)throw new Error('Vị trí chưa hợp lệ.');const result=[...items];const [item]=result.splice(from,1);result.splice(to,0,item);return result;}
export function contentProblem(s:Snapshot,content:DraftContent,complete=true):string|null{
 if(!content.title.trim())return 'Vui lòng nhập tiêu đề.';
 const selected=checkSelection(content.selected,s.scope.bankVersion);if(selected)return selected;
 if(content.licenseClasses.some(x=>typeof x!=='string'||!x)||new Set(content.licenseClasses).size!==content.licenseClasses.length)return 'Phạm vi hạng GPLX chưa hợp lệ.';
 if(content.criticalLicenseClasses?.some(x=>!content.licenseClasses.includes(x)))return 'Hạng câu điểm liệt phải thuộc phạm vi hạng của câu hỏi.';
 if(content.sortOrder&&!/^\d+$/.test(content.sortOrder))return 'Thứ tự cần là số nguyên không âm.';
 if(!complete)return null;
 if(s.kind==='scenarios')return timelineProblem(content.timeline,content.videoDurationMs)||(!isUuid(content.mediaId)||!isUuid(content.thumbnailId)?'Chọn video và ảnh đại diện đã sẵn sàng.':null);
 if(['practice-sets','simulation-sets'].includes(s.kind)&&s.constraints.requiredCount!==null&&content.selected.length!==s.constraints.requiredCount)return `Cần chọn đủ ${s.constraints.requiredCount} nội dung theo chính sách.`;
 return null;
}
export function assertPreview(p:ScorePreview,s:Snapshot,timestampMs:number){if(!Number.isSafeInteger(timestampMs)||timestampMs<0||(s.content.videoDurationMs!==null&&timestampMs>s.content.videoDurationMs))throw new Error('Thời điểm nằm ngoài video.');if(p.versionId!==s.versionId||p.revision!==s.revision||p.videoId!==s.content.mediaId||p.timestampMs!==timestampMs||!Number.isInteger(p.score)||p.score<0||p.score>5||!p.scoringVersion||(s.scoringVersion!==null&&p.scoringVersion!==s.scoringVersion))throw new Error('Kết quả xem trước không khớp phiên bản đang kiểm tra.');return p;}
export function safePlaybackUrl(value:string):string {const u=new URL(value);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw new Error('Đường dẫn phát tài nguyên chưa hợp lệ.');return value;}
