"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button, buttonVariants } from "@/components/ui/button";
import { SITE_NAME, getSupportEmail } from "@/lib/site";
import { cn } from "@/lib/utils";

export function ProfileSettingsClient() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const support = getSupportEmail();

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Sign in to manage your account.</p>
        <Link
          href="/auth/sign-in?next=/profile/settings"
          className={buttonVariants({ variant: "secondary", size: "default" })}
        >
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 max-w-md space-y-8">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Security</h2>
        <p className="text-sm text-muted-foreground">
          To change your password, we&apos;ll email you a secure reset link.
        </p>
        <Link
          href="/auth/forgot-password"
          className={cn(buttonVariants({ variant: "secondary", size: "default" }), "w-full sm:w-auto")}
        >
          Reset password
        </Link>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Session</h2>
        <Button
          type="button"
          variant="outline"
          size="default"
          className="w-full sm:w-auto"
          onClick={async () => {
            await signOut();
            router.push("/");
            router.refresh();
          }}
        >
          Log out
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Legal & support</h2>
        <ul className="flex flex-col gap-2 text-sm">
          <li>
            <Link href="/terms" className="text-primary underline-offset-2 hover:underline">
              Terms of use
            </Link>
          </li>
          <li>
            <Link href="/privacy" className="text-primary underline-offset-2 hover:underline">
              Privacy Policy
            </Link>
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Account deletion and other requests:{" "}
          {support ? (
            <a href={`mailto:${support}`} className="font-medium text-primary underline underline-offset-2">
              {support}
            </a>
          ) : (
            <>contact us via the support email published on our website when available.</>
          )}{" "}
          Please include your {SITE_NAME} account email.
        </p>
      </section>
    </div>
  );
}
