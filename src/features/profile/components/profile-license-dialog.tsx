
"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  LICENSE_GROUPS,
  getLicensesByGroup,
  mapLicenseCatalogToOptions,
  type LicenseGroupId,
  type LicenseOption,
} from "@/config/license";

import { useLicenseCatalog } from "@/features/license/use-license";
import { cn } from "@/lib/utils";

interface ProfileLicenseDialogProps {
  open: boolean;
  selectedLicense: string;
  onOpenChange: (open: boolean) => void;
  onSelect: (licenseClass: string) => void;
}

const PROFILE_GROUP_TITLES: Record<
  LicenseGroupId,
  string
> = {
  motorcycle: "Xe mô tô",
  car: "Xe ô tô",
  trailer: "Kéo rơ-moóc",
};

export function ProfileLicenseDialog({
  open,
  selectedLicense,
  onOpenChange,
  onSelect,
}: ProfileLicenseDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      {open && (
        <ProfileLicenseDialogContent
          selectedLicense={selectedLicense}
          onSelect={onSelect}
        />
      )}
    </Dialog>
  );
}

function ProfileLicenseDialogContent({
  selectedLicense,
  onSelect,
}: Pick<
  ProfileLicenseDialogProps,
  "selectedLicense" | "onSelect"
>) {
  const catalog = useLicenseCatalog();

  // Danh mục lấy từ Practice backend.
  const licenseOptions = useMemo<
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
        mapLicenseCatalogToOptions(
          catalog.data
        );

      const uniqueCodes = new Set(
        options.map(
          (option) => option.code
        )
      );

      if (uniqueCodes.size !== 15) {
        return null;
      }

      const motorcycle =
        getLicensesByGroup(
          "motorcycle",
          options
        );

      const car =
        getLicensesByGroup(
          "car",
          options
        );

      const trailer =
        getLicensesByGroup(
          "trailer",
          options
        );

      if (
        motorcycle.length !== 3 ||
        car.length !== 6 ||
        trailer.length !== 6
      ) {
        return null;
      }

      const invalid = options.some(
        (option) =>
          !option.code ||
          !option.description ||
          typeof option.bankCountsMatch !==
            "boolean" ||
          typeof option.examAvailable !==
            "boolean"
      );

      if (invalid) {
        return null;
      }

      return options;
    } catch {
      return null;
    }
  }, [catalog.data]);

  const isCatalogReady =
    catalog.isSuccess &&
    licenseOptions !== null;

  const options = licenseOptions ?? [];

  function handleSelectLicense(
    licenseClass: string
  ) {
    if (!isCatalogReady) {
      return;
    }

    const license = options.find(
      (item) =>
        item.code === licenseClass
    );

    if (
      !license ||
      !license.bankCountsMatch ||
      !license.examAvailable
    ) {
      return;
    }

    // ProfileContent lưu hạng vào Identity.
    onSelect(licenseClass);
  }

  return (
    <DialogContent className="font-dts max-h-[90vh] max-w-[560px] overflow-y-auto rounded-[18px] border-[#e4e7ec] bg-white p-0 dark:border-[#35445a] dark:bg-[#182231]">

      {/* Header modal */}
      <DialogHeader className="px-6 pb-4 pt-6 text-left sm:text-left">

        {/* Chỉ tiêu đề căn giữa */}
        <DialogTitle className="w-full text-center text-[20px] font-bold text-[#101828] dark:text-[#f8fafc]">
          Đổi hạng giấy phép lái xe
        </DialogTitle>

        {/* Dòng mô tả căn trái */}
        <DialogDescription className="w-full text-left text-[14px] font-medium leading-6 text-[#667085] dark:text-[#aab8cf] sm:text-left">
          Chọn hạng bạn đang học. Nội dung ôn luyện và kết quả sẽ hiển thị theo hạng này.
        </DialogDescription>
      </DialogHeader>

      {/* Danh sách hạng GPLX */}
      <div className="space-y-5 border-t border-[#eef0f4] px-6 pb-6 pt-5 dark:border-[#35445a]">
        {catalog.isPending ? (
          <p className="text-[13px] font-medium text-[#667085] dark:text-[#aab8cf]">
            Đang tải danh mục GPLX...
          </p>
        ) : !isCatalogReady ? (
          <div>
            <p className="text-[13px] font-medium text-[#667085] dark:text-[#aab8cf]">
              Không thể tải danh mục GPLX.
              Vui lòng thử lại.
            </p>

            <button
              type="button"
              disabled={catalog.isFetching}
              onClick={() =>
                void catalog.refetch()
              }
              className="mt-3 text-[13px] font-semibold text-[#0758d9] disabled:opacity-50 dark:text-[#93b4ff]"
            >
              {catalog.isFetching
                ? "Đang tải lại..."
                : "Thử lại"}
            </button>
          </div>
        ) : (
          LICENSE_GROUPS.map((group) => {
            const groupLicenses =
              getLicensesByGroup(
                group.id,
                options
              );

            return (
              <div key={group.id}>
                <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.05em] text-[#98a2b3]">
                  {PROFILE_GROUP_TITLES[group.id]}
                </p>

                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {groupLicenses.map(
                    (license) => {
                      const active =
                        license.code ===
                        selectedLicense;

                      const available =
                        license.bankCountsMatch ===
                          true &&
                        license.examAvailable ===
                          true;

                      return (
                        <button
                          key={license.code}
                          type="button"
                          disabled={!available}
                          title={
                            available
                              ? `Chọn hạng ${license.code}`
                              : "Bộ câu hỏi chưa sẵn sàng"
                          }
                          onClick={() =>
                            handleSelectLicense(
                              license.code
                            )
                          }
                          className={cn(
                            "relative flex h-11 items-center justify-center rounded-[10px] border text-[13px] font-bold transition disabled:cursor-not-allowed disabled:opacity-50",
                            active
                              ? "border-[#9db8ff] bg-[#eef3ff] text-[#0758d9] dark:bg-[#26364e] dark:text-[#93b4ff]"
                              : "border-[#e4e7ec] bg-white text-[#344054] hover:border-[#c7d4fa] hover:bg-[#fafbff] dark:border-[#35445a] dark:bg-[#182231] dark:text-[#e2e8f0]"
                          )}
                        >
                          {license.code}

                          {active && (
                            <Check
                              className="absolute right-1.5 top-1.5 size-3 text-[#0758d9] dark:text-[#93b4ff]"
                              strokeWidth={2.3}
                            />
                          )}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </DialogContent>
  );
}
