"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

type SortValue = "highest-rated" | "alphabetical";

const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: "highest-rated", label: "Highest rated" },
  { value: "alphabetical", label: "Alphabetical" },
];

interface FilmsSortBarProps {
  currentSort: SortValue;
}

export function FilmsSortBar({ currentSort }: FilmsSortBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setSort(value: SortValue) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "highest-rated") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    const q = params.toString();
    router.push(q ? `/films?${q}` : "/films");
  }

  return (
    <div className="flex flex-shrink-0 items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Sort by:
      </span>
      <Select value={currentSort} onValueChange={(v) => setSort(v as SortValue)}>
        <SelectTrigger className="w-[140px]" size="sm">
          <span>
            {SORT_OPTIONS.find((o) => o.value === currentSort)?.label ??
              "Highest rated"}
          </span>
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}