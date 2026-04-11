"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Globe, ExternalLink } from "lucide-react";
import { useMobileHeaderTitle } from "@/context/mobile-header-title-context";
import { SetBrandMobileHeader } from "@/components/set-brand-mobile-header";
import { cn } from "@/lib/utils";

export function BrandDetailHero({
  name,
  logoUrl,
  description,
  websiteUrl,
  stockCount,
  communityScanCount,
  cameraModelCount = 0,
}: {
  name: string;
  logoUrl: string | null;
  description: string | null;
  websiteUrl: string | null;
  stockCount: number;
  communityScanCount: number;
  /** Linked camera catalog models (same brand entity). */
  cameraModelCount?: number;
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

  const hostname =
    websiteUrl != null && websiteUrl.trim() !== ""
      ? (() => {
          try {
            return new URL(websiteUrl).hostname.replace(/^www\./, "");
          } catch {
            return null;
          }
        })()
      : null;

  return (
    <>
      <SetBrandMobileHeader name={name} />
      <div className="w-full min-w-0 border-b border-border/40 bg-background pb-6 md:border-0 md:pb-0">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
          <div
            className={cn(
              "relative flex shrink-0 items-center justify-center overflow-hidden rounded-[7px] border border-border/50 bg-card",
              "h-[88px] w-[88px] sm:h-24 sm:w-24",
            )}
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={`${name} logo`}
                fill
                className="object-contain p-2"
                sizes="96px"
                priority
              />
            ) : (
              <span className="text-3xl font-bold text-foreground sm:text-4xl" aria-hidden>
                {name.charAt(0)}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1
              ref={titleRef}
              className="font-sans text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl"
            >
              {name}
            </h1>

            <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
              <span className="rounded-full border border-border/60 bg-secondary/40 px-2.5 py-0.5 text-foreground">
                {stockCount} film stock{stockCount !== 1 ? "s" : ""}
              </span>
              {communityScanCount > 0 ? (
                <span className="rounded-full border border-border/60 bg-secondary/40 px-2.5 py-0.5 text-foreground">
                  {communityScanCount} community scan{communityScanCount !== 1 ? "s" : ""}
                </span>
              ) : null}
              {cameraModelCount > 0 ? (
                <span className="rounded-full border border-border/60 bg-secondary/40 px-2.5 py-0.5 text-foreground">
                  {cameraModelCount} camera model{cameraModelCount !== 1 ? "s" : ""}
                </span>
              ) : null}
            </div>

            {description ? (
              <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                {description}
              </p>
            ) : null}

            {websiteUrl && hostname ? (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
              >
                <Globe className="h-3.5 w-3.5" aria-hidden />
                {hostname}
                <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            ) : null}

            <p className="mt-4 md:hidden">
              <Link
                href="/brands"
                className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                All brands
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
