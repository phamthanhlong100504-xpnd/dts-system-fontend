/** Admin API boundary – only verified backend paths, no fabricated status or permissions. */
import { useAuthStore } from '@/stores/auth-store';
import { ApiError } from '@/lib/api';

export type JsonRecord = Record<string, unknown>;
export type AdminApi = { get<T>(path:string,config?:{params?:Record<string,unknown>;signal?:AbortSignal}):Promise<T>;
  post<T>(path:string,body?:unknown,config?:{params?:Record<string,unknown>}):Promise<T>;
  patch<T>(path:string,body?:unknown):Promise<T>;
  put<T>(path:string,body?:unknown):Promise<T> };
export const obj = (v:unknown, label='response'):JsonRecord => {
 if(!v || typeof v!=='object' || Array.isArray(v)) throw new Error(`Dữ liệu ${label} không đúng hợp đồng.`);
 return v as JsonRecord;
};
export const arr = (v:unknown):unknown[] => Array.isArray(v)?v:[];
export const str = (v:unknown):string => typeof v==='string'?v:'';
export const optStr = (v:unknown):string|null => typeof v==='string'&&v.trim()?v:null;
export const num = (v:unknown):number|null => typeof v==='number'&&Number.isFinite(v)&&v>=0?v:typeof v==='string'&&/^(0|[1-9][0-9]*)(\.[0-9]+)?$/.test(v)&&Number.isFinite(Number(v))?Number(v):null;
export const int = (v:unknown):number|null => {const x=num(v);return x!==null&&Number.isSafeInteger(x)?x:null;};
export const bool=(v:unknown)=>v===true;
export const textList=(v:unknown):string[]=>arr(v).filter((x):x is string=>typeof x==='string');
export const recordList=(v:unknown,label='items'):JsonRecord[]=>{if(!Array.isArray(v))throw new Error(`Danh sách ${label} chưa được xác nhận.`);return v.map(x=>obj(x,label));};
export const stamp=(v:unknown):string|null=>{const s=optStr(v);return s&&Number.isFinite(Date.parse(s))?s:null;};
export const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const identity=(v:unknown)=>str(v).trim().toLowerCase();
export function actorId():string|null {const s=useAuthStore.getState();return s.accessToken&&s.user?.id?s.user.id:null;}
export function assertActor(expected:string):void {if(actorId()!==expected)throw new ApiError('Phiên quản trị đã thay đổi. Đăng nhập và tải lại trang.',401);}
/** Token is intentionally kept out of callbacks, cache keys and reporting payloads. */
export async function read<T>(actor:string,api:AdminApi,path:string,params?:Record<string,unknown>,signal?:AbortSignal):Promise<T>{
 assertActor(actor);const data=await api.get<T>(path,{params,signal});assertActor(actor);return data;
}
export async function write<T>(actor:string,run:()=>Promise<T>):Promise<T>{assertActor(actor);const result=await run();assertActor(actor);return result;}
export function unavailable(message:string):never {throw new Error(message);}
export function sourceStatus(v:unknown):'READY'|'PARTIAL'|'STALE'|'UNAVAILABLE'{
 if(v==='READY'||v==='PARTIAL'||v==='STALE'||v==='UNAVAILABLE')return v;
 throw new Error('Backend không cung cấp trạng thái nguồn hợp lệ.');
}
/** No imaginary visibility, no fake "ready" status when backend omits evidence. */
export const warn=(r:JsonRecord)=>textList(r.warnings);
export const safeResource=(v:string)=>/^[a-z][a-z0-9_-]{0,63}$/.test(v);
export function requireUuid(value:string):void{if(!uuid.test(value))throw new Error('Mã định danh không hợp lệ.');}
export const emptyPage=<T>(page:number,size:number):{items:T[];page:number;size:number;totalElements:number}=>({items:[],page,size,totalElements:0});
