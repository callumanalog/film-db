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
  Sun,
  SunDim,
  Trophy,
  Sparkles,
  Landmark,
  Sunset,
  Lightbulb,
  FileVideo,
} from "lucide-react";

const BEST_FOR_ICONS: Record<BestFor, React.ElementType> = {
  general_purpose: Sun,
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
    <section>
      <h2 className="mb-4 text-xl font-bold tracking-tight">Best for</h2>
      <div className="flex flex-wrap gap-3">
        {items.map((key) => {
          const Icon = BEST_FOR_ICONS[key];
          const label = BEST_FOR_LABELS[key];
          return (
            <div
              key={key}
              className="flex items-center gap-2 rounded-[7px] border border-border/50 bg-card px-4 py-3"
            >
              <Icon className="h-5 w-5 text-primary" aria-hidden />
              <span className="text-sm font-medium">{label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
