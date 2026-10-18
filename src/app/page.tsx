"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bike,
  CarFront,
  Check,
  CircleUserRound,
  Clock3,
  FileText,
  LogOut,
  ShieldCheck,
  Truck,
  UserRound,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LICENSE_GROUPS,
  getLicensesByGroup,
  mapLicenseCatalogToOptions,
  type LicenseGroupId,
  type LicenseOption,
} from "@/config/license";
import { fetchMe } from "@/features/auth/auth-service";
import { useLogout } from "@/features/auth/use-auth";
import {
  useLicenseCatalog,
  useUpdateCurrentLicense,
} from "@/features/license/use-license";
import type { IdentitySchemas } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  isAdminSelector,
  useAuthStore,
  useHasHydrated,
} from "@/stores/auth-store";
import {
  useLicenseHasHydrated,
  useLicenseStore,
} from "@/stores/license-store";

const GROUP_ICONS = {
  motorcycle: Bike,
  car: CarFront,
  trailer: Truck,
} satisfies Record<LicenseGroupId, typeof Bike>;

const GROUP_DESCRIPTIONS: Record<LicenseGroupId, string> = {
  motorcycle: "Xe mô tô hai bánh & ba bánh",
  car: "Xe du lịch, tải & chở người",
  trailer: "Đầu kéo & rơ moóc",
};

function getProfileSelectedLicenseClass(
  profile: IdentitySchemas["UserResponse"]
): string | null | undefined {
  if (!("selectedLicenseClass" in profile)) {
    return undefined;
  }

  const value = profile.selectedLicenseClass;

  if (value === null || typeof value === "string") {
    return value;
  }

  return undefined;
}

export default function Home() {
  const router = useRouter();

  const authHydrated = useHasHydrated();
  const licenseHydrated = useLicenseHasHydrated();

  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const isAdmin = useAuthStore(isAdminSelector);

  const setSelectedLicense = useLicenseStore(
    (state) => state.setSelectedLicense
  );

  const clearSelectedLicense = useLicenseStore(
    (state) => state.clearSelectedLicense
  );

  const updateLicenseMutation = useUpdateCurrentLicense();
  const logoutMutation = useLogout();

  const isSaving = updateLicenseMutation.isPending;

  // Chỉ cho phép chọn hạng khi Identity xác nhận tài khoản chưa chọn hạng.
  const [profileVerification, setProfileVerification] = useState<{
    username: string;
    token: string;
    status: "ready" | "error";
  } | null>(null);

  const [verifyAttempt, setVerifyAttempt] = useState(0);

  const username = user?.username;

  const isCurrentVerification =
    profileVerification?.username === username &&
    profileVerification?.token === accessToken;

  const isProfileReady =
    isCurrentVerification &&
    profileVerification?.status === "ready";

  const isProfileError =
    isCurrentVerification &&
    profileVerification?.status === "error";

  const displayName =
    user?.fullName?.trim() ||
    user?.username ||
    "Tài khoản";

  useEffect(() => {
    if (!authHydrated || !licenseHydrated) return;

    if (!accessToken || !username) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    void fetchMe()
      .then((profile) => {
        if (cancelled) return;

        const resolvedLicense =
          getProfileSelectedLicenseClass(profile);

        if (resolvedLicense === undefined) {
          setProfileVerification({
            username,
            token: accessToken,
            status: "error",
          });
          return;
        }

        const authState = useAuthStore.getState();

        if (
          !authState.accessToken ||
          authState.user?.username !== username
        ) {
          return;
        }

        // Giữ các trường hồ sơ mới nhất đang có trong auth-store.
        authState.setUser({
          ...authState.user,
          selectedLicenseClass: resolvedLicense,
        });

        if (resolvedLicense) {
          // Identity đã lưu một hạng GPLX:
          // đồng bộ cache rồi chuyển đến màn luyện tập.
          setSelectedLicense(resolvedLicense);
          router.replace("/practice");
          return;
        }

        // Identity xác nhận user chưa chọn GPLX.
        clearSelectedLicense();

        setProfileVerification({
          username,
          token: accessToken,
          status: "ready",
        });
      })
      .catch(() => {
        if (cancelled) return;

        // Nếu interceptor đã xóa phiên đăng nhập
        // vì refresh token thất bại thì quay về login.
        if (!useAuthStore.getState().accessToken) {
          router.replace("/login");
          return;
        }

        // Lỗi mạng/API tạm thời: giữ phiên đăng nhập,
        // không xóa hạng và cho phép thử lại.
        setProfileVerification({
          username,
          token: accessToken,
          status: "error",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [
    accessToken,
    authHydrated,
    clearSelectedLicense,
    licenseHydrated,
    router,
    setSelectedLicense,
    username,
    verifyAttempt,
  ]);

  function handleSelectLicense(code: string) {
    if (isSaving) return;

    updateLicenseMutation.mutate(
      {
        licenseClass: code,
      },
      {
        onSuccess: () => {
          router.replace("/practice");
          router.refresh();
        },
      }
    );
  }

  // Không hiển thị Screen 01 trước khi xác nhận với Identity.
  if (
    !authHydrated ||
    !licenseHydrated ||
    !accessToken ||
    !user ||
    (!isProfileReady && !isProfileError) ||
    (isProfileReady && user.selectedLicenseClass !== null)
  ) {
    return null;
  }

  return (
    <div className="font-dts flex min-h-screen flex-col bg-[#f8f8fc] text-[#172033]">
      <header className="border-b border-[#e3e7ee] bg-white">
        <div className="flex h-[66px] w-full items-center justify-between pl-6 pr-2 lg:pl-8 lg:pr-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-[10px] bg-[#0758d9] text-white">
              <CarFront
                className="size-[18px]"
                strokeWidth={2.3}
              />
            </div>

            <div className="leading-tight">
              <div className="text-[17px] font-bold text-[#101828]">
                DTS
              </div>

              <div className="text-[11.5px] font-semibold text-[#0758d9]">
                Lái xe
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-[10px] py-1.5 pl-2 pr-0 outline-none transition hover:bg-[#f5f7fa]">
              <span className="hidden max-w-[150px] truncate text-[14px] font-semibold text-[#1d2939] sm:block">
                {displayName}
              </span>

              <span className="flex size-9 items-center justify-center rounded-full bg-[#0758d9] text-white">
                <CircleUserRound
                  className="size-[20px]"
                  strokeWidth={2.1}
                />
              </span>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="font-dts w-60"
            >
              <DropdownMenuLabel>
                <div className="space-y-1">
                  <div className="font-semibold text-[#101828]">
                    {displayName}
                  </div>

                  {user.email && (
                    <div className="truncate text-xs font-normal text-muted-foreground">
                      {user.email}
                    </div>
                  )}
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onSelect={() => router.push("/profile")}
                className="cursor-pointer"
              >
                <UserRound className="size-4" />
                Hồ sơ
              </DropdownMenuItem>

              {isAdmin && (
                <>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onSelect={() => router.push("/admin")}
                    className="cursor-pointer"
                  >
                    <ShieldCheck className="size-4" />
                    Quản trị hệ thống
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                disabled={logoutMutation.isPending}
                onSelect={() => logoutMutation.mutate()}
                className="cursor-pointer"
              >
                <LogOut className="size-4" />

                {logoutMutation.isPending
                  ? "Đang đăng xuất..."
                  : "Đăng xuất"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1240px] flex-1 px-6 pb-12 pt-9">
        <section className="mx-auto max-w-[680px] text-center">
          <h1 className="text-[30px] font-bold tracking-[-0.025em] text-[#101828] md:text-[32px]">
            Chọn hạng giấy phép lái xe
          </h1>

          <p className="mx-auto mt-3 max-w-[610px] text-[15px] font-medium leading-6 text-[#475467]">
            Chọn hạng GPLX bạn đang học để DTS hiển thị đúng bộ câu hỏi,
            tiến độ và nội dung luyện tập phù hợp.
          </p>
        </section>

        {isProfileError ? (
          <section className="mt-10 text-center">
            <p className="text-[14.5px] font-medium text-[#475467]">
              Không thể xác nhận hạng GPLX từ Identity. Vui lòng thử lại.
            </p>

            <button
              type="button"
              onClick={() => {
                setProfileVerification(null);
                setVerifyAttempt((current) => current + 1);
              }}
              className="mt-4 inline-flex h-10 items-center justify-center rounded-[10px] bg-[#0758d9] px-6 text-[14px] font-semibold text-white transition hover:bg-[#064fc3]"
            >
              Thử lại
            </button>
          </section>
        ) : (
          <LicenseCatalogSections
            isSaving={isSaving}
            onSelectLicense={handleSelectLicense}
          />
        )}
      </main>

      <footer className="w-full border-t border-[#dde2ea] bg-[#F2F3FF]">
        <div className="mx-auto flex min-h-[68px] w-full max-w-[1480px] flex-col gap-4 px-6 py-4 text-[14px] font-medium text-[#344054] sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="flex size-6 items-center justify-center rounded-[6px] bg-[#0758d9] text-white">
                <CarFront
                  className="size-3.5"
                  strokeWidth={2.3}
                />
              </span>

              <span className="font-semibold text-[#101828]">
                DTS Lái xe
              </span>
            </div>

            <span className="hidden h-4 w-px bg-[#cfd5df] sm:block" />

            <span className="text-[#667085]">
              © {new Date().getFullYear()} Nền tảng ôn thi sát hạch lái xe.
            </span>
          </div>

          <nav
            aria-label="Liên kết cuối trang"
            className="flex items-center gap-5 whitespace-nowrap sm:ml-auto md:gap-6 lg:gap-7"
          >
            <span className="cursor-pointer transition hover:text-[#0758d9]">
              Quy chế
            </span>

            <span className="text-[#b8bfca]">·</span>

            <span className="cursor-pointer transition hover:text-[#0758d9]">
              Hướng dẫn
            </span>

            <span className="text-[#b8bfca]">·</span>

            <span className="cursor-pointer transition hover:text-[#0758d9]">
              Hỗ trợ
            </span>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/**
 * Component danh mục chỉ được mount sau khi Identity
 * xác nhận user chưa chọn hạng GPLX.
 */
function LicenseCatalogSections({
  isSaving,
  onSelectLicense,
}: {
  isSaving: boolean;
  onSelectLicense: (code: string) => void;
}) {
  const catalog = useLicenseCatalog();

  const [activeGroup, setActiveGroup] =
    useState<LicenseGroupId>("motorcycle");

  const { options, validCatalog } = useMemo(() => {
    const empty: LicenseOption[] = [];

    if (!catalog.data) {
      return {
        options: empty,
        validCatalog: false,
      };
    }

    try {
      if (
        !Array.isArray(catalog.data) ||
        catalog.data.length !== 15
      ) {
        throw new Error("Invalid license catalog length");
      }

      const mapped = mapLicenseCatalogToOptions(
        catalog.data
      );

      if (
        new Set(mapped.map((item) => item.code)).size !== 15 ||
        mapped.some(
          (item) =>
            !item.code ||
            !item.title ||
            !item.description ||
            !Number.isFinite(item.exam.totalQuestions) ||
            !Number.isFinite(item.exam.durationMinutes) ||
            typeof item.bankCountsMatch !== "boolean" ||
            typeof item.examAvailable !== "boolean"
        )
      ) {
        throw new Error("Invalid license catalog items");
      }

      return {
        options: mapped,
        validCatalog: true,
      };
    } catch {
      return {
        options: empty,
        validCatalog: false,
      };
    }
  }, [catalog.data]);

  const isCatalogReady =
    catalog.isSuccess && validCatalog;

  const licenses = useMemo(
    () => getLicensesByGroup(activeGroup, options),
    [activeGroup, options]
  );

  const activeGroupLabel =
    LICENSE_GROUPS.find(
      (group) => group.id === activeGroup
    )?.label ?? "";

  return (
    <>
      <section className="mt-10">
        <h2 className="text-[22px] font-bold text-[#101828]">
          Chọn nhóm phương tiện
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {LICENSE_GROUPS.map((group) => {
            const Icon = GROUP_ICONS[group.id];
            const active = activeGroup === group.id;

            const groupLicenses = getLicensesByGroup(
              group.id,
              options
            );

            return (
              <button
                key={group.id}
                type="button"
                disabled={isSaving || !isCatalogReady}
                onClick={() => setActiveGroup(group.id)}
                aria-pressed={active}
                className={cn(
                  "relative flex min-h-[184px] w-full flex-col rounded-[16px] border bg-white p-5 text-left shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition duration-200 disabled:pointer-events-none disabled:opacity-60",
                  active
                    ? "border-[#0758d9] bg-[#f5f7ff] ring-1 ring-[#0758d9]/10"
                    : "border-[#d9dee8] hover:border-[#aab7ca]"
                )}
              >
                {/* Tầng 1: Icon, tên nhóm và mô tả. */}
                <div className="flex w-full items-start gap-4 pr-7">
                  <span
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-[12px]",
                      active
                        ? "bg-[#e5ecff] text-[#0758d9]"
                        : "bg-[#f1f3f7] text-[#536075]"
                    )}
                  >
                    <Icon
                      className="size-[22px]"
                      strokeWidth={2.1}
                    />
                  </span>

                  <div className="min-w-0 pt-0.5">
                    <div className="text-[17px] font-bold text-[#101828]">
                      {group.label}
                    </div>

                    <div
                      className={cn(
                        "mt-1 text-[14px] font-medium",
                        active
                          ? "text-[#0758d9]"
                          : "text-[#475467]"
                      )}
                    >
                      {active
                        ? "Đang chọn"
                        : GROUP_DESCRIPTIONS[group.id]}
                    </div>
                  </div>
                </div>

                {active && (
                  <span className="absolute right-4 top-4 flex size-6 items-center justify-center rounded-full bg-[#0758d9] text-white">
                    <Check
                      className="size-3.5"
                      strokeWidth={3}
                    />
                  </span>
                )}

                {/* Tầng 2: Danh sách hạng, nằm dưới và căn đáy card. */}
                <div className="mt-auto flex w-full flex-wrap items-center gap-1.5 pt-5">
                  <span className="mr-1 text-[14px] font-medium text-[#475467]">
                    Gồm các hạng:
                  </span>

                  {isCatalogReady ? (
                    groupLicenses.map((license) => (
                      <span
                        key={license.code}
                        className={cn(
                          "rounded-md px-2 py-1 text-[12px] font-semibold",
                          active
                            ? "bg-[#e5e9ff] text-[#344054]"
                            : "bg-[#f0f2f6] text-[#475467]"
                        )}
                      >
                        {license.code}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-md px-2 py-1 text-[12px] font-semibold text-[#475467]">
                      {catalog.isPending
                        ? "Đang tải..."
                        : "Chưa có dữ liệu"}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <div>
          <h2 className="text-[26px] font-bold tracking-[-0.015em] text-[#101828]">
            Chọn hạng GPLX
          </h2>

          <p className="mt-1 text-[14.5px] font-medium text-[#475467]">
            Các hạng thuộc nhóm {activeGroupLabel}
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {catalog.isPending ? (
            <p className="text-[14.5px] font-medium text-[#475467]">
              Đang tải danh mục GPLX từ máy chủ...
            </p>
          ) : !isCatalogReady ? (
            <div className="text-[14.5px] font-medium text-[#475467]">
              <p>
                Không thể tải danh mục GPLX. Vui lòng thử lại.
              </p>

              <button
                type="button"
                onClick={() => void catalog.refetch()}
                disabled={catalog.isFetching}
                className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#0758d9] px-6 text-[14px] font-semibold text-white transition hover:bg-[#064fc3] disabled:pointer-events-none disabled:bg-[#98a2b3]"
              >
                {catalog.isFetching
                  ? "Đang tải lại..."
                  : "Thử lại"}
              </button>
            </div>
          ) : (
            licenses.map((license) => (
              <article
                key={license.code}
                className="flex min-h-[310px] flex-col rounded-[16px] border border-[#d9dee8] bg-white p-5 shadow-[0_2px_6px_rgba(15,23,42,0.035)]"
              >
                <div className="flex size-10 items-center justify-center rounded-[10px] bg-[#0758d9] text-[16px] font-bold text-white shadow-[0_3px_7px_rgba(7,88,217,0.16)]">
                  {license.code}
                </div>

                <h3 className="mt-4 text-[19px] font-bold leading-snug text-[#101828]">
                  {license.title ?? `Hạng ${license.code}`}
                </h3>

                <p className="mt-2 text-[15px] font-medium leading-[1.65] text-[#475467]">
                  {license.description}
                </p>

                <div className="mt-auto pt-5">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13.5px] font-medium text-[#475467]">
                    <span className="inline-flex items-center gap-1.5">
                      <FileText
                        className="size-4 text-[#0758d9]"
                        strokeWidth={2.1}
                      />
                      {license.exam.totalQuestions} câu
                    </span>

                    <span className="text-[#98a2b3]">·</span>

                    <span className="inline-flex items-center gap-1.5">
                      <Clock3
                        className="size-4 text-[#0758d9]"
                        strokeWidth={2.1}
                      />
                      {license.exam.durationMinutes} phút
                    </span>
                  </div>

                  <div className="mt-4 flex justify-center border-t border-[#eaecf0] pt-4">
                    <button
                      type="button"
                      disabled={
                        isSaving ||
                        !license.bankCountsMatch ||
                        !license.examAvailable
                      }
                      onClick={() =>
                        onSelectLicense(license.code)
                      }
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#0758d9] px-6 text-[14px] font-semibold text-white transition hover:bg-[#064fc3] active:translate-y-px disabled:pointer-events-none disabled:bg-[#98a2b3]"
                    >
                      {isSaving
                        ? "Đang lưu..."
                        : !license.bankCountsMatch ||
                            !license.examAvailable
                          ? "Chưa sẵn sàng"
                          : `Chọn hạng ${license.code}`}

                      {!isSaving &&
                        license.bankCountsMatch &&
                        license.examAvailable && (
                          <ArrowRight
                            className="size-4"
                            strokeWidth={2.2}
                          />
                        )}
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </>
  );
}
