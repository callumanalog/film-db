import type { Metadata } from "next";
import { getCameras, getCameraBrands } from "@/lib/camera-queries";
import { CameraGrid } from "@/components/camera-grid";
import { CamerasHeader } from "@/components/cameras-header";
import { CamerasActiveFilterChips } from "@/components/cameras-active-filter-chips";
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

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.002_75)]">
      <div className="mx-auto max-w-7xl px-4 pt-20 pb-8 sm:px-6 sm:pt-24 lg:px-8">
        <div className="mb-3">
          <CamerasHeader brands={brands} />
        </div>

        <main className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <CamerasActiveFilterChips brands={brands} />
            </div>
          </div>
          <CameraGrid cameras={cameras} />
        </main>
      </div>
    </div>
  );
}
