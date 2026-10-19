"use client";

import { MediaImage } from "@/components/ui/media-image";
import { cn } from "@/lib/utils";

interface QuestionImageProps {
  src?: string;
  alt?: string;
  className?: string;
}

export function QuestionImage({
  src,
  alt = "",
  className,
}: QuestionImageProps) {
  if (!src) {
    return null;
  }

  return (
    <div
      className={cn(
        "relative mx-auto aspect-[7/4] w-full max-w-[560px] overflow-hidden rounded-[10px] border border-[#e5e8ee] bg-white",
        className
      )}
    >
      <div className="absolute inset-0 flex items-center justify-center p-2">
        <MediaImage
          src={src}
          alt={alt}
          className="block h-full w-full object-scale-down"
        />
      </div>
    </div>
  );
}
