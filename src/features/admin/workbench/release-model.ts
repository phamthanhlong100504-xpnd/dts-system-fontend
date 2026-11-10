import type {Choice,Page,Issue,HistoryRow,Difference} from './model';
import type {AdminAccess} from '../foundation/admin-access';
import {makeAdminReleaseSource} from './adapters/release';
export type ReleaseStatus='CREATED'|'VALIDATING'|'READY'|'DISTRIBUTING'|'ACTIVATING'|'ACTIVE'|'FAILED'|'RETIRED';
export type ReleaseAction='validate'|'distribute'|'activate'|'retry'|'retire'|'restore';
export interface ReleaseFilter {keyword:string;status:string;bankVersion:string;from:string;to:string;page:number;size:number}
export interface ReleaseRow {id:string;label:string;resourceLabel:string;bankVersion:string;sourceVersion:string;status:ReleaseStatus;updatedAt:string|null}
export interface ReleasableVersion {versionId:string;revision:number;label:string;bankVersion:string;statusLabel?:string;ready:boolean;reason:string|null}
export interface ReleaseDetail {actorId:string;row:ReleaseRow;revision:number;actions:ReleaseAction[];issues:Issue[];consumers:Array<{id:string;label:string;sourceVersion:string;targetVersion:string|null;status:string;appliedAt:string|null;safeError:string|null}>;history:HistoryRow[];canRestoreVersionIds:string[];restoreVersions?:Choice[];createdAt?:string|null;createdByLabel?:string|null;resources?:Array<{id:string;label:string;versionLabel:string;count:number|null;checksum:string|null;dependencies:string[];href:string|null}>;relatedReleases?:Array<{id:string;label:string;statusLabel:string;reason:string|null;href:string|null}>;auditTrail?:Array<{id:string;action:string;outcome:string;reasonCode:string|null;actorId:string|null;occurredAt:string}>}
export interface ReleaseSource {
 actorId:string;list(filter:ReleaseFilter,signal?:AbortSignal):Promise<Page<ReleaseRow>>;detail(id:string,signal?:AbortSignal):Promise<ReleaseDetail>;
 eligibleVersions(filter:{keyword:string;page:number;size:number},signal?:AbortSignal):Promise<Page<ReleasableVersion>>;
 filterOptions?(signal?:AbortSignal):Promise<{actorId:string;banks:Choice[]}>;
 canCreate(signal?:AbortSignal):Promise<boolean>;create(versions:Array<{versionId:string;revision:number}>,operationKey:string):Promise<ReleaseDetail>;
 act(detail:ReleaseDetail,action:ReleaseAction,operationKey:string,restoreVersionId:string|null):Promise<ReleaseDetail|void>;
 compare?(detail:ReleaseDetail,versionId:string,signal?:AbortSignal):Promise<Difference[]>;
}
export function getAdminReleaseSource(access?:AdminAccess|null):ReleaseSource|null{return makeAdminReleaseSource(access??null);}
export const releaseLabel:Record<ReleaseStatus,string>={CREATED:'Đã tạo',VALIDATING:'Đang kiểm tra',READY:'Đủ điều kiện',DISTRIBUTING:'Đang đồng bộ',ACTIVATING:'Đang kích hoạt',ACTIVE:'Đã kích hoạt',FAILED:'Thất bại',RETIRED:'Ngừng sử dụng'};
export function validRelease(d:ReleaseDetail,actor:string,id?:string):boolean{return Boolean(d&&d.actorId===actor&&d.row&&(!id||d.row.id===id)&&d.row.id&&releaseLabel[d.row.status]&&Number.isSafeInteger(d.revision)&&d.revision>=0&&Array.isArray(d.actions)&&d.actions.every(a=>['validate','distribute','activate','retry','retire','restore'].includes(a))&&Array.isArray(d.issues)&&Array.isArray(d.consumers)&&Array.isArray(d.history)&&Array.isArray(d.canRestoreVersionIds));}
