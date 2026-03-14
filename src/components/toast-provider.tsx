"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type ToastMessage = { id: number; text: string; variant?: "success" | "info" };

type ToastContextValue = {
  toast: (message: string, variant?: "success" | "info") => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { toast: () => {} };
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const toast = useCallback((text: string, variant: "success" | "info" = "success") => {
    const id = Date.now();
    setMessages((prev) => [...prev, { id, text, variant }]);
    setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 flex-col gap-2 pointer-events-none"
        role="status"
        aria-live="polite"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-card border px-4 py-2.5 text-sm font-medium shadow-lg ${
              m.variant === "info"
                ? "border-border bg-muted text-muted-foreground"
                : "border-primary/30 bg-primary/10 text-primary"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
