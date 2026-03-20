"use client";

/**
 * Toast bridge: dispatches a DOM event so Sonner can show the message without
 * importing `sonner` here (avoids duplicate resolution paths / install edge cases).
 */
export const TOAST_EVENT_NAME = "film-db-toast";

export function showToastViaEvent(message: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT_NAME, { detail: message }));
}

/**
 * Legacy hook kept for backward compatibility.
 * Prefer calling showToastViaEvent directly.
 */
export function useToast() {
  return { showToast: showToastViaEvent };
}
