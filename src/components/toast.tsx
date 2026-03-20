"use client";

import { toast } from "sonner";

export const TOAST_EVENT_NAME = "film-db-toast";

/**
 * Trigger a toast from anywhere — inside or outside React.
 * Uses Sonner's toast() directly when called from client code.
 * Also dispatches a CustomEvent for legacy listeners.
 */
export function showToastViaEvent(message: string): void {
  if (typeof window === "undefined") return;
  toast(message);
}

/**
 * Legacy hook kept for backward compatibility.
 * Prefer calling showToastViaEvent directly.
 */
export function useToast() {
  return { showToast: showToastViaEvent };
}
