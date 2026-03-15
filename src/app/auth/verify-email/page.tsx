"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Mail } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [resendStatus, setResendStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");

  const handleResend = async () => {
    if (!email || resendStatus === "loading") return;
    setResendStatus("loading");
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    if (error) {
      setResendStatus("error");
      return;
    }
    setResendStatus("sent");
  };

  return (
    <AuthLayout variant="verify">
      <div className="flex flex-col items-center text-center">
        <div
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted text-muted-foreground"
          aria-hidden
        >
          <Mail className="h-10 w-10" strokeWidth={1.5} />
        </div>

        <h2 className="font-sans text-xl font-bold text-foreground mb-3">
          Verify your email address
        </h2>

        <p className="mb-8 max-w-md text-sm text-muted-foreground">
          To use your new FilmDB account, please open the email we just sent you and click on the{" "}
          <strong className="font-semibold text-foreground">Activate my account</strong> button.
        </p>

        <div className="w-full space-y-4 text-left text-sm text-muted-foreground">
          <p>
            Didn&apos;t receive an email? Check your spam folder or{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={resendStatus === "loading" || !email}
              className="font-medium text-primary hover:underline disabled:opacity-50"
            >
              {resendStatus === "loading"
                ? "Sending…"
                : resendStatus === "sent"
                  ? "Email sent again"
                  : "send the email again"}
            </button>
            .
          </p>
          <p>
            Still having issues? Please{" "}
            <a
              href="mailto:support@filmdb.com"
              className="font-medium text-primary hover:underline"
            >
              reach out to us
            </a>
            .
          </p>
        </div>

        {resendStatus === "sent" && (
          <p className="mt-4 text-sm text-emerald-600 dark:text-emerald-400">
            We&apos;ve sent another confirmation email.
          </p>
        )}
        {resendStatus === "error" && (
          <p className="mt-4 text-sm text-destructive">
            Couldn&apos;t resend. Wait a moment and try again, or reach out to us.
          </p>
        )}
      </div>

      <p className="mt-10 text-center text-sm text-muted-foreground">
        <Link href="/auth/sign-in" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[dvh] items-center justify-center text-muted-foreground">
          Loading…
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
