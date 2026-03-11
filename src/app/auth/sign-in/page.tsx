"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Film } from "lucide-react";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/profile";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    router.push(next);
    router.refresh();
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setMessage({
      type: "success",
      text: "Check your email for the confirmation link, then sign in.",
    });
  };

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2.5 font-advercase">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
          <Film className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold tracking-tight">FilmDB</span>
      </Link>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">Sign in</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Sign in to your account to save reviews, uploads, and your profile.
      </p>
      <form onSubmit={handleSignIn} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full"
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
            Password
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full"
            autoComplete="current-password"
          />
        </div>
        {message && (
          <p
            className={`text-sm ${message.type === "error" ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}
          >
            {message.text}
          </p>
        )}
        <div className="flex gap-2">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? "Signing in…" : "Sign in"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={handleSignUp}
            className="flex-1"
          >
            Sign up
          </Button>
        </div>
      </form>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Don&apos;t have an account? Use the same form and click &quot;Sign up&quot; — we&apos;ll send a confirmation link to your email.
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center px-4 py-12 text-center text-muted-foreground">Loading…</div>}>
      <SignInForm />
    </Suspense>
  );
}
