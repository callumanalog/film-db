"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { getProfileFromSupabase } from "@/app/actions/get-profile";
import { getStocksBySlugs } from "@/app/actions/get-film-stocks";
import { LoggedRollMenu } from "@/components/logged-roll-menu";
import { useAuth } from "@/context/auth-context";
import type { FilmStock, FilmBrand } from "@/lib/types";
import type { LoggedRollEntry } from "@/app/actions/user-actions";

type StockWithBrand = FilmStock & { brand: FilmBrand };

const ROLLS_STATUS_OPTIONS: { value: "all" | "in_fridge" | "in_camera" | "awaiting_dev" | "at_lab"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "in_fridge", label: "In Fridge" },
  { value: "in_camera", label: "In Camera" },
  { value: "awaiting_dev", label: "Processing" },
  { value: "at_lab", label: "Scanned" },
];

export function VaultPageClient() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loggedRolls, setLoggedRolls] = useState<LoggedRollEntry[]>([]);
  const [stocksBySlug, setStocksBySlug] = useState<Map<string, StockWithBrand>>(new Map());
  const [statusFilter, setStatusFilter] = useState<"all" | "in_fridge" | "in_camera" | "awaiting_dev" | "at_lab">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth/sign-in?next=/vault");
      return;
    }
    let cancelled = false;
    setLoading(true);
    getProfileFromSupabase()
      .then((p) => {
        if (cancelled || !p) return;
        const rolls = p.loggedRolls ?? [];
        setLoggedRolls(rolls);
        const slugs = [...new Set(rolls.map((r) => r.film_stock_slug))];
        if (slugs.length === 0) return Promise.resolve([]);
        return getStocksBySlugs(slugs);
      })
      .then((stocks) => {
        if (cancelled || !stocks) return;
        const map = new Map<string, StockWithBrand>();
        stocks.forEach((s) => map.set(s.slug, s as StockWithBrand));
        setStocksBySlug(map);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user, authLoading, router]);

  const filteredRolls =
    statusFilter === "all"
      ? loggedRolls
      : loggedRolls.filter((e) => e.status === statusFilter);

  if (authLoading || (user && loading)) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight font-advercase">The Vault</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your logged rolls — in the fridge, in camera, processing, or scanned.
      </p>

      {loggedRolls.length === 0 ? (
        <p className="mt-6 rounded-[7px] border border-dashed border-border/50 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          No rolls yet. Open a film page and tap Log a roll to add one.
        </p>
      ) : (
        <>
          <div className="mt-6 flex w-full overflow-hidden rounded-[7px] border border-slate-200 bg-background p-0.5">
            {ROLLS_STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatusFilter(opt.value)}
                className={cn(
                  "flex-1 px-3 py-2 text-sm font-medium transition-colors sm:px-4",
                  statusFilter === opt.value
                    ? "rounded-md bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {filteredRolls.length > 0 ? (
            <ul className="mt-4 space-y-4">
              {filteredRolls.map((entry) => {
                const stock = stocksBySlug.get(entry.film_stock_slug);
                if (!stock) return null;
                return (
                  <li key={entry.id}>
                    <div className="flex items-start gap-2 rounded-[7px] border border-border/50 bg-white p-4 transition-colors hover:border-primary/30 hover:bg-white">
                      <Link
                        href={`/films/${entry.film_stock_slug}?tab=rolls`}
                        className="min-w-0 flex-1"
                      >
                        <div className="flex flex-wrap items-start gap-4">
                          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-card bg-white">
                            {stock.image_url ? (
                              <Image
                                src={stock.image_url}
                                alt=""
                                width={80}
                                height={80}
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Camera className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground">{stock.name}</p>
                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                              {entry.format && <span>Format: {entry.format}</span>}
                              {entry.status && <span>Status: {entry.status}</span>}
                              {entry.expiry_date && <span>Expiry: {entry.expiry_date}</span>}
                              {entry.quantity > 1 && <span>Qty: {entry.quantity}</span>}
                            </div>
                          </div>
                        </div>
                      </Link>
                      <LoggedRollMenu rollId={entry.id} filmSlug={entry.film_stock_slug} />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 rounded-[7px] border border-dashed border-border/50 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
              No rolls in this status.
            </p>
          )}
        </>
      )}
    </div>
  );
}
