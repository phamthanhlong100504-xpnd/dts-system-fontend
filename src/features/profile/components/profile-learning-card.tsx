"use client";

import {
  GraduationCap,
} from "lucide-react";

interface ProfileLearningCardProps {
  licenseClass: string;
  onChangeLicense: () => void;
}

export function ProfileLearningCard({
  licenseClass,
  onChangeLicense,
}: ProfileLearningCardProps) {
  return (
    <section className="rounded-[18px] border border-[#e3e5ec] bg-white p-[0.6cm] shadow-[0_3px_12px_rgba(31,41,55,0.035)] dark:border-[#35445a] dark:bg-[#182231]">
      <div className="flex min-h-11 items-center gap-2.5 rounded-[10px] bg-[#f8f8fd] px-4 dark:bg-[#243044]">
        <GraduationCap
          className="size-[18px] text-[#0758d9] dark:text-[#93b4ff]"
          strokeWidth={1.9}
        />

        <h2 className="text-[16px] font-bold text-[#101828] dark:text-[#f8fafc]">
          Học tập
        </h2>
      </div>

      <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <p className="text-[14.5px] font-semibold text-[#101828] dark:text-[#f8fafc]">
            Hạng đang học
          </p>

          <p className="mt-1 text-[14.5px] font-medium leading-6 text-[#475467] dark:text-[#aab8cf]">
            Nội dung ôn luyện và kết quả được hiển thị
            theo hạng đang chọn.
          </p>

          <span className="mt-3 inline-flex min-h-8 items-center gap-2 rounded-[8px] bg-[#eef3ff] px-3 text-[13.5px] font-semibold text-[#0758d9] dark:bg-[#26364e] dark:text-[#93b4ff]">
            <GraduationCap
              className="size-4"
              strokeWidth={1.9}
            />

            Hạng {licenseClass}
          </span>
        </div>

        <button
          type="button"
          onClick={onChangeLicense}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 self-start rounded-[10px] bg-[#f0f2ff] px-5 text-[13.5px] font-semibold text-[#27364f] transition hover:bg-[#e7ebff] hover:text-[#0758d9] sm:self-auto dark:bg-[#26364e] dark:text-[#e2e8f0]"
        >
          <GraduationCap
            className="size-4"
            strokeWidth={1.9}
          />

          Đổi hạng GPLX
        </button>
      </div>
    </section>
  );
}