import { Camera as CameraIcon } from "lucide-react";
import type { Metadata } from "next";
import { FilmStockSummaryRow } from "@/components/film-stock-list-card";
import { ImageDestinationGrid } from "@/components/image-destination-grid";
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
  const items = uploads
    .filter((u): u is typeof u & { image_url: string } => !!u.image_url)
    .map((u) => ({ id: u.id, imageUrl: u.image_url }));

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

      {items.length > 0 ? (
        <div className="min-w-0 -mx-4 mt-2 w-[calc(100%+2rem)]">
          <ImageDestinationGrid items={items} />
        </div>
      ) : (
        <div className="mt-6 rounded-[7px] border border-dashed border-border bg-secondary/20 py-10 text-center text-sm text-muted-foreground">
          No uploaded images for this camera yet.
        </div>
      )}
    </div>
  );
}
