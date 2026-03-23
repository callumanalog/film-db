"use client";

import type { BestFor } from "@/lib/types";
import { BEST_FOR_LABELS } from "@/lib/types";
import {
  UserCircle,
  Mountain,
  Building2,
  Heart,
  Plane,
  Moon,
  LampDesk,
  Aperture,
  SunDim,
  Trophy,
  Sparkles,
  Landmark,
  Sunset,
  Lightbulb,
  FileVideo,
} from "lucide-react";

export const BEST_FOR_ICONS: Record<BestFor, React.ElementType> = {
  general_purpose: Aperture,
  portrait: UserCircle,
  street: Building2,
  landscapes: Mountain,
  architecture: Landmark,
  documentary: FileVideo,
  sports: Trophy,
  travel: Plane,
  weddings: Heart,
  studio: LampDesk,
  bright_sun: SunDim,
  golden_hour: Sunset,
  low_light: Moon,
  artificial_light: Lightbulb,
  experimental: Sparkles,
};

interface BestForSectionProps {
  items: BestFor[];
}

export function BestForSection({ items }: BestForSectionProps) {
  if (!items.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((key) => {
        const Icon = BEST_FOR_ICONS[key];
        const label = BEST_FOR_LABELS[key];
        return (
          <span
            key={key}
            className="inline-flex items-center gap-1.5 rounded-[7px] border border-border/50 bg-background px-3 py-1.5 text-xs font-medium text-foreground/80"
          >
            <Icon className="size-3.5 text-muted-foreground" aria-hidden />
            {label}
          </span>
        );
      })}
    </div>
  );
}
