"use client";

import { createContext, useCallback, useContext, useRef, type ReactNode } from "react";

type OpenLogRollFn = () => void;

interface LogRollTriggerContextValue {
  registerOpenLogRoll: (fn: OpenLogRollFn) => void;
  unregisterOpenLogRoll: () => void;
  openLogRoll: () => void;
}

const LogRollTriggerContext = createContext<LogRollTriggerContextValue | null>(null);

export function LogRollTriggerProvider({ children }: { children: ReactNode }) {
  const openRef = useRef<OpenLogRollFn | null>(null);

  const registerOpenLogRoll = useCallback((fn: OpenLogRollFn) => {
    openRef.current = fn;
  }, []);

  const unregisterOpenLogRoll = useCallback(() => {
    openRef.current = null;
  }, []);

  const openLogRoll = useCallback(() => {
    openRef.current?.();
  }, []);

  return (
    <LogRollTriggerContext.Provider
      value={{ registerOpenLogRoll, unregisterOpenLogRoll, openLogRoll }}
    >
      {children}
    </LogRollTriggerContext.Provider>
  );
}

export function useLogRollTrigger() {
  const ctx = useContext(LogRollTriggerContext);
  if (!ctx) return null;
  return ctx;
}
