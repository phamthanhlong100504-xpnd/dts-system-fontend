
"use client";

import { useMemo, useState } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import {
  Bike,
  CarFront,
  Check,
  Circle,
  Info,
  Truck,
  X,
} from "lucide-react";

import {
  LICENSE_GROUPS,
  getLicenseByCode,
  getLicensesByGroup,
  mapLicenseCatalogToOptions,
  type LicenseGroupId,
  type LicenseOption,
} from "@/config/license";

import {
  useLicenseCatalog,
  useUpdateCurrentLicense,
} from "@/features/license/use-license";

import { cn } from "@/lib/utils";
import { useLicenseStore } from "@/stores/license-store";

interface LicenseSwitcherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LicenseSwitcherContentProps {
  onOpenChange: (open: boolean) => void;
}

export function LicenseSwitcherDialog({
  open,
  onOpenChange,
}: LicenseSwitcherDialogProps) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
    >
      {open && (
        <LicenseSwitcherDialogContent
          onOpenChange={onOpenChange}
        />
      )}
    </DialogPrimitive.Root>
  );
}

function LicenseSwitcherDialogContent({
  onOpenChange,
}: LicenseSwitcherContentProps) {
  const selectedLicense = useLicenseStore(
    (state) => state.selectedLicense
  );

  const catalog = useLicenseCatalog();
  const updateLicenseMutation =
    useUpdateCurrentLicense();

  const isSaving = updateLicenseMutation.isPending;

  // Danh mục hạng GPLX lấy từ Practice backend.
  // Không sử dụng dữ liệu giả khi API lỗi.
  const catalogOptions = useMemo<
    LicenseOption[] | null
  >(() => {
    if (
      !Array.isArray(catalog.data) ||
      catalog.data.length !== 15
    ) {
      return null;
    }

    try {
      const options =
        mapLicenseCatalogToOptions(catalog.data);

      const groups: Record<LicenseGroupId, number> = {
        motorcycle: 0,
        car: 0,
        trailer: 0,
      };

      for (const option of options) {
        if (
          !option.code ||
          !option.title ||
          !option.description ||
          typeof option.bankCountsMatch !== "boolean" ||
          typeof option.examAvailable !== "boolean"
        ) {
          return null;
        }

        groups[option.group] += 1;
      }

      if (
        new Set(
          options.map((option) => option.code)
        ).size !== 15 ||
        groups.motorcycle !== 3 ||
        groups.car !== 6 ||
        groups.trailer !== 6
      ) {
        return null;
      }

      return options;
    } catch {
      return null;
    }
  }, [catalog.data]);

  const isCatalogReady =
    catalog.isSuccess &&
    catalogOptions !== null;

  const options = catalogOptions ?? [];

  const currentLicense = getLicenseByCode(
    selectedLicense,
    options
  );

  // Nhóm mặc định là nhóm của hạng đang học.
  const [chosenGroup, setChosenGroup] =
    useState<LicenseGroupId | null>(null);

  const activeGroup =
    chosenGroup ??
    currentLicense?.group ??
    "motorcycle";

  const [pendingLicense, setPendingLicense] =
    useState(selectedLicense ?? "");

  const groupLicenses = getLicensesByGroup(
    activeGroup,
    options
  );

  const pendingOption = getLicenseByCode(
    pendingLicense,
    options
  );

  const changed =
    Boolean(pendingLicense) &&
    pendingLicense !== selectedLicense;

  const canConfirm =
    isCatalogReady &&
    changed &&
    !isSaving &&
    pendingOption?.bankCountsMatch === true &&
    pendingOption?.examAvailable === true;

  function handleGroupChange(
    group: LicenseGroupId
  ) {
    if (isSaving || !isCatalogReady) return;

    setChosenGroup(group);

    // Chỉ giữ hạng đang sử dụng khi quay về
    // đúng nhóm chứa hạng đó.
    // Không tự động chọn một hạng khác.
    if (
      currentLicense?.group === group &&
      selectedLicense
    ) {
      setPendingLicense(selectedLicense);
      return;
    }

    setPendingLicense("");
  }

  function handleLicenseSelect(
    licenseCode: string
  ) {
    if (isSaving || !isCatalogReady) return;

    const option = getLicenseByCode(
      licenseCode,
      options
    );

    if (
      !option?.bankCountsMatch ||
      !option.examAvailable
    ) {
      return;
    }

    setPendingLicense(licenseCode);
  }

  function handleCancel() {
    if (isSaving) return;

    onOpenChange(false);
  }

  function handleConfirm() {
    if (!canConfirm) return;

    updateLicenseMutation.mutate(
      {
        licenseClass: pendingLicense,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  }

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className="fixed inset-0 z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
      />

      <DialogPrimitive.Content
        aria-busy={isSaving}
        onEscapeKeyDown={(event) => {
          if (isSaving) {
            event.preventDefault();
          }
        }}
        onPointerDownOutside={(event) => {
          if (isSaving) {
            event.preventDefault();
          }
        }}
        className={cn(
          "font-dts fixed left-1/2 top-1/2 z-50",
          "flex max-h-[calc(100dvh-32px)]",
          "w-[760px] max-w-[calc(100vw-32px)]",
          "-translate-x-1/2 -translate-y-1/2",
          "flex-col overflow-hidden",
          "rounded-[16px] border border-[#e3e7ee]",
          "bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]",
          "outline-none",
          "data-[state=closed]:animate-out",
          "data-[state=closed]:fade-out-0",
          "data-[state=closed]:zoom-out-95",
          "data-[state=open]:animate-in",
          "data-[state=open]:fade-in-0",
          "data-[state=open]:zoom-in-95"
        )}
      >
        {/* HEADER MODAL */}
        <div className="flex shrink-0 items-start justify-between gap-4 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
          <div>
            <DialogPrimitive.Title
              className="text-[20px] font-bold leading-7 text-[#101828]"
            >
              Đổi hạng GPLX
            </DialogPrimitive.Title>

            <DialogPrimitive.Description
              className="mt-2 text-[14px] font-medium leading-6 text-[#667085]"
            >
              Nội dung ôn luyện, tiến độ và kết quả
              sẽ được hiển thị theo hạng bạn chọn.
            </DialogPrimitive.Description>
          </div>

          <button
            type="button"
            aria-label="Đóng"
            onClick={handleCancel}
            disabled={isSaving}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f2f4f7] text-[#667085] transition hover:bg-[#e9edf3] hover:text-[#101828] disabled:pointer-events-none disabled:opacity-50"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* NỘI DUNG MODAL - CÓ THỂ CUỘN */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 pt-1 sm:px-6">
          <SectionLabel>
            NHÓM PHƯƠNG TIỆN
          </SectionLabel>

          {/* DANH SÁCH NHÓM */}
          <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
            {LICENSE_GROUPS.map((group) => {
              const active =
                activeGroup === group.id;

              return (
                <button
                  key={group.id}
                  type="button"
                  disabled={
                    isSaving ||
                    !isCatalogReady
                  }
                  onClick={() =>
                    handleGroupChange(group.id)
                  }
                  className={cn(
                    "flex min-h-12 items-center justify-center gap-2 rounded-[10px] border px-2 py-2 text-center text-[13px] font-semibold leading-5 transition disabled:pointer-events-none disabled:opacity-60",
                    active
                      ? "border-[#dce5ff] bg-[#eef3ff] text-[#0758d9]"
                      : "border-transparent bg-[#f6f7fb] text-[#667085] hover:bg-[#eef1f7] hover:text-[#344054]"
                  )}
                >
                  <GroupIcon group={group.id} />
                  {group.label}
                </button>
              );
            })}
          </div>

          {/* TIÊU ĐỀ DANH SÁCH HẠNG */}
          <div className="mt-5 flex items-start justify-between gap-3">
            <SectionLabel>
              DANH SÁCH HẠNG GPLX THUỘC NHÓM{" "}
              {LICENSE_GROUPS.find(
                (group) =>
                  group.id === activeGroup
              )?.label.toUpperCase()}
            </SectionLabel>

            <span className="shrink-0 text-right text-[12px] font-medium leading-5 text-[#667085]">
              {groupLicenses.length} hạng giấy phép
            </span>
          </div>

          {/* DANH SÁCH CARD GPLX */}
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {catalog.isPending ? (
              <p className="text-[13px] font-medium text-[#667085] sm:col-span-2 md:col-span-3">
                Đang tải danh mục GPLX...
              </p>
            ) : !isCatalogReady ? (
              <div className="sm:col-span-2 md:col-span-3">
                <p className="text-[13px] font-medium text-[#667085]">
                  Không thể tải danh mục GPLX.
                  Vui lòng thử lại.
                </p>

                <button
                  type="button"
                  disabled={catalog.isFetching}
                  onClick={() =>
                    void catalog.refetch()
                  }
                  className="mt-3 text-[13px] font-semibold text-[#0758d9] disabled:opacity-50"
                >
                  {catalog.isFetching
                    ? "Đang tải lại..."
                    : "Thử lại"}
                </button>
              </div>
            ) : (
              groupLicenses.map((license) => {
                const current =
                  license.code === selectedLicense;

                const selected =
                  Boolean(pendingLicense) &&
                  license.code === pendingLicense;

                return (
                  <button
                    key={license.code}
                    type="button"
                    disabled={
                      isSaving ||
                      !license.bankCountsMatch ||
                      !license.examAvailable
                    }
                    onClick={() =>
                      handleLicenseSelect(
                        license.code
                      )
                    }
                    className={cn(
                      "relative min-h-[180px] rounded-[11px] border bg-white p-4 text-left transition disabled:pointer-events-none disabled:opacity-60",
                      selected
                        ? "border-[#0758d9] bg-[#f8faff] shadow-[0_0_0_1px_rgba(7,88,217,0.04)]"
                        : "border-[#e5e8ee] hover:border-[#b9c9f7] hover:bg-[#fbfcff]"
                    )}
                  >
                    {/* MÃ HẠNG VÀ TRẠNG THÁI */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            "rounded-[6px] px-2 py-1 text-[12px] font-bold",
                            selected
                              ? "bg-[#0758d9] text-white"
                              : "bg-[#eef2f7] text-[#475467]"
                          )}
                        >
                          {license.code}
                        </span>

                        {current && (
                          <span className="rounded-full bg-[#eef3ff] px-2 py-1 text-[11px] font-semibold text-[#0758d9]">
                            Hạng hiện tại
                          </span>
                        )}
                      </div>

                      {selected ? (
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#0758d9] text-white">
                          <Check
                            className="size-3"
                            strokeWidth={3}
                          />
                        </span>
                      ) : (
                        <Circle
                          className="size-5 shrink-0 text-[#d0d5dd]"
                          strokeWidth={1.7}
                        />
                      )}
                    </div>

                    {/* TÊN HẠNG */}
                    <p className="mt-3 text-[14px] font-bold leading-5 text-[#101828]">
                      {license.title ??
                        `Hạng ${license.code}`}
                    </p>

                    {/* MÔ TẢ HẠNG */}
                    <p className="mt-2 line-clamp-4 text-[13px] font-medium leading-5 text-[#667085]">
                      {license.description}
                    </p>
                  </button>
                );
              })
            )}
          </div>

          {/* THÔNG BÁO GIỮ LỊCH SỬ */}
          <div className="mt-4 flex items-start gap-3 rounded-[10px] bg-[#f2f4ff] px-4 py-3">
            <Info className="mt-0.5 size-4 shrink-0 text-[#0758d9]" />

            <p className="text-[13px] font-medium leading-5 text-[#667085]">
              Bạn có thể đổi hạng GPLX bất kỳ lúc nào
              mà không làm mất kết quả ôn tập của
              các hạng khác.
            </p>
          </div>
        </div>

        {/* FOOTER MODAL */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#eef0f4] bg-[#f8f9fc] px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="h-10 rounded-[9px] bg-white px-4 text-[13px] font-semibold text-[#475467] ring-1 ring-[#e3e7ee] transition hover:bg-[#f5f7fa] disabled:pointer-events-none disabled:opacity-50"
          >
            Hủy
          </button>

          <button
            type="button"
            disabled={!canConfirm}
            onClick={handleConfirm}
            className="min-h-10 min-w-[160px] rounded-[9px] bg-[#0758d9] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#064fc3] disabled:pointer-events-none disabled:bg-[#e7ebf5] disabled:text-[#98a2b3]"
          >
            {isSaving
              ? `Đang chuyển sang hạng ${pendingLicense}...`
              : changed
                ? `Chuyển sang hạng ${pendingLicense}`
                : pendingLicense === selectedLicense &&
                    selectedLicense
                  ? `Đang sử dụng hạng ${selectedLicense}`
                  : "Chọn hạng GPLX"}
          </button>
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

/* Nhãn tiêu đề phân cấp */
function SectionLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p className="text-[12px] font-bold leading-5 tracking-[0.025em] text-[#667085]">
      {children}
    </p>
  );
}

/* Icon theo nhóm phương tiện */
function GroupIcon({
  group,
}: {
  group: LicenseGroupId;
}) {
  if (group === "motorcycle") {
    return (
      <Bike
        className="size-[18px]"
        strokeWidth={2}
      />
    );
  }

  if (group === "car") {
    return (
      <CarFront
        className="size-[18px]"
        strokeWidth={2}
      />
    );
  }

  return (
    <Truck
      className="size-[18px]"
      strokeWidth={2}
    />
  );
}
