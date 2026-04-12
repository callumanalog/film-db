/** Dispatched from discover `/search` client so mobile chrome (e.g. add-roll FAB) can react. */
export const DISCOVER_SEARCH_FAB_VISIBILITY_EVENT = "film-db:discover-search-fab-visibility";

export type DiscoverSearchFabVisibilityDetail = {
  hidden: boolean;
};
