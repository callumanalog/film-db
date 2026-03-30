"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBoard, updateBoard, addUploadToBoard } from "@/app/actions/boards";
import { showToastViaEvent } from "@/components/toast";
import { cn } from "@/lib/utils";

const NAME_MAX = 100;
const DESC_MAX = 500;

export type BoardFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  boardId?: string;
  initialName?: string;
  initialDescription?: string;
  /** After creating a board, add this upload (user_uploads id) to the new board. */
  pendingUploadIdAfterCreate?: string | null;
  onSuccess?: () => void;
};

export function BoardFormSheet({
  open,
  onOpenChange,
  mode,
  boardId,
  initialName = "",
  initialDescription = "",
  pendingUploadIdAfterCreate = null,
  onSuccess,
}: BoardFormSheetProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initialName);
    setDescription(initialDescription);
  }, [open, initialName, initialDescription]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) {
      showToastViaEvent("Enter a board name.");
      return;
    }
    setSaving(true);
    try {
      if (mode === "create") {
        const res = await createBoard(n, description.trim() || null);
        if (!res.ok || !res.boardId) {
          showToastViaEvent(res.ok === false ? res.error : "Could not create board.");
          return;
        }
        let boardNameForToast = n;
        if (pendingUploadIdAfterCreate) {
          const add = await addUploadToBoard(res.boardId, pendingUploadIdAfterCreate);
          if (add.ok) {
            boardNameForToast = add.boardName;
            showToastViaEvent(`Scan added to ${boardNameForToast}`);
          } else if (add.error === "duplicate") {
            showToastViaEvent("That scan is already on this board.");
          } else {
            showToastViaEvent("Board created. Could not add the scan — add it from the board page.");
          }
        } else {
          showToastViaEvent("Board created.");
        }
        onSuccess?.();
        onOpenChange(false);
        router.refresh();
      } else {
        const id = boardId?.trim();
        if (!id) {
          showToastViaEvent("Missing board.");
          return;
        }
        const res = await updateBoard(id, n, description.trim() || null);
        if (!res.ok) {
          showToastViaEvent(res.error === "not_found" ? "Board not found." : res.error);
          return;
        }
        showToastViaEvent("Board updated.");
        onSuccess?.();
        onOpenChange(false);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90dvh] gap-0 p-0" showCloseButton>
        <form onSubmit={(e) => void handleSubmit(e)} className="flex max-h-[90dvh] flex-col">
          <SheetHeader className="border-b border-border/60 pb-3 text-left">
            <SheetTitle>{mode === "create" ? "Create board" : "Edit board"}</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            <div>
              <label htmlFor="board-name" className={cn("text-field-label mb-1 block")}>
                Name
              </label>
              <Input
                id="board-name"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, NAME_MAX))}
                placeholder="Board name"
                className="rounded-card"
                autoComplete="off"
                maxLength={NAME_MAX}
              />
            </div>
            <div>
              <label htmlFor="board-desc" className={cn("text-field-label mb-1 block")}>
                Description <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <textarea
                id="board-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, DESC_MAX))}
                placeholder="What is this board for?"
                rows={4}
                className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full resize-none rounded-card border px-3 py-2 text-sm outline-none focus-visible:ring-[3px]"
              />
            </div>
          </div>
          <SheetFooter className="border-t border-border/60 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button type="submit" size="cta" variant="default" className="w-full" disabled={saving}>
              {saving ? "Saving…" : mode === "create" ? "Create board" : "Save changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
