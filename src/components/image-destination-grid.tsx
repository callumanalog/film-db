import { cn } from "@/lib/utils";

export interface ImageDestinationGridItem {
  id: string;
  imageUrl: string;
}

export function ImageDestinationGrid({
  items,
  className,
}: {
  items: ImageDestinationGridItem[];
  className?: string;
}) {
  return (
    <div className={cn("w-full columns-2 gap-0", className)} aria-label="Image destination grid">
      {items.map((item) => (
        <div key={item.id} className="block break-inside-avoid">
          <div className="relative box-border overflow-hidden rounded-none border border-white bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl}
              alt=""
              className="block h-auto w-full"
              sizes="50vw"
              loading="lazy"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
