import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your FilmDB account settings.",
};

export default function ProfileSettingsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link
        href="/profile"
        className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to profile
      </Link>
      <h1 className="text-2xl font-bold tracking-tight font-advercase">Settings</h1>
      <p className="mt-2 text-sm text-muted-foreground">Account settings will appear here.</p>
    </div>
  );
}
