"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useMobileHeaderTitle } from "@/context/mobile-header-title-context";
import { parseCountry, parseFoundedYear } from "@/lib/brand-meta";
import { cn } from "@/lib/utils";

export function BrandDetailMobileToolbar({
  name,
  logoUrl,
  foundedYear,
  country,
}: {
  name: string;
  logoUrl: string | null;
  /** Accepts number or string (e.g. after JSON / RSC edge cases). */
  foundedYear?: number | string | null;
  country?: string | null;
}) {
  const ctx = useMobileHeaderTitle();
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = titleRef.current;
    if (!el || !ctx) return;
    const observer = new IntersectionObserver(
      ([entry]) => ctx.setTitleScrolledPast(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ctx]);

  const founded = parseFoundedYear(foundedYear);
  const countryStr = parseCountry(country);
  const showMeta = founded != null || Boolean(countryStr);

  return (
    <div className="w-full min-w-0 bg-background md:hidden">
      <div className="flex items-stretch gap-3 py-1">
        <div
          className={cn(
            "relative h-32 w-32 shrink-0 overflow-hidden rounded-[7px] border border-border/50 bg-card",
          )}
        >
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={`${name} logo`}
              width={128}
              height={128}
              priority
              className="h-full w-full object-cover"
              sizes="128px"
              unoptimized={logoUrl.startsWith("http")}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-3xl font-bold text-foreground" aria-hidden>
              {name.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-center">
          <h1
            ref={titleRef}
            className="min-w-0 text-left font-sans text-2xl font-semibold leading-tight tracking-tight text-foreground"
          >
            {name}
          </h1>
          {showMeta ? (
            <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] leading-relaxed text-muted-foreground">
              {founded != null ? (
                <span className="min-w-0 shrink-0 tabular-nums text-foreground">Founded {founded}</span>
              ) : null}
              {founded != null && countryStr ? (
                <span className="shrink-0 select-none text-foreground" aria-hidden>
                  ·
                </span>
              ) : null}
              {countryStr ? (
                <span className="min-w-0 shrink-0 text-foreground">{countryStr}</span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
