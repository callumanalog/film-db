/**
 * List flows use a full-viewport sheet (no site header / bottom nav):
 * create, edit, and published list detail at `/lists/:id`.
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
