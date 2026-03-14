"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

type SortValue = "alphabetical" | "newest";

const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: "alphabetical", label: "Alphabetical" },
  { value: "newest", label: "Newest" },
];

interface CamerasSortBarProps {
  currentSort: SortValue;
}

export function CamerasSortBar({ currentSort }: CamerasSortBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setSort(value: SortValue) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "alphabetical") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    const q = params.toString();
    router.push(q ? `/cameras?${q}` : "/cameras");
  }

  const currentLabel =
    SORT_OPTIONS.find((o) => o.value === currentSort)?.label ?? "Alphabetical";

  return (
    <Select value={currentSort} onValueChange={(v) => setSort(v as SortValue)}>
      <SelectTrigger
        size="sm"
        className="!h-[44px] w-fit border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 hover:bg-transparent md:!h-[36px] [&>svg]:text-muted-foreground"
      >
        <ArrowUpDown className="size-4 shrink-0 text-muted-foreground" />
        <span className="text-sm text-foreground md:hidden">Sort</span>
        <span className="hidden text-xs text-foreground md:inline">{currentLabel}</span>
      </SelectTrigger>
      <SelectContent
        alignItemWithTrigger={false}
        side="bottom"
        sideOffset={4}
        className="min-w-[8rem] rounded-card border border-border/60 bg-popover py-1"
      >
        {SORT_OPTIONS.map((opt) => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            className="h-[44px] cursor-pointer items-center rounded-card px-4 font-sans text-xs font-medium text-foreground focus:bg-primary/5 focus:text-foreground md:h-[36px] data-[focus]:bg-primary/5"
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
