"use client";

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { FilmStock, FilmBrand } from "@/lib/types";
import { Camera } from "lucide-react";

interface FilmCardProps {
  stock: FilmStock & { brand: FilmBrand };
}

const TYPE_ACCENT: Record<string, string> = {
  color_negative: "text-amber-700",
  color_reversal: "text-emerald-700",
  bw_negative: "text-zinc-500",
  bw_reversal: "text-zinc-600",
  instant: "text-sky-700",
};

export function FilmCard({ stock }: FilmCardProps) {
  const accent = TYPE_ACCENT[stock.type] || TYPE_ACCENT.color_negative;
  const displayName =
    stock.brand &&
    stock.name.toLowerCase().startsWith(stock.brand.name.toLowerCase().trim())
      ? stock.name
      : [stock.brand?.name, stock.name].filter(Boolean).join(" ") || stock.name;

  return (
    <div className="group relative block">
      <Link href={`/films/${stock.slug}`} className="block">
        <div className="relative overflow-hidden rounded-lg border border-border/50 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
          <div className="bg-white flex items-center justify-center overflow-hidden px-2 py-2 h-36 sm:h-40">
            {stock.image_url ? (
              <Image
                src={stock.image_url}
                alt={displayName}
                width={200}
                height={112}
                className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center gap-0.5 opacity-60 transition-opacity group-hover:opacity-80">
                <Camera className={`h-7 w-7 ${accent}`} />
                <span className={`text-[9px] font-medium ${accent}`}>
                  ISO {stock.iso}
                </span>
              </div>
            )}
          </div>

          <div className="px-3 py-3 flex items-center justify-between gap-2 min-w-0 min-h-[3.25rem]">
            <h3 className="min-w-0 flex-1 truncate text-sm font-semibold leading-tight text-foreground group-hover:text-primary transition-colors font-advercase">
              {displayName}
            </h3>
            {stock.discontinued && (
              <Badge variant="secondary" className="shrink-0 text-[9px] px-1.5 py-0">
                Discontinued
              </Badge>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
