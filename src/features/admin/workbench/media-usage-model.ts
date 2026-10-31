import type { MediaPlayback,MediaReference } from './model';
export interface MediaUsage {actorId:string;mediaId:string;revision:number;references:MediaReference[];totalReferences:number;canRetire:boolean;retiredAt:string|null;reason:string|null}
export interface MediaUsageSource {actorId:string;usage(mediaId:string,signal?:AbortSignal):Promise<MediaUsage>;retire(usage:MediaUsage,operationKey:string):Promise<void>;preview(mediaId:string,signal?:AbortSignal):Promise<MediaPlayback>}
export function getAdminMediaUsageSource():MediaUsageSource|null{return null;}
export function mayRetireMedia(value:MediaUsage,actorId:string):boolean{return value.actorId===actorId&&value.canRetire&&value.totalReferences===0&&value.references.length===0&&value.retiredAt===null;}
