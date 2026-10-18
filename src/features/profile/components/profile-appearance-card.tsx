"use client";

import {
  useSyncExternalStore,
} from "react";

import {
  Monitor,
  Moon,
  Palette,
  Sun,
  type LucideIcon,
} from "lucide-react";

import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

type ThemeValue =
  | "light"
  | "dark"
  | "system";

interface ThemeOption {
  value: ThemeValue;
  label: string;
  icon: LucideIcon;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    value: "light",
    label: "Sáng",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Tối",
    icon: Moon,
  },
  {
    value: "system",
    label: "Theo hệ thống",
    icon: Monitor,
  },
];

const subscribe = () => () => {};

export function ProfileAppearanceCard() {
  const {
    theme,
    setTheme,
  } = useTheme();

  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const currentTheme: ThemeValue =
    theme === "dark" ||
    theme === "system"
      ? theme
      : "light";

  return (
    <section className="rounded-[18px] border border-[#e3e5ec] bg-white p-[0.6cm] shadow-[0_3px_12px_rgba(31,41,55,0.035)] dark:border-[#35445a] dark:bg-[#182231]">
      <div className="flex min-h-11 items-center gap-2.5 rounded-[10px] bg-[#f8f8fd] px-4 dark:bg-[#243044]">
        <Palette
          className="size-[18px] text-[#0758d9] dark:text-[#93b4ff]"
          strokeWidth={1.9}
        />

        <h2 className="text-[16px] font-bold text-[#101828] dark:text-[#f8fafc]">
          Giao diện
        </h2>
      </div>

      <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-[14px] font-semibold text-[#101828] dark:text-[#f8fafc]">
            Chế độ hiển thị
          </p>

          <p className="mt-1 max-w-[400px] text-[14px] font-medium leading-6 text-[#667085] dark:text-[#aab8cf]">
            Tùy chỉnh giao diện hiển thị phù hợp
            với thị giác của bạn.
          </p>
        </div>

        <div className="inline-flex min-h-10 shrink-0 flex-wrap items-center rounded-[10px] bg-[#f0f2ff] p-[4px] dark:bg-[#26364e]">
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon;

            const active =
              mounted &&
              currentTheme === option.value;

            return (
              <button
                key={option.value}
                type="button"
                disabled={!mounted}
                onClick={() =>
                  setTheme(option.value)
                }
                className={cn(
                  "inline-flex h-9 items-center justify-center gap-1.5 rounded-[8px] px-3 text-[13px] font-semibold transition",
                  active
                    ? "bg-[#0758d9] text-white shadow-[0_1px_2px_rgba(7,88,217,0.15)]"
                    : "text-[#475467] hover:bg-white hover:text-[#0758d9] dark:text-[#cbd5e1]"
                )}
              >
                <Icon
                  className="size-4"
                  strokeWidth={1.9}
                />

                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}