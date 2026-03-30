"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ListPlus, Plus } from "lucide-react";
import { addStockToList, listMyStockListsForPicker } from "@/app/actions/stock-lists";
import { showToastViaEvent } from "@/components/toast";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type PickerRow = { id: string; title: string; itemCount: number };

export function AddToListsSheet({
  open,
  onOpenChange,
  filmStockSlug,
  stockName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filmStockSlug: string;
  stockName: string;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [lists, setLists] = useState<PickerRow[]>([]);
  const [addingId, setAddingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const rows = await listMyStockListsForPicker();
      setLists(rows);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!open || !user) return;
    void load();
  }, [open, user, load]);

  function goCreateList() {
    onOpenChange(false);
    router.push(`/lists/new?addStock=${encodeURIComponent(filmStockSlug)}`);
  }

  async function pickList(listId: string, title: string) {
    setAddingId(listId);
    try {
      const res = await addStockToList(listId, filmStockSlug);
      if (res.ok) {
        showToastViaEvent(`Added to ${title}`);
        onOpenChange(false);
        router.refresh();
      } else if (res.error === "duplicate") {
        showToastViaEvent("Already on this list.");
      } else {
        showToastViaEvent("Could not add to list.");
      }
    } finally {
      setAddingId(null);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85dvh] gap-0 p-0" showCloseButton>
        <SheetHeader className="border-b border-border/60 px-4 pb-3 text-left">
          <SheetTitle>Add to lists</SheetTitle>
          <p className="text-left text-sm font-normal text-muted-foreground">{stockName}</p>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {!user ? (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">Sign in to use lists.</p>
          ) : loading ? (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : lists.length === 0 ? (
            <div className="space-y-3 px-2 py-6">
              <p className="text-center text-sm text-muted-foreground">You don&apos;t have any lists yet.</p>
              <Button type="button" className="w-full" size="cta" onClick={goCreateList}>
                <ListPlus className="mr-2 size-4" />
                Create a list
              </Button>
            </div>
          ) : (
            <>
              <ul className="flex flex-col">
                {lists.map((b) => (
                  <li key={b.id} className="border-b border-border/50 last:border-b-0">
                    <div className="flex min-h-[52px] items-center gap-2 px-3 py-2">
                      <span className="min-w-0 flex-1 font-sans text-base text-foreground">{b.title}</span>
                      <span className="shrink-0 font-sans text-caption text-muted-foreground tabular-nums">
                        {b.itemCount} {b.itemCount === 1 ? "stock" : "stocks"}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0"
                        aria-label={`Add to ${b.title}`}
                        disabled={addingId !== null}
                        onClick={() => void pickList(b.id, b.title)}
                      >
                        {addingId === b.id ? (
                          <span className="text-caption">…</span>
                        ) : (
                          <Plus className="size-5" strokeWidth={2} aria-hidden />
                        )}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-3 px-2">
                <Button type="button" variant="outline" className="w-full" onClick={goCreateList}>
                  <ListPlus className="mr-2 size-4" />
                  Create new list
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
