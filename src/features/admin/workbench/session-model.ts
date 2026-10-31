import type { Choice,Page } from './model';
/** Admin read models only. No learner /me endpoint can implement this port. */
export interface SessionFilter {from:string;to:string;keyword:string;licenseClass:string;status:string;examVersion:string;examId?:string;page:number;size:number}
export interface SessionRow {id:string;learnerLabel:string;examLabel:string;examVersion:string;licenseClass:string;statusLabel:string;startedAt:string|null;submittedAt:string|null;score:number|null;passed:boolean|null;releasedAt:string|null;attemptNumber?:number|null;gradingStatusLabel?:string|null;violationLabel?:string|null;isInProgress?:boolean|null;canViewResult?:boolean}
export interface SessionDetail {actorId:string;row:SessionRow;revision:number;releasePolicy:'IMMEDIATE'|'AFTER_SUBMIT'|'AFTER_EXAM_END'|'MANUAL';canRelease:boolean;releaseReason:string|null;ruleVersion:string;criteriaVersion:string;canViewAnswers?:boolean;answers:Array<{id:string;label:string;selectedAnswer:string;expectedAnswer:string|null;score:number|null}>}
export interface SessionSource {actorId:string;options(signal?:AbortSignal):Promise<{actorId:string;licenses:Choice[];statuses:Choice[];exams?:Choice[];examVersions:Choice[]}>;list(filter:SessionFilter,signal?:AbortSignal):Promise<Page<SessionRow>>;detail(id:string,signal?:AbortSignal):Promise<SessionDetail>;releaseManual(detail:SessionDetail,operationKey:string):Promise<void>}
export function getAdminSessionSource():SessionSource|null{return null;}
export function mayReleaseSession(s:SessionDetail,actorId:string):boolean {return s.actorId===actorId&&s.canRelease===true&&s.releasePolicy==='MANUAL'&&s.row.releasedAt===null&&s.row.isInProgress===false;}

export function mayViewSessionAnswers(s:SessionDetail):boolean{return s.canViewAnswers===true&&s.row.isInProgress===false;}
export function mayViewSessionResult(s:SessionRow):boolean{return s.canViewResult===true&&s.isInProgress===false;}
