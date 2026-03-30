"use client";

import { useEffect, useState, useCallback } from "react";
import { BOARD_FLOW_EVENT, type BoardFlowDetail } from "@/lib/board-flow-events";
import { BoardFormSheet } from "@/components/board-form-sheet";
import { AddToBoardSheet } from "@/components/add-to-board-sheet";

/**
 * Handles “Create board” / “Add to board” from the post-save toast (global).
 */
export function BoardFlowHost() {
  const [createOpen, setCreateOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [uploadId, setUploadId] = useState<string | null>(null);

  const onFlow = useCallback((e: Event) => {
    const detail = (e as CustomEvent<BoardFlowDetail>).detail;
    if (!detail?.uploadId?.trim()) return;
    setUploadId(detail.uploadId.trim());
    if (detail.kind === "create") {
      setCreateOpen(true);
    } else {
      setAddOpen(true);
    }
  }, []);

  useEffect(() => {
    window.addEventListener(BOARD_FLOW_EVENT, onFlow);
    return () => window.removeEventListener(BOARD_FLOW_EVENT, onFlow);
  }, [onFlow]);

  return (
    <>
      <BoardFormSheet
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) setUploadId(null);
        }}
        mode="create"
        pendingUploadIdAfterCreate={uploadId}
        onSuccess={() => setUploadId(null)}
      />
      <AddToBoardSheet
        open={addOpen}
        onOpenChange={(o) => {
          setAddOpen(o);
          if (!o) setUploadId(null);
        }}
        uploadId={uploadId}
        onAdded={() => setUploadId(null)}
      />
    </>
  );
}
