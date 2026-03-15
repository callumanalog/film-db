"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthLayout } from "@/components/auth/auth-layout";
import { getRedirectToSignUp, buildCallbackUrl, getEmailRedirectOrigin } from "@/lib/auth-redirect";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { checkUsernameAvailable } from "@/app/actions/check-username";
import { cn } from "@/lib/utils";

type UsernameStatus = "idle" | "checking" | "available" | "taken";

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
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const trimmed = username.trim();
    if (!trimmed) {
      setUsernameStatus("idle");
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setUsernameStatus("checking");
      const available = await checkUsernameAvailable(trimmed);
      setUsernameStatus(available ? "available" : "taken");
      debounceRef.current = null;
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [username]);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPasswordValid = password.length >= 8;
  const isUsernameOk = username.trim() === "" || usernameStatus === "available";
  const isFormValid = isEmailValid && isPasswordValid && agreeTerms && isUsernameOk;

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms) {
      setMessage({ type: "error", text: "Please agree to the Terms and confirm you are 16+." });
      return;
    }
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const origin = getEmailRedirectOrigin() || window.location.origin;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: username || undefined },
        emailRedirectTo: buildCallbackUrl(redirectTo, origin),
      },
    });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
    router.refresh();
  };

  return (
    <AuthLayout variant="sign-up">
      <h1 className="font-advercase mb-2 text-center text-2xl font-bold tracking-tight text-foreground md:text-3xl lg:text-left">
        Join the Club.
      </h1>
      <p className="mb-6 text-center text-sm text-muted-foreground lg:text-left">
        Start your film database and join the community.
      </p>

      <form onSubmit={handleSignUp} className="flex flex-col gap-4">
          <TextField
            id="email"
            name="email"
            label="Email"
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoCapitalize="none"
          />
          <TextField
            id="username"
            name="username"
            label="Username"
            type="text"
            prefix={"@\u00A0"}
            placeholder="Choose your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCorrect="off"
            autoCapitalize="none"
            labelSuffix={
              usernameStatus === "checking" ? (
                <span className="font-sans text-caption text-muted-foreground">Checking…</span>
              ) : usernameStatus === "available" ? (
                <span className="flex items-center gap-1 font-sans text-caption text-muted-foreground">
                  <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Available
                </span>
              ) : usernameStatus === "taken" ? (
                <span className="flex items-center gap-1 font-sans text-caption text-destructive">
                  <X className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Taken, please try another username
                </span>
              ) : null
            }
          />
          <div>
            <TextField
              id="password"
              name="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            {password.length > 0 && password.length < 8 && (
              <p className="mt-1 font-sans text-ui text-muted-foreground">
                Password must be at least 8 characters long
              </p>
            )}
          </div>

          <label className="mt-2 mb-2 flex cursor-pointer items-center gap-3 text-left">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="sr-only"
              aria-hidden
            />
            <span
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors",
                agreeTerms ? "bg-primary" : "bg-muted"
              )}
              aria-hidden
            >
              <span
                className={cn(
                  "absolute top-0.5 inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                  agreeTerms ? "left-5" : "left-0.5"
                )}
              />
            </span>
            <span className="text-xs text-muted-foreground">
              I agree to FilmDB&apos;s{" "}
              <Link href="#" className="underline text-muted-foreground hover:text-muted-foreground">
                Terms of use
              </Link>{" "}
              and{" "}
              <Link href="#" className="underline text-muted-foreground hover:text-muted-foreground">
                Privacy Policy
              </Link>
              , and to receive emails from FilmDB.
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
          <Button type="submit" variant="secondary" size="cta" disabled={loading || !isFormValid} className="w-full">
            {loading ? "Creating account…" : "Create account"}
          </Button>
      </form>

      <p className="mt-3 text-center text-field-label">
        Already have an account?{" "}
        <Link
          href={`/auth/sign-in?next=${encodeURIComponent(redirectTo)}`}
          className="font-medium text-foreground underline hover:text-primary"
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
