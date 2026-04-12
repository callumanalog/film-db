/** Lets mobile chrome hide the add-roll FAB while share-a-roll UI is open (multiple sources). */
export const ADD_ROLL_FLOW_FAB_VISIBILITY_EVENT = "film-db:add-roll-flow-fab-visibility";

export type AddRollFlowFabVisibilitySource = "plus-sheet" | "upload-modal";

export type AddRollFlowFabVisibilityDetail = {
  source: AddRollFlowFabVisibilitySource;
  hidden: boolean;
};
