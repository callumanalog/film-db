"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthLayout } from "@/components/auth/auth-layout";
import { getRedirectTo } from "@/lib/auth-redirect";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const redirectTo = getRedirectTo(searchParams);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
    });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setSent(true);
    setMessage({ type: "success", text: "Check your email for the reset link." });
  };

  if (sent) {
    return (
      <AuthLayout variant="sign-in">
        <h1 className="font-sans mb-2 text-center text-2xl font-bold tracking-tight text-foreground md:text-3xl lg:text-left">
          Check your email
        </h1>
        <p className="mb-6 text-center text-sm text-muted-foreground lg:text-left">
          We sent a password reset link to your email.
        </p>
        <p className="text-sm text-emerald-600 dark:text-emerald-400">{message?.text}</p>
        <Link href={`/auth/sign-in?next=${encodeURIComponent(redirectTo)}`} className="mt-6 inline-block text-sm font-medium text-primary hover:underline">
          Back to Log in
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout variant="sign-in">
      <h1 className="font-sans mb-2 text-center text-2xl font-bold tracking-tight text-foreground md:text-3xl lg:text-left">
        Forgot password?
      </h1>
      <p className="mb-6 text-center text-sm text-muted-foreground lg:text-left">
        Enter your email and we&apos;ll send you a reset link.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <TextField
          id="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        {message && (
          <p className={`text-sm ${message.type === "error" ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>
            {message.text}
          </p>
        )}
        <Button type="submit" size="cta" disabled={loading} className="w-full">
          {loading ? "Sending…" : "Send reset link"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link href={`/auth/sign-in?next=${encodeURIComponent(redirectTo)}`} className="font-medium text-primary hover:underline">
          Back to Log in
        </Link>
      </p>
    </AuthLayout>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[dvh] items-center justify-center text-muted-foreground">
          Loading…
        </div>
      }
    >
      <ForgotPasswordForm />
    </Suspense>
  );
}
