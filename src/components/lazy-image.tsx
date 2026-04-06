"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgdmlld0JveD0iMCAwIDEwIDEwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+";

/** Remote width hint for Vercel Image Optimization (must align with `images.deviceSizes`; display follows CSS). */
const SUPABASE_REMOTE_WIDTH = 1920;
const SUPABASE_REMOTE_HEIGHT = 1440;
const DEFAULT_SIZES = "(max-width: 768px) 100vw, 50vw";
const DEFAULT_QUALITY = 82;

export function isSupabasePublicStorageUrl(src: string): boolean {
  try {
    const u = new URL(src);
    return (
      u.protocol === "https:" &&
      u.hostname.endsWith(".supabase.co") &&
      u.pathname.includes("/storage/v1/object/public/")
    );
  } catch {
    return false;
  }
}

interface LazyImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> {
  src: string;
  alt: string;
  /** Optional className for the wrapper (e.g. aspect ratio). */
  wrapperClassName?: string;
  /**
   * When true and `src` is Supabase public storage, uses `next/image` with `fill` + `object-cover`.
   * The wrapper should establish size (e.g. fixed dimensions or aspect-ratio parent).
   */
  fill?: boolean;
}

function PlaceholderBackdrop() {
  return (
    <span
      className="absolute inset-0 bg-muted animate-pulse"
      style={{
        backgroundImage: `url(${BLUR_PLACEHOLDER})`,
        backgroundSize: "cover",
      }}
      aria-hidden
    />
  );
}

/**
 * Lazy-loaded image with blur placeholder.
 * **Supabase Storage public URLs** use Vercel Image Optimization (`next/image`) to cache and resize at the edge, reducing Supabase egress.
 * Other URLs use a native `<img>`.
 */
export function LazyImage({
  src,
  alt,
  wrapperClassName,
  className,
  fill: fillLayout = false,
  sizes,
  style,
  onLoad,
  ...rest
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const useVercel = isSupabasePublicStorageUrl(src);
  const sizesResolved = sizes ?? DEFAULT_SIZES;

  const handleOptimizedLoad: React.ReactEventHandler<HTMLImageElement> = (e) => {
    setLoaded(true);
    onLoad?.(e);
  };

  if (useVercel && fillLayout) {
    return (
      <span className={cn("relative block overflow-hidden", wrapperClassName)}>
        {!loaded ? <PlaceholderBackdrop /> : null}
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizesResolved}
          quality={DEFAULT_QUALITY}
          className={cn(
            "transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
            className
          )}
          onLoad={handleOptimizedLoad}
        />
      </span>
    );
  }

  if (useVercel) {
    return (
      <span className={cn("relative block", wrapperClassName)}>
        {!loaded ? <PlaceholderBackdrop /> : null}
        <Image
          src={src}
          alt={alt}
          width={SUPABASE_REMOTE_WIDTH}
          height={SUPABASE_REMOTE_HEIGHT}
          sizes={sizesResolved}
          quality={DEFAULT_QUALITY}
          className={cn(
            "transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
            className
          )}
          style={{ width: "100%", height: "auto", ...(style ?? {}) }}
          onLoad={handleOptimizedLoad}
        />
      </span>
    );
  }

  if (fillLayout) {
    return (
      <span className={cn("relative block overflow-hidden", wrapperClassName)}>
        {!loaded ? <PlaceholderBackdrop /> : null}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={(e) => {
            setLoaded(true);
            onLoad?.(e);
          }}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0",
            className
          )}
          style={style}
          {...rest}
        />
      </span>
    );
  }

  return (
    <span className={cn("relative block", wrapperClassName)}>
      {!loaded ? <PlaceholderBackdrop /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
        className={cn(
          "block h-auto w-full transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
          className
        )}
        style={style}
        {...rest}
      />
    </span>
  );
}
