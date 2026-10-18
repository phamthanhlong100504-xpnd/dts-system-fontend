import type { ReactNode } from "react";

interface QuestionSessionShellProps {
  children: ReactNode;
}

export function QuestionSessionShell({
  children,
}: QuestionSessionShellProps) {
  return (
    <main
      className="
        mx-auto
        grid
        w-full
        max-w-[1280px]
        gap-7
        px-6
        pb-8
        pt-9
        lg:grid-cols-[minmax(0,1fr)_340px]
        lg:px-8
      "
    >
      {children}
    </main>
  );
}