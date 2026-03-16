"use client";

import { useState } from "react";

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgdmlld0JveD0iMCAwIDEwIDEwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  /** Optional className for the wrapper (e.g. aspect ratio). */
  wrapperClassName?: string;
}

/**
 * Lazy-loaded image with blur placeholder to prevent layout jump.
 * Uses native img with loading="lazy"; placeholder fades out when image loads.
 */
export function LazyImage({ src, alt, wrapperClassName, className, ...rest }: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <span className={`relative block ${wrapperClassName ?? ""}`}>
      {/* Blur placeholder: shown until image loads */}
      {!loaded && (
        <span
          className="absolute inset-0 bg-muted animate-pulse"
          style={{
            backgroundImage: `url(${BLUR_PLACEHOLDER})`,
            backgroundSize: "cover",
          }}
          aria-hidden
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`block h-auto w-full transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"} ${className ?? ""}`}
        {...rest}
      />
    </span>
  );
}
