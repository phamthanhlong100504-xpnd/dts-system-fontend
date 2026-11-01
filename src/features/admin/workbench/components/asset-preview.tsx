'use client';
/* eslint-disable @next/next/no-img-element -- Scoped signed URLs must not be re-resolved by the shared UUID image component. */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { safePlaybackUrl } from '../rules';
import type { ResourceSource,Snapshot } from '../model';
export function AssetPreview({source,snapshot,mediaId,video=false,title}:{source:ResourceSource|null;snapshot:Snapshot|null;mediaId:string;video?:boolean;title:string}) {
 const [failed,setFailed]=useState('');
 const query=useQuery({queryKey:['admin','workbench','asset-preview',snapshot?.actorId,snapshot?.versionId,snapshot?.revision,mediaId],queryFn:async({signal})=>{const r=await source!.mediaUrl(snapshot!,mediaId,signal);if(r.mediaId!==mediaId||r.expiresAt&&(!Number.isFinite(Date.parse(r.expiresAt))||Date.parse(r.expiresAt)<=Date.now()))throw new Error('Cần lấy lại đường dẫn xem trước.');return safePlaybackUrl(r.url);},enabled:Boolean(source&&snapshot&&mediaId),retry:false,staleTime:0,gcTime:0});
 if(!mediaId)return null;
 return <div className="space-y-3 rounded-xl border p-3">{source&&snapshot&&query.data&&!query.isError&&failed!==query.data?(video?<video key={query.data} controls preload="metadata" src={query.data} aria-label={title} className="max-h-72 w-full" onError={()=>setFailed(query.data!)}/>:<img key={query.data} src={query.data} alt={title} className="max-h-60 max-w-full object-contain" onError={()=>setFailed(query.data!)}/>):<p role="status" className="p-4 text-[14px]/6 text-muted-foreground">{query.isFetching?'Đang lấy bản xem trước…':source?'Chưa thể mở tài nguyên. Hãy lấy lại bản xem trước.':'Chưa có quyền xem trước đã xác nhận.'}</p>}{source&&snapshot&&<Button type="button" size="sm" variant="outline" disabled={query.isFetching} onClick={()=>{setFailed('');void query.refetch();}}>Lấy lại bản xem trước</Button>}</div>;
}
