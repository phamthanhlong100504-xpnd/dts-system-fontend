import type {Action,ContentStatus,Difference,HistoryRow,Issue,Page} from './model';
/** Internal view models. No HTTP path or DTO is asserted by this port. */
export type LifecycleKind='THEORY_BANK'|'QUESTION'|'CHAPTER'|'PROGRAM'|'TRAFFIC_SIGN'|'MEMORY_TIP'|'PRACTICE_SET'|'EXAM'|'EXAM_VERSION'|'EXAM_STRUCTURE'|'EXAM_CRITERIA'|'EXAM_RULE'|'SCENARIO'|'SIMULATION_BANK'|'SIMULATION_CHAPTER'|'SIMULATION_SET';
export interface LifecycleSubject {kind:LifecycleKind;id:string;versionId?:string}
export interface Dependency {id:string;label:string;versionLabel:string;statusLabel:string;reason:string|null;href:string|null}
export interface VersionContext {
 actorId:string;subject:LifecycleSubject;versionId:string;revision:number;versionLabel:string;status:ContentStatus;
 publishedVersionLabel:string|null;draftVersionLabel:string|null;sourceVersionLabel:string|null;updatedByLabel:string|null;approvedByLabel:string|null;updatedAt:string|null;
 changeImpact:'EDITORIAL'|'SCORING'|'POLICY'|'UNKNOWN';actions:Action[];separateApprover:boolean;updatedByActorId:string|null;canPublish:boolean;
 validation:{revision:number;checkedAt:string;issues:Issue[];summary:Array<{label:string;value:string|number|null}>}|null;
 dependencies:Dependency[];totalDependencies:number;activeSessionsCount:number|null;
 release:{label:string;statusLabel:string;href:string|null;active:boolean;appliedAt:string|null}|null;
 editorHref?:string|null;
}
export type LifecycleAction='submit'|'approve'|'reject'|'publish'|'archive'|'clone'|'restore';
export interface LifecycleSource {
 actorId:string;
 read(subject:LifecycleSubject,signal?:AbortSignal):Promise<VersionContext>;
 validate(context:VersionContext):Promise<VersionContext>;
 transition(context:VersionContext,action:LifecycleAction,reason:string,operationKey:string):Promise<VersionContext>;
 history(context:VersionContext,page:number,signal?:AbortSignal):Promise<Page<HistoryRow>>;
 compare(context:VersionContext,versionId:string,signal?:AbortSignal):Promise<Difference[]>;
}
export {makeAdminLifecycleSource as getAdminLifecycleSource} from './adapters/lifecycle';
export function contextMatches(c:VersionContext,actor:string,s:LifecycleSubject):boolean {
 return Boolean(c&&c.actorId===actor&&c.subject.kind===s.kind&&c.subject.id===s.id&&(!s.versionId||c.versionId===s.versionId)&&c.versionId&&Number.isSafeInteger(c.revision)&&c.revision>=0&&Array.isArray(c.actions)&&Array.isArray(c.dependencies)&&Number.isSafeInteger(c.totalDependencies)&&c.totalDependencies>=c.dependencies.length);
}
export function canLifecycle(c:VersionContext,action:Action,actor:string):boolean {
 if(c.actorId!==actor||!c.actions.includes(action))return false;
 if(action==='approve'&&c.separateApprover&&c.updatedByActorId===actor)return false;
 if(['submit','publish'].includes(action)&&(!c.validation||c.validation.revision!==c.revision||!Number.isFinite(Date.parse(c.validation.checkedAt))||c.validation.issues.some(i=>i.severity==='ERROR')))return false;
 if(action==='publish'&&!c.canPublish)return false;
 return true;
}
