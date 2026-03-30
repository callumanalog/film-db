import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SITE_NAME } from "@/lib/site";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function initialsFromName(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/[.\s_]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  return name.slice(0, 2).toUpperCase();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> {
  const { userId } = await params;
  if (!UUID_RE.test(userId)) return { title: "Member" };

  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle();

  const name = data?.display_name?.trim() || "Member";
  return { title: `${name} · ${SITE_NAME}` };
}

export default async function PublicUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  if (!UUID_RE.test(userId)) notFound();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) notFound();

  const displayName = data.display_name?.trim() || "Member";

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
      <Link
        href="/"
        className="text-sm font-medium text-primary hover:underline"
      >
        ← Discover
      </Link>
      <div className="mt-8 flex items-center gap-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-lg font-semibold text-neutral-800 ring-1 ring-neutral-300 dark:bg-white/15 dark:text-white dark:ring-white/10"
          aria-hidden
        >
          {initialsFromName(displayName)}
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight font-sans">{displayName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{SITE_NAME} member</p>
        </div>
      </div>
    </div>
  );
}
