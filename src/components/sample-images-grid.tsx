"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Camera, Heart, ChevronLeft } from "lucide-react";
import type { SampleImage, SampleImageSource } from "@/lib/sample-images";

/** Strip aperture (e.g. " f/2", " f/1.4") from camera string for display. */
function cameraWithoutAperture(camera: string): string {
  return camera.replace(/\s+f\/[\d.]+$/i, "").trim() || camera;
}

type SortOption = "newest" | "most-liked";

interface SampleImagesGridProps {
  images: SampleImage[];
  stockDisplayName: string;
  slug: string;
}

export function SampleImagesGrid({ images, stockDisplayName, slug }: SampleImagesGridProps) {
  const [sourceFilter, setSourceFilter] = useState<SampleImageSource | "all">("all");
  const [sort, setSort] = useState<SortOption>("most-liked");

  const filteredAndSorted = useMemo(() => {
    let list = sourceFilter === "all" ? images : images.filter((img) => img.source === sourceFilter);
    if (sort === "most-liked") {
      list = [...list].sort((a, b) => b.likes - a.likes);
    } else {
      list = [...list].reverse(); // newest: assume array order is newest-first
    }
    return list;
  }, [images, sourceFilter, sort]);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/films/${slug}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to {stockDisplayName}
      </Link>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Source</span>
        <div className="flex gap-2">
          {(["all", "flickr", "community"] as const).map((value) => (
            <button
              key={value}
              onClick={() => setSourceFilter(value)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                sourceFilter === value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/50 bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {value === "all" ? "All" : value === "flickr" ? "Flickr" : "Community"}
            </button>
          ))}
        </div>
        <span className="mx-2 text-border">|</span>
        <span className="text-sm font-medium text-muted-foreground">Sort</span>
        <div className="flex gap-2">
          {(["most-liked", "newest"] as const).map((value) => (
            <button
              key={value}
              onClick={() => setSort(value)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                sort === value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/50 bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {value === "most-liked" ? "Most liked" : "Newest"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {filteredAndSorted.map((img) => (
          <div
            key={img.id}
            className="group overflow-hidden rounded-[7px] border border-border/50 bg-card transition-all hover:border-primary/30"
          >
            <div className="relative aspect-[4/3] bg-muted">
              {img.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-900/30 via-orange-900/20 to-red-900/40">
                  <Camera className="h-8 w-8 text-white/20" />
                </div>
              )}
            </div>
            <div className="relative flex items-start justify-between gap-2 p-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium">{img.username}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{cameraWithoutAperture(img.camera)}</p>
              </div>
              <button
                type="button"
                className="flex shrink-0 items-center gap-1.5 rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                aria-label={`Like (${img.likes})`}
              >
                <Heart className="h-6 w-6" />
                <span className="text-sm font-medium tabular-nums">{img.likes}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
