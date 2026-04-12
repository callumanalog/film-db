"use client";

import { cn } from "@/lib/utils";

export interface ImageDestinationGridItem {
  id: string;
  imageUrl: string;
}

export function ImageDestinationGrid({
  items,
  className,
  onItemClick,
}: {
  items: ImageDestinationGridItem[];
  className?: string;
  /** When set, each cell is a button (tap opens lightbox, etc.). */
  onItemClick?: (itemId: string) => void;
}) {
  return (
    <div className={cn("w-full columns-2 gap-0", className)} aria-label="Image destination grid">
      {items.map((item) => {
        const frame = (
          <div className="relative box-border overflow-hidden rounded-none border border-white bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl}
              alt=""
              className={cn("block h-auto w-full", onItemClick && "pointer-events-none")}
              sizes="50vw"
              loading="lazy"
            />
          </div>
        );

        if (onItemClick) {
          return (
            <button
              key={item.id}
              type="button"
              className="block w-full cursor-pointer break-inside-avoid border-0 bg-transparent p-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              onClick={() => onItemClick(item.id)}
              aria-label="View scan"
            >
              {frame}
            </button>
          );
        }

        return (
          <div key={item.id} className="block break-inside-avoid">
            {frame}
          </div>
        );
      })}
    </div>
  );
}
