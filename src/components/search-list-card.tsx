"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface SearchListCardProps {
  href: string;
  thumb: React.ReactNode;
  title: string;
}

/** Single list card for mobile search: white background, bottom border, title only, vertically aligned with image and chevron. */
export function SearchListCard({ href, thumb, title }: SearchListCardProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 border-b border-border bg-white py-3"
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-slate-100">
        {thumb}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{title}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  );
}
