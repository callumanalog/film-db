import type { Metadata } from "next";
import Link from "next/link";
import { getCameras, getCameraBrands } from "@/lib/camera-queries";
import { CameraGrid } from "@/components/camera-grid";
import { Search } from "lucide-react";
import type { CameraType, CameraFormat } from "@/lib/types";

export const metadata: Metadata = {
  title: "Film Cameras",
  description: "Browse classic and modern film cameras — SLRs, rangefinders, TLRs, medium format, and more.",
};

interface CamerasPageProps {
  searchParams: Promise<{
    search?: string;
    brand?: string;
    type?: string;
    format?: string;
  }>;
}

export default async function CamerasPage({ searchParams }: CamerasPageProps) {
  const params = await searchParams;
  const brands = await getCameraBrands();
  const cameras = await getCameras({
    search: params.search,
    brand: params.brand,
    type: params.type as CameraType | undefined,
    format: params.format as CameraFormat | undefined,
  });

  const activeFilters = [params.search, params.brand, params.type, params.format].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl font-advercase">
          Film Cameras
        </h1>
        <p className="mt-1 text-muted-foreground">
          {cameras.length} camera{cameras.length !== 1 ? "s" : ""}{" "}
          {activeFilters > 0 ? "matching your filters" : "in our database"}
        </p>
      </div>

      <form method="GET" action="/cameras" className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            name="search"
            defaultValue={params.search || ""}
            placeholder="Search cameras..."
            className="h-10 w-full rounded-xl border border-border/60 bg-secondary/50 pl-10 pr-4 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          name="brand"
          defaultValue={params.brand || ""}
          className="h-10 rounded-xl border border-border/60 bg-secondary/50 px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.slug}>
              {b.name}
            </option>
          ))}
        </select>
        <select
          name="type"
          defaultValue={params.type || ""}
          className="h-10 rounded-xl border border-border/60 bg-secondary/50 px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All types</option>
          <option value="slr">SLR</option>
          <option value="rangefinder">Rangefinder</option>
          <option value="tlr">TLR</option>
          <option value="point_and_shoot">Point & Shoot</option>
          <option value="viewfinder">Viewfinder</option>
          <option value="medium_format_slr">Medium Format SLR</option>
          <option value="medium_format_rangefinder">Medium Format Rangefinder</option>
          <option value="instant">Instant</option>
          <option value="large_format">Large Format</option>
          <option value="folding">Folding</option>
          <option value="toy">Toy</option>
        </select>
        <select
          name="format"
          defaultValue={params.format || ""}
          className="h-10 rounded-xl border border-border/60 bg-secondary/50 px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All formats</option>
          <option value="35mm">35mm</option>
          <option value="120">120</option>
          <option value="4x5">4x5</option>
          <option value="8x10">8x10</option>
          <option value="instant">Instant</option>
        </select>
        <button
          type="submit"
          className="h-10 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Search
        </button>
      </form>

      <CameraGrid cameras={cameras} />
    </div>
  );
}
