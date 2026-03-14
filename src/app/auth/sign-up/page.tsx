"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthLayout } from "@/components/auth/auth-layout";
import { getRedirectToSignUp, buildCallbackUrl } from "@/lib/auth-redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = getRedirectToSignUp(searchParams);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setMessage({ type: "error", text: "Please agree to the Terms and confirm you are 16+." });
      return;
    }
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: username || undefined },
        emailRedirectTo: buildCallbackUrl(redirectTo, window.location.origin),
      },
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
    <AuthLayout variant="sign-up">
      <h1 className="font-advercase mb-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
        Join the Club.
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Start your film database and join the community.
      </p>

      <form onSubmit={handleSignUp} className="flex flex-col gap-4">
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
            <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-foreground">
              Username
            </label>
            <Input
              id="username"
              type="text"
              placeholder="filmfan"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full"
              autoComplete="username"
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
              autoComplete="new-password"
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3 text-left">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
            />
            <span className="text-xs text-muted-foreground">
              By joining, you agree to the{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Terms
              </Link>{" "}
              and are 16+.
            </span>
          </label>

          {message && (
            <p
              className={cn(
                "text-sm",
                message.type === "error" ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
              )}
            >
              {message.text}
            </p>
          )}
          <Button type="submit" disabled={loading} className="h-10 w-full">
            {loading ? "Creating account…" : "Join the Club"}
          </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={`/auth/sign-in?next=${encodeURIComponent(redirectTo)}`}
          className="font-medium text-primary hover:underline"
        >
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[dvh] items-center justify-center text-muted-foreground">
          Loading…
        </div>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}
