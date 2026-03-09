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
  Sparkles,
} from "lucide-react";

const BEST_FOR_ICONS: Record<BestFor, React.ElementType> = {
  portrait: UserCircle,
  landscape: Mountain,
  street: Building2,
  wedding: Heart,
  travel: Plane,
  night: Moon,
  studio: LampDesk,
  everyday: Sun,
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
              className="flex items-center gap-2 rounded-xl border border-border/50 bg-card px-4 py-3"
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
