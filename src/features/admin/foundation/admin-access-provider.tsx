"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { MutationCache, QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { canAdmin, restrictAdminAccess, type AdminAccess } from "./admin-access";
import {getAdminCapabilitySource,validCapabilityGrant} from "./admin-capabilities";
import { fetchCurrentAdminAccess } from "./admin-access-service";
import { AdminPageState } from "./components/admin-page-state";

interface AdminAccessContextValue {
  access: AdminAccess | null;
  loading: boolean;
  error: unknown;
  refreshing: boolean;
  refresh: () => void;
  can: (resource: string, action: string) => boolean;
}
const AdminAccessContext = createContext<AdminAccessContextValue | null>(null);

/** Admin cache is memory-only and belongs to one mounted, authenticated actor.
 * Login/token stores and learner query defaults are deliberately unchanged.
 */
export function AdminSessionScope({ children }: { children: ReactNode }) {
  const actorId = useAuthStore((s) => s.user?.id);
  const token = useAuthStore((s) => s.accessToken);
  if (!actorId || !token) return <AdminPageState state="error" title="Không thể xác định tài khoản" description="Vui lòng đăng nhập lại để xác minh tài khoản quản trị." />;
  return <ScopedAdminQueries key={actorId}>{children}</ScopedAdminQueries>;
}

function ScopedAdminQueries({ children }: { children: ReactNode }) {
  const [client] = useState(() => {
    const mutationCache = new MutationCache({ onSuccess: () => {
      void scoped.invalidateQueries({ queryKey: ["admin", "current-access"] });
      void scoped.invalidateQueries({ queryKey: ["admin", "capabilities"] });
    } });
    const scoped = new QueryClient({ mutationCache, defaultOptions: {
      queries: { staleTime: 30_000, retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    } });
    return scoped;
  });
  useEffect(() => () => {
    void client.cancelQueries();
    client.clear();
  }, [client]);
  return <QueryClientProvider client={client}><CurrentAdminAccess>{children}</CurrentAdminAccess></QueryClientProvider>;
}

function CurrentAdminAccess({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.accessToken);
  const query = useQuery({
    queryKey: ["admin", "current-access", user?.id],
    queryFn: ({ signal }) => fetchCurrentAdminAccess(user ?? {}, signal),
    enabled: Boolean(user?.id && token),
    staleTime: 0,
    refetchOnMount: "always",
    retry: false,
    refetchOnWindowFocus: true,
  });
  const source=useMemo(()=>getAdminCapabilitySource(user?.id??""),[user?.id]);
  const capabilities=useQuery({
    queryKey:["admin","capabilities",user?.id],
    queryFn:async({signal})=>{
      const before=useAuthStore.getState();
      if(!source||!token||before.user?.id!==user?.id||before.accessToken!==token||source.actorId!==user?.id)throw new Error("Tài khoản quản trị đã thay đổi.");
      const grant=await source.read(signal),after=useAuthStore.getState();
      if(after.user?.id!==user?.id||after.accessToken!==token||!validCapabilityGrant(grant,user?.id??""))throw new Error("Chưa xác minh được quyền quản trị hiện tại.");
      // Credential binding is memory-only and never a query key, log or persisted field.
      return {grant,tokenAtRead:token};
    },enabled:Boolean(source&&query.isSuccess&&token),retry:false,staleTime:0,gcTime:0,refetchOnWindowFocus:true,
  });
  const refetch=query.refetch,refetchCapabilities=capabilities.refetch,previousToken=useRef(token);
  const error=query.error||(source?capabilities.error:null);
  const status=error&&typeof error==="object"&&"status" in error?error.status:undefined;
  const bound=!source||Boolean(capabilities.data&&capabilities.data.tokenAtRead===token&&validCapabilityGrant(capabilities.data.grant,user?.id??""));
  const access=useMemo(()=>{
    const current=restrictAdminAccess(status===401||status===403?null:query.data??null,user);
    if(!current||source&&(!bound||capabilities.isError))return null;
    return source&&capabilities.data?{...current,capabilities:capabilities.data.grant}:current;
  },[query.data,status,user,source,bound,capabilities.isError,capabilities.data]);
  useEffect(()=>{if(token&&previousToken.current!==token){void refetch();if(source)void refetchCapabilities();}previousToken.current=token;},[token,refetch,refetchCapabilities,source]);
  useEffect(()=>{
    if(!source||!capabilities.data)return;
    const remaining=Date.parse(capabilities.data.grant.expiresAt)-Date.now();
    const timer=setTimeout(()=>void refetchCapabilities(),Math.max(0,Math.min(remaining,2147483647)));
    return()=>clearTimeout(timer);
  },[source,capabilities.data,refetchCapabilities]);
  const value=useMemo<AdminAccessContextValue>(()=>({
    access,loading:query.isPending||Boolean(source&&!error&&(!bound||capabilities.isPending)),error,
    refreshing:query.isFetching||Boolean(source&&capabilities.isFetching),
    refresh:()=>{void refetch();if(source)void refetchCapabilities();},
    can:(resource,action)=>!error&&canAdmin(access,resource,action),
  }),[access,query.isPending,query.isFetching,source,error,bound,capabilities.isPending,capabilities.isFetching,refetch,refetchCapabilities]);
  return <AdminAccessContext.Provider value={value}>{children}</AdminAccessContext.Provider>;
}

export function useAdminAccess() {
  const context = useContext(AdminAccessContext);
  if (!context) throw new Error("useAdminAccess cần được đặt trong AdminSessionScope.");
  return context;
}

export function AdminCan({ resource, action, children, fallback = null }: {
  resource: string; action: string; children: ReactNode; fallback?: ReactNode;
}) {
  const { can } = useAdminAccess();
  return can(resource, action) ? children : fallback;
}
