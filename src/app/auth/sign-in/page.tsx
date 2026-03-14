"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthLayout } from "@/components/auth/auth-layout";
import { getRedirectTo } from "@/lib/auth-redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = getRedirectTo(searchParams);
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
    router.push(redirectTo);
    router.refresh();
  };

  return (
    <AuthLayout variant="sign-in">
      <h1 className="font-advercase mb-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
        Welcome back.
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Access your locker and shared rolls.
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
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <Link
                href={`/auth/forgot-password?next=${encodeURIComponent(redirectTo)}`}
                className="text-xs text-primary hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
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
          <Button type="submit" disabled={loading} className="h-10 w-full">
            {loading ? "Logging in…" : "Log in"}
          </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href={`/auth/sign-up?next=${encodeURIComponent(redirectTo)}`}
          className="font-medium text-primary hover:underline"
        >
          Join the Club
        </Link>
      </p>
    </AuthLayout>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[dvh] items-center justify-center text-muted-foreground">
          Loading…
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
