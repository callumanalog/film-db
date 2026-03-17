"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { Camera, Heart, Bookmark, ChevronDown, X } from "lucide-react";
import type { GalleryImage, SampleImageSource } from "@/lib/sample-images";

/** Strip aperture (e.g. " f/2", " f/1.4") from camera string for display. */
function cameraWithoutAperture(camera: string): string {
  return camera.replace(/\s+f\/[\d.]+$/i, "").trim() || camera;
}

type SortOption = "newest" | "most-liked";

export interface StockOption {
  slug: string;
  name: string;
  brandName: string;
}

interface GalleryGridProps {
  images: GalleryImage[];
  brands: string[];
  stocks: StockOption[];
  initialSelectedStockSlugs?: string[];
}

export function GalleryGrid({
  images,
  brands,
  stocks,
  initialSelectedStockSlugs = [],
}: GalleryGridProps) {
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [selectedStockSlugs, setSelectedStockSlugs] = useState<Set<string>>(
    () => new Set(initialSelectedStockSlugs)
  );
  const [stockDropdownOpen, setStockDropdownOpen] = useState(false);
  const stockDropdownRef = useRef<HTMLDivElement>(null);
  const [sourceFilter, setSourceFilter] = useState<SampleImageSource | "all">("all");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (stockDropdownRef.current && !stockDropdownRef.current.contains(event.target as Node)) {
        setStockDropdownOpen(false);
      }
    }
    if (stockDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [stockDropdownOpen]);
  const [sort, setSort] = useState<SortOption>("most-liked");

  const stocksForBrand = useMemo(() => {
    if (brandFilter === "all") return stocks;
    return stocks.filter((s) => s.brandName === brandFilter);
  }, [stocks, brandFilter]);

  const stocksGroupedByBrand = useMemo(() => {
    const map = new Map<string, StockOption[]>();
    for (const s of stocksForBrand) {
      const list = map.get(s.brandName) ?? [];
      list.push(s);
      map.set(s.brandName, list);
    }
    for (const list of map.values()) list.sort((a, b) => a.name.localeCompare(b.name));
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [stocksForBrand]);

  const filteredAndSorted = useMemo(() => {
    let list = images;
    if (brandFilter !== "all") list = list.filter((img) => img.brandName === brandFilter);
    if (selectedStockSlugs.size > 0) {
      list = list.filter((img) => selectedStockSlugs.has(img.stockSlug));
    }
    if (sourceFilter !== "all") list = list.filter((img) => img.source === sourceFilter);
    if (sort === "most-liked") {
      list = [...list].sort((a, b) => b.likes - a.likes);
    } else {
      list = [...list].reverse();
    }
    return list;
  }, [images, brandFilter, selectedStockSlugs, sourceFilter, sort]);

  const toggleStock = (slug: string) => {
    setSelectedStockSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const selectAllStocks = () => {
    setSelectedStockSlugs(new Set(stocksForBrand.map((s) => s.slug)));
  };

  const clearStocks = () => {
    setSelectedStockSlugs(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Filters — hidden on mobile */}
      <div className="hidden flex-wrap items-center gap-3 md:flex">
        <span className="text-sm font-medium text-muted-foreground">Brand</span>
        <select
          value={brandFilter}
          onChange={(e) => {
            setBrandFilter(e.target.value);
            setSelectedStockSlugs(new Set());
          }}
          className="rounded-card border border-border/50 bg-card px-3 py-1.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">All brands</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        <span className="mx-2 text-border">|</span>

        <span className="text-sm font-medium text-muted-foreground">Stock</span>
        <div className="flex flex-wrap items-center gap-2" ref={stockDropdownRef}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setStockDropdownOpen((o) => !o)}
              className="flex min-w-[10rem] items-center justify-between gap-2 rounded-card border border-border/50 bg-card px-3 py-1.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <span className="truncate">
                {selectedStockSlugs.size === 0
                  ? "All stocks"
                  : "Select stocks"}
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${stockDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>
            {stockDropdownOpen && (
              <div className="absolute left-0 top-full z-10 mt-1 w-72 rounded-card border border-border/50 bg-card py-2 shadow-lg">
                <div className="mb-2 flex gap-2 border-b border-border/50 px-3 pb-2">
                  <button
                    type="button"
                    onClick={selectAllStocks}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={clearStocks}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto px-2">
                  {stocksGroupedByBrand.map(([brandName, brandStocks]) => (
                    <div key={brandName} className="mb-2">
                      <span className="sticky top-0 bg-card px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {brandName}
                      </span>
                      <div className="flex flex-col gap-0.5">
                        {brandStocks.map((s) => (
                          <label
                            key={s.slug}
                            className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-0.5 text-sm text-foreground hover:bg-accent/50"
                          >
                            <input
                              type="checkbox"
                              checked={selectedStockSlugs.has(s.slug)}
                              onChange={() => toggleStock(s.slug)}
                              className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary/30"
                            />
                            <span className="truncate">{s.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {selectedStockSlugs.size > 0 && (
            <>
              {[...selectedStockSlugs].map((slug) => {
                const stock = stocks.find((s) => s.slug === slug);
                if (!stock) return null;
                return (
                  <span
                    key={slug}
                    className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 py-0.5 pl-2.5 pr-1 text-sm font-medium text-foreground"
                  >
                    <span className="max-w-[8rem] truncate">{stock.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleStock(slug)}
                      className="rounded-full p-0.5 transition-colors hover:bg-primary/20"
                      aria-label={`Remove ${stock.name}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                );
              })}
            </>
          )}
        </div>

        <span className="mx-2 text-border">|</span>

        <span className="text-sm font-medium text-muted-foreground">Source</span>
        <div className="flex gap-2">
          {(["all", "flickr", "community"] as const).map((value) => (
            <button
              key={value}
              onClick={() => setSourceFilter(value)}
              className={`rounded-card border px-3 py-1.5 text-sm font-medium transition-colors ${
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
              className={`rounded-card border px-3 py-1.5 text-sm font-medium transition-colors ${
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
            key={img.galleryId}
            className="group overflow-hidden border border-border/50 bg-card transition-all hover:border-primary/30"
          >
            <div className="relative aspect-[4/3] bg-muted">
              {img.imageUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  {/* Bottom gradient + username on image */}
                  <div
                    className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none"
                    aria-hidden
                  />
                  <p className="absolute bottom-2 left-2 right-20 text-xs font-medium text-white drop-shadow-sm truncate">
                    {img.username}
                  </p>
                  {/* Like and share on hover */}
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={(e) => e.preventDefault()}
                      className="flex items-center gap-1 rounded-full bg-black/40 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                      aria-label={`Like (${img.likes})`}
                    >
                      <Heart className="h-4 w-4" />
                      <span className="text-[11px] font-medium tabular-nums">{img.likes}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => e.preventDefault()}
                      className="rounded-full bg-black/40 p-1.5 text-white backdrop-blur-sm transition-colors hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                      aria-label="Save"
                    >
                      <Bookmark className="h-4 w-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-900/30 via-orange-900/20 to-red-900/40">
                  <Camera className="h-8 w-8 text-white/20" />
                </div>
              )}
            </div>
            <div className="relative flex items-start justify-between gap-2 p-3">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/films/${img.stockSlug}/images`}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {img.stockName}
                </Link>
                <p className="text-[11px] text-muted-foreground">{cameraWithoutAperture(img.camera)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAndSorted.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No images match the current filters. Try changing brand, stock, or source.
        </p>
      )}
    </div>
  );
}
