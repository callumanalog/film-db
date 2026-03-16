"use client";

import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { deleteLoggedRoll } from "@/app/actions/user-actions";
import { invalidateVaultCache } from "@/app/vault/vault-page-client";

const DELETE_VALUE = "delete";

interface LoggedRollMenuProps {
  rollId: string;
  /** Pass to revalidate the film page after delete (e.g. film stock slug). */
  filmSlug?: string;
}

export function LoggedRollMenu({ rollId, filmSlug }: LoggedRollMenuProps) {
  const router = useRouter();

  function handleValueChange(value: string | null) {
    if (value !== DELETE_VALUE) return;
    deleteLoggedRoll(rollId, filmSlug).then(({ synced }) => {
      if (synced) {
        invalidateVaultCache();
        router.refresh();
      }
    });
  }

  return (
    <Select value="" onValueChange={handleValueChange}>
      <SelectTrigger
        size="sm"
        className="!h-9 w-9 shrink-0 border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 hover:bg-muted/50 rounded-full [&>svg:last-child]:hidden"
        aria-label="Roll options"
      >
        <MoreVertical className="size-4 shrink-0 text-muted-foreground" />
      </SelectTrigger>
      <SelectContent
        alignItemWithTrigger={false}
        side="bottom"
        sideOffset={4}
        align="end"
        className="min-w-[8rem] rounded-card border border-border/60 bg-popover py-1"
      >
        <SelectItem
          value={DELETE_VALUE}
          className="h-[44px] cursor-pointer items-center rounded-card px-4 font-sans text-xs font-medium text-foreground focus:bg-primary/5 focus:text-foreground md:h-[36px] data-[focus]:bg-primary/5"
        >
          Delete roll
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
