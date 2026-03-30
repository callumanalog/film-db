"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let applyTimer: ReturnType<typeof setTimeout> | null = null;
    const supabase = createClient();

    const applySession = (session: Session | null) => {
      if (cancelled) return;
      if (applyTimer != null) clearTimeout(applyTimer);
      // Macrotask deferral: queueMicrotask still runs before some fibers finish mounting (React 19 dev),
      // which triggers "Can't perform a React state update on a component that hasn't mounted yet".
      applyTimer = setTimeout(() => {
        applyTimer = null;
        if (cancelled) return;
        setUser(session?.user ?? null);
        setLoading(false);
      }, 0);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session);
    });

    return () => {
      cancelled = true;
      if (applyTimer != null) clearTimeout(applyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
