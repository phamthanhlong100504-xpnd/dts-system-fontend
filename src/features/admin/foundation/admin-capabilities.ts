/** UI model; a verified deployed-API adapter must supply this grant. */
export interface AdminCapabilityGrant {
 actorId:string;canEnterAdmin:boolean;verifiedAt:string;expiresAt:string;pages:Record<string,boolean>;
 resources:Array<{resource:string;actions:string[];scopeLabel:string}>;
}
export interface AdminCapabilitySource {actorId:string;read(signal?:AbortSignal):Promise<AdminCapabilityGrant>}
export function getAdminCapabilitySource(actorId:string):AdminCapabilitySource|null {void actorId;return null;}
export function validCapabilityGrant(g:AdminCapabilityGrant,actor:string,now=Date.now()):boolean {
 return Boolean(g&&g.actorId===actor&&typeof g.canEnterAdmin==='boolean'&&Number.isFinite(Date.parse(g.verifiedAt))&&Date.parse(g.verifiedAt)<=now&&Number.isFinite(Date.parse(g.expiresAt))&&Date.parse(g.expiresAt)>now&&g.pages&&!Array.isArray(g.pages)&&Object.values(g.pages).every(x=>typeof x==='boolean')&&Array.isArray(g.resources)&&new Set(g.resources.map(x=>x.resource)).size===g.resources.length&&g.resources.every(x=>typeof x.resource==='string'&&x.resource.length>0&&typeof x.scopeLabel==='string'&&Array.isArray(x.actions)&&x.actions.every(a=>typeof a==='string'&&a.length>0)));
}
export function capabilityAllows(g:AdminCapabilityGrant,actor:string,resource:string,action:string):boolean {return validCapabilityGrant(g,actor)&&g.canEnterAdmin&&g.resources.some(x=>x.resource===resource&&x.actions.includes(action));}
