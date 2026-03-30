"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { listBoardsForPicker, addUploadToBoard } from "@/app/actions/boards";
import { showToastViaEvent } from "@/components/toast";

export type AddToBoardSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uploadId: string | null;
  onAdded?: () => void;
};

export function AddToBoardSheet({ open, onOpenChange, uploadId, onAdded }: AddToBoardSheetProps) {
  const router = useRouter();
  const [boards, setBoards] = useState<{ id: string; name: string; itemCount: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listBoardsForPicker();
      setBoards(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  async function handleAdd(boardId: string, boardName: string) {
    const uid = uploadId?.trim();
    if (!uid) return;
    setAddingId(boardId);
    try {
      const res = await addUploadToBoard(boardId, uid);
      if (res.ok) {
        showToastViaEvent(`Scan added to ${res.boardName}`);
        onAdded?.();
        onOpenChange(false);
        router.refresh();
      } else if (res.error === "duplicate") {
        showToastViaEvent(`Already on ${boardName}.`);
      } else {
        showToastViaEvent(res.error === "not_found" ? "Could not add scan." : res.error);
      }
    } finally {
      setAddingId(null);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85dvh] gap-0 p-0" showCloseButton>
        <SheetHeader className="border-b border-border/60 text-left">
          <SheetTitle>Add to board</SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {loading ? (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">Loading boards…</p>
          ) : boards.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">Create a board from your profile first.</p>
          ) : (
            <ul className="flex flex-col">
              {boards.map((b) => (
                <li key={b.id} className="border-b border-border/50 last:border-b-0">
                  <div className="flex min-h-[52px] items-center gap-2 px-3 py-2">
                    <span className="min-w-0 flex-1 font-sans text-base text-foreground">{b.name}</span>
                    <span className="shrink-0 font-sans text-caption text-muted-foreground tabular-nums">
                      {b.itemCount} {b.itemCount === 1 ? "scan" : "scans"}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0"
                      aria-label={`Add to ${b.name}`}
                      disabled={addingId !== null}
                      onClick={() => void handleAdd(b.id, b.name)}
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
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
