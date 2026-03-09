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

  return (
    <Link href={`/films/${stock.slug}`} className="group block">
      <div className="relative overflow-hidden rounded-lg border border-border/50 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
        <div className="bg-white flex items-center justify-center overflow-hidden px-2 py-2 h-28 sm:h-32">
          {stock.image_url ? (
            <Image
              src={stock.image_url}
              alt={`${stock.brand?.name} ${stock.name}`}
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

        <div className="px-2 py-2 pt-0">
          <div className="flex items-start justify-between gap-1.5 min-w-0">
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-muted-foreground truncate">
                {stock.brand?.name || stock.brand_id}
              </p>
              <h3 className="truncate text-sm font-semibold leading-tight text-foreground group-hover:text-primary transition-colors font-advercase">
                {stock.name}
              </h3>
            </div>
            {stock.discontinued && (
              <Badge variant="secondary" className="shrink-0 text-[9px] px-1.5 py-0">
                Discontinued
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
