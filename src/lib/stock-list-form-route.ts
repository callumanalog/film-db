/**
 * List flows use a full-viewport sheet (no site header / footer):
 * create, edit, and published list detail at `/lists/:id`.
 * Bottom nav stays visible on published viewer; see `isStockListFormEditorPath`.
 */
export function isStockListFormFullscreenPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if (pathname === "/lists/new") return true;
  if (!pathname.startsWith("/lists/")) return false;
  const segments = pathname.slice("/lists/".length).split("/").filter(Boolean);
  if (segments.length === 1 && segments[0] !== "new") {
    return true;
  }
  if (segments.length === 2 && segments[1] === "edit") {
    return true;
  }
  return false;
}

/** Create / edit only — hide bottom nav and use `list-form-fullscreen` main padding. */
export function isStockListFormEditorPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if (pathname === "/lists/new") return true;
  if (!pathname.startsWith("/lists/")) return false;
  const segments = pathname.slice("/lists/".length).split("/").filter(Boolean);
  return segments.length === 2 && segments[1] === "edit";
}
