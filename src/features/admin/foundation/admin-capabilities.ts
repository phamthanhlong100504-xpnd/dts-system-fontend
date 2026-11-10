/** UI model; a verified deployed-API adapter must supply this grant. */
export interface AdminCapabilityGrant {
 actorId:string;canEnterAdmin:boolean;verifiedAt:string;expiresAt:string;pages:Record<string,boolean>;
 resources:Array<{resource:string;actions:string[];scopeLabel:string}>;
}
export interface AdminCapabilitySource {actorId:string;read(signal?:AbortSignal):Promise<AdminCapabilityGrant>}
/** Enable only after Identity V15 migration, new API and JWT re-login are verified.
 * Deployment remains on the legacy access gate by default.
 */
export function getAdminCapabilitySource(actorId:string):AdminCapabilitySource|null {
 // BE Admin 01 capabilities is deployed and verified via Gateway. Secure by default; an explicit rollout rollback remains available.
 if(process.env.NEXT_PUBLIC_DTS_ADMIN_CAPABILITIES_V1==='disabled'||!actorId)return null;
 return {actorId,async read(signal){
   const {identityApi}=await import('@/lib/api');
   const grant=await identityApi.get<AdminCapabilityGrant>('/v1/admin/me/capabilities',{signal});
   if(!validCapabilityGrant(grant,actorId))throw new Error('Capabilities không hợp lệ hoặc đã hết hạn.');
   return grant;
 }};
}
export function validCapabilityGrant(g:AdminCapabilityGrant,actor:string,now=Date.now()):boolean {
 return Boolean(g&&g.actorId===actor&&typeof g.canEnterAdmin==='boolean'&&Number.isFinite(Date.parse(g.verifiedAt))&&Date.parse(g.verifiedAt)<=now&&Number.isFinite(Date.parse(g.expiresAt))&&Date.parse(g.expiresAt)>now&&g.pages&&!Array.isArray(g.pages)&&Object.values(g.pages).every(x=>typeof x==='boolean')&&Array.isArray(g.resources)&&new Set(g.resources.map(x=>x.resource)).size===g.resources.length&&g.resources.every(x=>typeof x.resource==='string'&&x.resource.length>0&&typeof x.scopeLabel==='string'&&Array.isArray(x.actions)&&x.actions.every(a=>typeof a==='string'&&a.length>0)));
}
export function capabilityAllows(g:AdminCapabilityGrant,actor:string,resource:string,action:string):boolean {return validCapabilityGrant(g,actor)&&g.canEnterAdmin&&g.resources.some(x=>x.resource===resource&&x.actions.includes(action));}
