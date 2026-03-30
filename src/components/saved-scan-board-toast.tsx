"use client";

import { toast } from "sonner";
import { userHasBoards } from "@/app/actions/boards";
import { BOARD_FLOW_EVENT, type BoardFlowDetail } from "@/lib/board-flow-events";

export async function showSavedScanBoardToast(uploadId: string): Promise<void> {
  const hasBoards = await userHasBoards();
  const detail: BoardFlowDetail = {
    kind: hasBoards ? "add" : "create",
    uploadId,
  };
  toast("Scan saved", {
    action: {
      label: hasBoards ? "Add to board" : "Create board",
      onClick: () => {
        window.dispatchEvent(new CustomEvent(BOARD_FLOW_EVENT, { detail }));
      },
    },
  });
}
