import type { Metadata } from "next";
import { getCameras, getCameraBrands } from "@/lib/camera-queries";
import { CameraGrid } from "@/components/camera-grid";
import { CamerasHeader } from "@/components/cameras-header";
import type { CameraType, CameraFormat } from "@/lib/types";

export const metadata: Metadata = {
  title: "Film Cameras",
  description: "Browse classic and modern film cameras — SLRs, rangefinders, TLRs, medium format, and more.",
};

type CamerasSort = "alphabetical" | "newest";

interface CamerasPageProps {
  searchParams: Promise<{
    search?: string;
    brand?: string;
    type?: string;
    format?: string;
    sort?: string;
  }>;
}

export default async function CamerasPage({ searchParams }: CamerasPageProps) {
  const params = await searchParams;
  const sortParam = params.sort === "newest" ? "newest" : "alphabetical";
  const brands = await getCameraBrands();
  const camerasUnsorted = await getCameras({
    search: params.search,
    brand: params.brand,
    type: params.type as CameraType | undefined,
    format: params.format as CameraFormat | undefined,
  });

  const cameras =
    sortParam === "newest"
      ? [...camerasUnsorted].sort((a, b) => {
          const ya = a.year_introduced ?? 0;
          const yb = b.year_introduced ?? 0;
          return yb - ya;
        })
      : camerasUnsorted;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 pt-20 pb-8 sm:px-6 sm:pt-24 lg:px-8">
        <div className="mb-3">
          <CamerasHeader brands={brands} currentSort={sortParam} />
        </div>

        <main className="min-w-0">
          <CameraGrid cameras={cameras} />
        </main>
      </div>
    </div>
  );
}
