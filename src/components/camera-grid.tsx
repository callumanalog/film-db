import type { FilmCamera, CameraBrand } from "@/lib/types";
import { CameraCard } from "@/components/camera-card";

interface CameraGridProps {
  cameras: (FilmCamera & { brand: CameraBrand })[];
  emptyMessage?: string;
}

export function CameraGrid({
  cameras,
  emptyMessage = "No film cameras found matching your filters.",
}: CameraGridProps) {
  if (cameras.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-border py-16 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
      {cameras.map((camera) => (
        <CameraCard key={camera.id} camera={camera} />
      ))}
    </div>
  );
}
