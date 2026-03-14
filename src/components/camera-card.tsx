import Link from "next/link";
import type { FilmCamera, CameraBrand } from "@/lib/types";
import { Camera } from "lucide-react";

interface CameraCardProps {
  camera: FilmCamera & { brand: CameraBrand };
}

export function CameraCard({ camera }: CameraCardProps) {
  return (
    <div className="group relative block">
      <Link href={`/cameras/${camera.slug}`} className="block">
        <div className="relative overflow-hidden rounded-card border border-border/50 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
          <div className="bg-white flex items-center justify-center overflow-hidden px-2 py-2 h-36 sm:h-40 relative">
            <div className="flex flex-col items-center gap-0.5 opacity-60 transition-opacity group-hover:opacity-80">
              <Camera className="h-7 w-7 text-primary" />
              <span className="text-tiny font-medium text-muted-foreground">
                {camera.format.join(", ")}
              </span>
            </div>
          </div>

          <div className="border-t border-border/50 px-3 py-3 flex flex-col gap-1 min-w-0">
            <div className="flex min-w-0 items-center justify-between gap-2">
              <h3 className="min-w-0 truncate text-sm font-semibold leading-tight text-foreground group-hover:text-primary transition-colors font-sans">
                {camera.name}
              </h3>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
