export const BOARD_FLOW_EVENT = "film-db-board-flow";

export type BoardFlowDetail = {
  kind: "create" | "add";
  uploadId: string;
};
