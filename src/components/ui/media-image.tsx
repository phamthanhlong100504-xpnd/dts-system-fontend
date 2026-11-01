"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Loader2 } from "lucide-react";

import { mediaApi } from "@/lib/api";

interface MediaImageProps {
  src?: string;
  alt?: string;
  className?: string;
}

interface MediaUrlResponse {
  url?: string | null;
}

interface LoadedMedia {
  mediaId: string;
  url?: string;
  error: boolean;
}

const UUID_REGEX =
  /([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/;

function resolveSource(
  src?: string
) {
  if (!src) {
    return {
      directUrl: undefined,
      mediaId: undefined,
    };
  }

  if (src.startsWith("http")) {
    const match =
      src.match(UUID_REGEX);

    if (
      match?.[1] &&
      src.includes(
        "X-Amz-Signature"
      )
    ) {
      return {
        directUrl: undefined,
        mediaId: match[1],
      };
    }

    return {
      directUrl: src,
      mediaId: undefined,
    };
  }

  if (src.startsWith("/")) {
    return {
      directUrl: src,
      mediaId: undefined,
    };
  }

  return {
    directUrl: undefined,
    mediaId: src,
  };
}

export function MediaImage({
  src,
  alt = "",
  className,
}: MediaImageProps) {
  const {
    directUrl,
    mediaId,
  } = useMemo(
    () => resolveSource(src),
    [src]
  );

  const [
    loadedMedia,
    setLoadedMedia,
  ] =
    useState<LoadedMedia | null>(
      null
    );

  useEffect(() => {
    if (!mediaId) {
      return;
    }

    let cancelled = false;

    void mediaApi
      .get<MediaUrlResponse>(
        mediaId
      )
      .then((response) => {
        if (cancelled) {
          return;
        }

        setLoadedMedia({
          mediaId,
          url:
            response?.url ??
            undefined,
          error:
            !response?.url,
        });
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        console.error(
          "Failed to load media URL",
          error
        );

        setLoadedMedia({
          mediaId,
          error: true,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [mediaId]);

  if (!src) {
    return null;
  }

  const matchesCurrentMedia =
    Boolean(
      mediaId &&
        loadedMedia?.mediaId ===
          mediaId
    );

  const url =
    directUrl ??
    (matchesCurrentMedia
      ? loadedMedia?.url
      : undefined);

  const loading =
    Boolean(
      mediaId &&
        !matchesCurrentMedia
    );

  const error =
    Boolean(
      mediaId &&
        matchesCurrentMedia &&
        loadedMedia?.error
    );

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center bg-muted/20 ${
          className ?? ""
        }`}
      >
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !url) {
    return (
      <div
        className={`flex items-center justify-center bg-muted/20 text-[12.5px]/4 text-muted-foreground ${
          className ?? ""
        }`}
      >
        [Lỗi tải hình ảnh]
      </div>
    );
  }

  return (
    // Dynamic signed/local media URLs are intentionally rendered directly.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className={className}
    />
  );
}