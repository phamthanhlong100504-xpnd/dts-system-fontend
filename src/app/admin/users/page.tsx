"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  KeyRound,
  Lock,
  LockOpen,
  MoreHorizontal,
  Search,
  Trash2,
  UserPlus,
} from "lucide-react";
import { RequireAdmin } from "@/components/require-admin";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useAssignRole,
  useCreateUser,
  useDeleteUser,
  useRevokeRole,
  useRoles,
  useUpdateUserStatus,
  useUserRoles,
  useUsers,
} from "@/features/admin/use-admin";
import type { IdentitySchemas } from "@/lib/api";

type UserResponse = IdentitySchemas["UserResponse"];
type RoleResponse = IdentitySchemas["RoleResponse"];

const STATUS_FILTERS = [
  { key: "", label: "Tất cả" },
  { key: "ACTIVE", label: "Hoạt động" },
  { key: "LOCKED", label: "Đã khóa" },
];

function initialsOf(fullName?: string, username?: string): string {
  const source = fullName?.trim() || username?.trim() || "?";
  const parts = source.split(/\s+/);
  return (parts[0]?.[0] ?? "").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();
}

export default function AdminUsersPage() {
  return (
    <RequireAdmin>
      <UsersManager />
    </RequireAdmin>
  );
}

function UsersManager() {
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Debounce tìm kiếm 400ms
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const usersQuery = useUsers({ page, size: 10, search: search || undefined, status: status || undefined });

  const data = usersQuery.data;

  return (
    <div className="container py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Người dùng</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý tài khoản và phân quyền hệ thống
          </p>
        </div>
        <CreateUserSheet />
      </div>

      {/* Search + filter */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm kiếm người dùng..."
            className="h-11 pl-9"
          />
        </div>
        <div className="flex rounded-xl bg-muted p-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => {
                setStatus(f.key);
                setPage(0);
              }}
              className={cn(
                "flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all",
                status === f.key
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {usersQuery.isLoading && !data ? (
        <div className="space-y-2">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      ) : usersQuery.isError || !data ? (
        <p className="text-sm text-destructive">
          Không tải được danh sách người dùng. Kiểm tra service dts-identity.
        </p>
      ) : (
        <div className="rounded-2xl border border-border/50 bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Người dùng</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden lg:table-cell">Số điện thoại</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data.content ?? []).map((user) => (
                <TableRow key={user.id ?? user.username}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{initialsOf(user.fullName, user.username)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.fullName || user.username}</p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                  <TableCell className="hidden lg:table-cell">{user.phoneNumber ?? "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={user.status} />
                  </TableCell>
                  <TableCell>
                    <UserRowActions user={user} />
                  </TableCell>
                </TableRow>
              ))}
              {(data.content ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Không tìm thấy người dùng phù hợp
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {data && (data.totalPages ?? 0) > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={data.first}
          >
            Trang trước
          </Button>
          <span className="text-sm text-muted-foreground">
            Trang {(data.number ?? 0) + 1} / {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={data.last}
          >
            Trang sau
          </Button>
        </div>
      )}
    </div>
  );
}

/* ---------- Hành động theo dòng ---------- */

function UserRowActions({ user }: { user: UserResponse }) {
  const updateStatus = useUpdateUserStatus();
  const deleteUserMutation = useDeleteUser();
  const [assignOpen, setAssignOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Hành động">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {user.status === "LOCKED" ? (
            <DropdownMenuItem
              onClick={() => user.id && updateStatus.mutate({ id: user.id, status: "ACTIVE" })}
            >
              <LockOpen className="h-4 w-4" />
              Mở khóa tài khoản
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => user.id && updateStatus.mutate({ id: user.id, status: "LOCKED" })}
            >
              <Lock className="h-4 w-4" />
              Khóa tài khoản
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setAssignOpen(true)}>
            <KeyRound className="h-4 w-4" />
            Gán vai trò
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Xóa người dùng
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AssignRoleSheet
        user={user}
        open={assignOpen}
        onOpenChange={setAssignOpen}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa người dùng?</AlertDialogTitle>
            <AlertDialogDescription>
              Người dùng{" "}
              <span className="font-medium text-foreground">
                {user.fullName || user.username}
              </span>{" "}
              sẽ bị xóa (soft-delete). Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => user.id && deleteUserMutation.mutate(user.id)}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ---------- Gán vai trò ---------- */

function AssignRoleSheet({
  user,
  open,
  onOpenChange,
}: {
  user: UserResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: userRoles, isLoading } = useUserRoles(open ? user.id ?? null : null);
  const { data: allRoles } = useRoles();
  const assignRoleMutation = useAssignRole();
  const revokeRoleMutation = useRevokeRole();
  const [selectedRoleId, setSelectedRoleId] = useState("");

  const currentIds = new Set((userRoles ?? []).map((r) => r.id));
  const availableRoles = (allRoles ?? []).filter((r) => !currentIds.has(r.id));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Gán vai trò — {user.fullName || user.username}</SheetTitle>
          <SheetDescription>Quản lý vai trò của người dùng này</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4">
          <div>
            <p className="mb-2 text-sm font-medium">Vai trò hiện tại</p>
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (userRoles ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có vai trò nào.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(userRoles ?? []).map((role) => (
                  <span
                    key={role.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-sm"
                  >
                    {role.name}
                    <button
                      type="button"
                      aria-label={`Thu hồi ${role.name}`}
                      onClick={() =>
                        user.id && role.id && revokeRoleMutation.mutate({ userId: user.id, roleId: role.id })
                      }
                      className="text-muted-foreground hover:text-destructive"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-select">Thêm vai trò</Label>
            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
              <SelectTrigger id="role-select" className="h-11">
                <SelectValue placeholder="Chọn vai trò" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id ?? ""}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="w-full"
              disabled={!selectedRoleId || assignRoleMutation.isPending}
              onClick={() => {
                if (!user.id || !selectedRoleId) return;
                assignRoleMutation.mutate(
                  { userId: user.id, roleId: selectedRoleId },
                  { onSuccess: () => setSelectedRoleId("") }
                );
              }}
            >
              Gán vai trò
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ---------- Tạo người dùng ---------- */

const createUserSchema = z.object({
  username: z
    .string()
    .min(3, "Tên đăng nhập tối thiểu 3 ký tự")
    .max(20, "Tên đăng nhập tối đa 20 ký tự")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Chỉ được dùng chữ, số, dấu chấm, gạch dưới, gạch ngang"),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự").max(100, "Mật khẩu tối đa 100 ký tự"),
  fullName: z.string().min(1, "Vui lòng nhập họ tên").max(100, "Họ tên tối đa 100 ký tự"),
  birthOfDate: z.string().min(1, "Vui lòng chọn ngày sinh"),
  phoneNumber: z.string().min(1, "Vui lòng nhập số điện thoại").max(20, "Số điện thoại tối đa 20 ký tự"),
  roleId: z.string().optional(),
});

type CreateUserForm = z.infer<typeof createUserSchema>;

function CreateUserSheet() {
  const createUserMutation = useCreateUser();
  const { data: allRoles } = useRoles();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateUserForm>({ resolver: zodResolver(createUserSchema) });

  function onSubmit(values: CreateUserForm) {
    const { roleId, ...rest } = values;
    createUserMutation.mutate(
      { ...rest, roleIds: roleId ? [roleId] : undefined },
      { onSuccess: () => reset() }
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4" />
          Thêm người dùng
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Thêm người dùng mới</SheetTitle>
          <SheetDescription>Tạo tài khoản mới (không cần xác minh email)</SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4 overflow-y-auto px-4">
          <div className="space-y-2">
            <Label htmlFor="cu-username">Tên người dùng</Label>
            <Input id="cu-username" className="h-11" {...register("username")} />
            {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cu-email">Email</Label>
            <Input id="cu-email" type="email" className="h-11" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cu-fullName">Họ và tên</Label>
            <Input id="cu-fullName" className="h-11" {...register("fullName")} />
            {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cu-birthOfDate">Ngày sinh</Label>
              <Input id="cu-birthOfDate" type="date" className="h-11" {...register("birthOfDate")} />
              {errors.birthOfDate && <p className="text-sm text-destructive">{errors.birthOfDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cu-phoneNumber">Số điện thoại</Label>
              <Input id="cu-phoneNumber" type="tel" className="h-11" {...register("phoneNumber")} />
              {errors.phoneNumber && <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cu-password">Mật khẩu</Label>
            <Input id="cu-password" type="password" className="h-11" {...register("password")} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cu-role">Vai trò (không bắt buộc)</Label>
            <Select onValueChange={(v) => setValue("roleId", v)}>
              <SelectTrigger id="cu-role" className="h-11">
                <SelectValue placeholder="Chọn vai trò" />
              </SelectTrigger>
              <SelectContent>
                {(allRoles ?? []).map((role: RoleResponse) => (
                  <SelectItem key={role.id} value={role.id ?? ""}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <SheetFooter>
            <Button type="submit" disabled={createUserMutation.isPending}>
              {createUserMutation.isPending ? "Đang tạo..." : "Thêm người dùng"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
