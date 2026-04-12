import { Camera as CameraIcon } from "lucide-react";
import type { Metadata } from "next";
import { FilmStockSummaryRow } from "@/components/film-stock-list-card";
import { ImageDestinationScansClient } from "@/components/image-destination-scans-client";
import { filmStockToLightboxSummary } from "@/lib/lightbox-group";
import { getFilmStocksBySlugs } from "@/lib/supabase/queries";
import { getUploadsForCamera } from "@/app/actions/uploads";

interface CameraImageDestinationPageProps {
  searchParams: Promise<{ name?: string }>;
}

export async function generateMetadata({ searchParams }: CameraImageDestinationPageProps): Promise<Metadata> {
  const { name } = await searchParams;
  const cameraName = name?.trim() || "Camera";
  return {
    title: `${cameraName} Images`,
    description: `All uploaded images shot on ${cameraName}.`,
  };
}

export default async function CameraImageDestinationPage({ searchParams }: CameraImageDestinationPageProps) {
  const { name } = await searchParams;
  const cameraName = name?.trim() || "";

  if (!cameraName) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:pb-8">
        <div className="rounded-[7px] border border-dashed border-border bg-secondary/20 py-10 text-center text-sm text-muted-foreground">
          Camera name is missing.
        </div>
      </div>
    );
  }

  const uploads = await getUploadsForCamera(cameraName);
  const scanCount = uploads.filter((u) => !!u.image_url).length;
  const stockSlugs = [...new Set(uploads.map((u) => u.film_stock_slug))];
  const stocks = await getFilmStocksBySlugs(stockSlugs);
  const stockBySlug = Object.fromEntries(
    stocks.map((s) => [s.slug, { name: s.name, summary: filmStockToLightboxSummary(s) }])
  );

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:pb-8">
      <header className="rounded-md bg-card">
        <FilmStockSummaryRow
          name={cameraName}
          specLine="CAMERA"
          hideTrailing
          showDivider={false}
          customThumb={
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <CameraIcon className="h-5 w-5" aria-hidden />
            </div>
          }
        />
      </header>

      {scanCount > 0 ? (
        <div className="min-w-0 -mx-4 mt-2 w-[calc(100%+2rem)]">
          <ImageDestinationScansClient uploads={uploads} mode="camera" stockBySlug={stockBySlug} />
        </div>
      ) : (
        <div className="mt-6 rounded-[7px] border border-dashed border-border bg-secondary/20 py-10 text-center text-sm text-muted-foreground">
          No uploaded images for this camera yet.
        </div>
      )}
    </div>
  );
}
