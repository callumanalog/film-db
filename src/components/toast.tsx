"use client";

import { createContext, useCallback, useContext, useState, useEffect, useRef, type ReactNode } from "react";

type ToastMessage = string;

interface ToastContextValue {
  showToast: (message: ToastMessage) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 3000;

export const TOAST_EVENT_NAME = "film-db-toast";

function showToastViaEvent(message: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(TOAST_EVENT_NAME, { detail: { message } }));
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<ToastMessage | null>(null);

  const showToast = useCallback((msg: ToastMessage) => {
    setMessage(msg);
    const t = setTimeout(() => setMessage(null), TOAST_DURATION_MS);
    return () => clearTimeout(t);
  }, []);

  // Listen for global toast events (works even if caller is not in same context tree)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ message?: string }>).detail;
      const msg = detail?.message;
      if (msg) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setMessage(msg);
        timeoutRef.current = setTimeout(() => {
          setMessage(null);
          timeoutRef.current = null;
        }, TOAST_DURATION_MS);
      }
    };
    window.addEventListener(TOAST_EVENT_NAME, handler);
    return () => {
      window.removeEventListener(TOAST_EVENT_NAME, handler);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as unknown as { __filmDbShowToast?: (m: string) => void }).__filmDbShowToast = (m) => showToast(m);
    }
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast: inline styles only so it's always visible regardless of Tailwind/CSS */}
      {message !== null ? (
        <div
          role="status"
          aria-live="polite"
          data-toast
          className="fixed bottom-6 right-6 lg:left-6 lg:right-auto"
          style={{
            zIndex: 2147483647,
            maxWidth: 320,
            padding: "12px 16px",
            backgroundColor: "#fff",
            color: "#111",
            fontSize: 14,
            fontWeight: 500,
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            border: "1px solid #e5e5e5",
            whiteSpace: "pre-line",
          }}
        >
          {message}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

/** Trigger a toast from anywhere (e.g. outside React or different tree). Use this in film page actions. */
export { showToastViaEvent };
