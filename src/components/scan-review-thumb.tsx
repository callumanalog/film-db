"use client";

import { useState, useEffect, type CSSProperties, type SyntheticEvent } from "react";
import { Loader2, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ScanReviewThumbProps = {
  /** `null` while the scan is still being read or compressed. */
  url: string | null;
  fileName?: string;
  /** When set, the slot failed decode/prepare; `url` stays null. */
  errorMessage?: string | null;
  onRemove: () => void;
  onOpenPreview: () => void;
  onIntrinsicSize?: (width: number, height: number) => void;
};

export function ScanReviewThumb({
  url,
  fileName,
  errorMessage,
  onRemove,
  onOpenPreview,
  onIntrinsicSize,
}: ScanReviewThumbProps) {
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [loadError, setLoadError] = useState(false);
  const loading = url == null && errorMessage == null;
  const failed = errorMessage != null && errorMessage !== "";

  useEffect(() => {
    setDims(null);
    setLoadError(false);
  }, [url]);

  const frameStyle: CSSProperties | undefined = failed
    ? { minHeight: "6rem", aspectRatio: "3 / 2" }
    : loadError
      ? { minHeight: "6rem", aspectRatio: "3 / 2" }
      : dims
        ? { aspectRatio: `${dims.w} / ${dims.h}` }
        : { minHeight: "6rem" };

  const handleImgLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth < 1 || naturalHeight < 1) return;
    setDims({ w: naturalWidth, h: naturalHeight });
    onIntrinsicSize?.(naturalWidth, naturalHeight);
  };

  const canPreview = Boolean(url) && !failed;

  return (
    <div className="relative min-w-0 self-start">
      <div className="relative w-full overflow-hidden" style={frameStyle}>
        <button
          type="button"
          onClick={() => {
            if (canPreview) onOpenPreview();
          }}
          disabled={!canPreview}
          className={cn(
            "relative block h-full min-h-0 w-full touch-manipulation",
            !canPreview && "cursor-default"
          )}
        >
          {loading ? (
            <div className="flex min-h-[6rem] w-full items-center justify-center bg-muted/30">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
              <span className="sr-only">Processing scan{fileName ? `: ${fileName}` : ""}</span>
            </div>
          ) : failed ? null : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={url!}
              alt=""
              className={cn("h-full w-full object-contain", loadError && "opacity-0")}
              draggable={false}
              onLoad={handleImgLoad}
              onError={() => setLoadError(true)}
            />
          )}
        </button>
        {failed ? (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 bg-destructive/5 px-2 text-center">
            <p className="text-[11px] font-semibold leading-tight text-destructive">Couldn&apos;t add this scan</p>
            {fileName ? (
              <p className="max-w-full truncate text-[10px] text-muted-foreground" title={fileName}>
                {fileName}
              </p>
            ) : null}
            <p className="line-clamp-4 text-[10px] leading-snug text-muted-foreground" title={errorMessage}>
              {errorMessage}
            </p>
          </div>
        ) : null}
        {!failed && loadError ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-muted px-2 text-center text-[11px] leading-snug text-muted-foreground">
            Couldn&apos;t show preview — file is still queued for upload. Open to verify.
          </div>
        ) : null}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
          aria-label="Remove scan"
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
