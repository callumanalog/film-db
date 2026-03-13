import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { FilmCamera, CameraBrand } from "@/lib/types";
import { CAMERA_TYPE_LABELS } from "@/lib/types";
import { Camera } from "lucide-react";

interface CameraCardProps {
  camera: FilmCamera & { brand: CameraBrand };
}

export function CameraCard({ camera }: CameraCardProps) {
  return (
    <Link href={`/cameras/${camera.slug}`} className="group block">
      <div className="relative overflow-hidden rounded-[7px] border border-border/50 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
        <div className="flex items-center justify-center overflow-hidden px-2 py-2 h-28 sm:h-32 bg-muted/30">
          <div className="flex flex-col items-center gap-0.5 opacity-70 transition-opacity group-hover:opacity-90">
            <Camera className="h-10 w-10 text-primary" />
            <span className="text-[9px] font-medium text-muted-foreground">
              {camera.format.join(", ")}
            </span>
          </div>
        </div>
        <div className="border-t border-border/50 px-3 py-3 flex flex-col gap-1 min-w-0">
          <div className="flex items-start justify-between gap-1.5 min-w-0">
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-muted-foreground truncate">
                {camera.brand?.name || camera.brand_id}
              </p>
              <h3 className="truncate text-sm font-semibold leading-tight text-foreground group-hover:text-primary transition-colors font-sans">
                {camera.name}
              </h3>
              <div className="mt-1 flex flex-wrap gap-0.5">
                <Badge variant="secondary" className="text-[8px] px-1 py-0 font-normal">
                  {CAMERA_TYPE_LABELS[camera.type]}
                </Badge>
                {camera.year_introduced && (
                  <span className="text-[9px] text-muted-foreground">
                    {camera.year_introduced}
                    {camera.year_discontinued ? `–${camera.year_discontinued}` : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
