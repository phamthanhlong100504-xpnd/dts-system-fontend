"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, Plus } from "lucide-react";
import { RequireAdmin } from "@/components/require-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  useCreatePermission,
  useCreateRole,
  usePermissions,
  useRoles,
  useToggleRolePermission,
} from "@/features/admin/use-admin";
import type { IdentitySchemas } from "@/lib/api";

type RoleResponse = IdentitySchemas["RoleResponse"];

function groupBy<T>(items: T[], key: (item: T) => string): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const k = key(item);
    (acc[k] ??= []).push(item);
    return acc;
  }, {});
}

export default function AdminRolesPage() {
  return (
    <RequireAdmin>
      <div className="container py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">
            Quản lý Vai trò & Quyền
          </h1>
          <p className="text-sm text-muted-foreground">
            Cấu hình vai trò và quyền hạn của hệ thống
          </p>
        </div>

        <Tabs defaultValue="roles">
          <TabsList>
            <TabsTrigger value="roles">Vai trò</TabsTrigger>
            <TabsTrigger value="permissions">Quyền hạn</TabsTrigger>
          </TabsList>
          <TabsContent value="roles" className="mt-6">
            <RolesTab />
          </TabsContent>
          <TabsContent value="permissions" className="mt-6">
            <PermissionsTab />
          </TabsContent>
        </Tabs>
      </div>
    </RequireAdmin>
  );
}

/* ---------------- Tab Vai trò ---------------- */

function RolesTab() {
  const { data: roles, isLoading, isError } = useRoles();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Derive từ query để sheet luôn phản ánh dữ liệu mới sau khi toggle quyền
  const selectedRole =
    (roles ?? []).find((r) => r.id === selectedId) ?? null;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <CreateRoleDialog />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      ) : isError || !roles ? (
        <p className="text-sm text-destructive">
          Không tải được danh sách vai trò. Kiểm tra service dts-identity.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => setSelectedId(role.id ?? null)}
              className="group text-left"
            >
              <div className="rounded-2xl border border-border/50 bg-card p-5 shadow-sm transition-colors group-hover:border-primary/50">
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="font-bold text-primary">{role.name}</h3>
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {role.permissions?.length ?? 0} quyền hạn
                </p>
              </div>
            </button>
          ))}
          {roles.length === 0 && (
            <p className="text-sm text-muted-foreground">Chưa có vai trò nào.</p>
          )}
        </div>
      )}

      <RoleDetailSheet
        role={selectedRole}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      />
    </div>
  );
}

function RoleDetailSheet({
  role,
  onOpenChange,
}: {
  role: RoleResponse | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: permissions } = usePermissions();
  const togglePermission = useToggleRolePermission();

  if (!role) return null;

  const rolePermNames = new Set(role.permissions ?? []);
  const grouped = groupBy(permissions ?? [], (p) => p.resource ?? "Khác");

  return (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{role.name}</SheetTitle>
          <SheetDescription>Cấu hình quyền hạn cho vai trò này</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-6 overflow-y-auto px-4">
          {Object.entries(grouped).map(([group, perms]) => (
            <div key={group}>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {group}
              </h4>
              <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                {perms.map((p) => (
                  <label
                    key={p.id}
                    className="flex cursor-pointer items-center justify-between p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.displayName}</p>
                    </div>
                    <Switch
                      checked={rolePermNames.has(p.name ?? "")}
                      onCheckedChange={(on) => {
                        if (!role.id || !p.id) return;
                        togglePermission.mutate({
                          roleId: role.id,
                          permissionId: p.id,
                          revoke: !on,
                        });
                      }}
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(grouped).length === 0 && (
            <p className="text-sm text-muted-foreground">Chưa có quyền hạn nào trong hệ thống.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ---------------- Tab Quyền hạn ---------------- */

function PermissionsTab() {
  const { data: permissions, isLoading, isError } = usePermissions();

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <CreatePermissionDialog />
      </div>

      {isLoading ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : isError || !permissions ? (
        <p className="text-sm text-destructive">
          Không tải được danh sách quyền hạn. Kiểm tra service dts-identity.
        </p>
      ) : (
        <div className="rounded-2xl border border-border/50 bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Hiển thị</TableHead>
                <TableHead>Resource</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.name}</TableCell>
                  <TableCell>{p.displayName}</TableCell>
                  <TableCell className="text-muted-foreground">{p.resource}</TableCell>
                </TableRow>
              ))}
              {permissions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                    Chưa có quyền hạn nào
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

/* ---------------- Tạo vai trò ---------------- */

const createRoleSchema = z.object({
  name: z.string().min(3, "Tên vai trò tối thiểu 3 ký tự").max(50, "Tên vai trò tối đa 50 ký tự"),
});

function CreateRoleDialog() {
  const createRoleMutation = useCreateRole();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<
    z.infer<typeof createRoleSchema>
  >({ resolver: zodResolver(createRoleSchema) });

  function onSubmit(values: z.infer<typeof createRoleSchema>) {
    createRoleMutation.mutate(values, { onSuccess: () => reset() });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Tạo vai trò
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo vai trò mới</DialogTitle>
          <DialogDescription>
            Nhập tên vai trò (ví dụ: ROLE_TEACHER)
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role-name">Tên vai trò</Label>
            <Input id="role-name" className="h-11" placeholder="ROLE_TEACHER" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createRoleMutation.isPending}>
              {createRoleMutation.isPending ? "Đang tạo..." : "Tạo vai trò"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Tạo quyền hạn ---------------- */

const createPermissionSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên quyền").max(100, "Tối đa 100 ký tự"),
  displayName: z.string().min(1, "Vui lòng nhập tên hiển thị").max(100, "Tối đa 100 ký tự"),
  resource: z.string().min(1, "Vui lòng nhập resource").max(50, "Tối đa 50 ký tự"),
});

function CreatePermissionDialog() {
  const createPermissionMutation = useCreatePermission();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<
    z.infer<typeof createPermissionSchema>
  >({ resolver: zodResolver(createPermissionSchema) });

  function onSubmit(values: z.infer<typeof createPermissionSchema>) {
    createPermissionMutation.mutate(values, { onSuccess: () => reset() });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4" />
          Tạo quyền hạn
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo quyền hạn mới</DialogTitle>
          <DialogDescription>Định nghĩa một quyền hạn trong hệ thống</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="perm-name">Tên quyền</Label>
            <Input id="perm-name" className="h-11" placeholder="courses:read" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="perm-display">Tên hiển thị</Label>
            <Input id="perm-display" className="h-11" placeholder="Read Courses" {...register("displayName")} />
            {errors.displayName && <p className="text-sm text-destructive">{errors.displayName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="perm-resource">Resource</Label>
            <Input id="perm-resource" className="h-11" placeholder="courses" {...register("resource")} />
            {errors.resource && <p className="text-sm text-destructive">{errors.resource.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createPermissionMutation.isPending}>
              {createPermissionMutation.isPending ? "Đang tạo..." : "Tạo quyền hạn"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
