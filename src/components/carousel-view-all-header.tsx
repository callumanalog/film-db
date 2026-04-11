import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CarouselViewAllHeaderProps {
  href: string;
  title: ReactNode;
  titleId?: string;
  /** Extra classes on the outer row (e.g. spacing below this row). */
  className?: string;
}

/**
 * One tappable row: section title + chevron (e.g. “Scans ›”), full width, 44px min height.
 * Title uses foreground; chevron stays muted like the old “More” control.
 */
export function CarouselViewAllHeader({ href, title, titleId, className }: CarouselViewAllHeaderProps) {
  return (
    <div className={cn(className)}>
      <Link
        href={href}
        className={cn(
          "flex min-h-11 w-full min-w-0 items-center justify-start gap-0.5 rounded-[7px] pr-1",
          "-mr-3 sm:-mr-5 lg:-mr-7",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        )}
      >
        <h3
          id={titleId}
          className="m-0 flex min-h-5 min-w-0 max-w-[calc(100%-1.75rem)] shrink items-center truncate text-base font-semibold leading-none tracking-tight text-foreground"
        >
          {title}
        </h3>
        <ChevronRight
          className="block size-5 shrink-0 self-center text-muted-foreground"
          strokeWidth={2.5}
          aria-hidden
        />
      </Link>
    </div>
  );
}
