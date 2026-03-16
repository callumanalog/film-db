"use client";

import { LoggedRollMenu } from "@/components/logged-roll-menu";
import type { LoggedRollEntry } from "@/app/actions/user-actions";

interface RollsTabContentProps {
  loggedRolls: LoggedRollEntry[];
  slug: string;
}

export function RollsTabContent({ loggedRolls, slug }: RollsTabContentProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">Your rolls</h2>
      <p className="text-sm text-muted-foreground">
        Rolls you&apos;ve logged for this stock (e.g. In Fridge). Log a roll from the button on this page.
      </p>
      {loggedRolls.length === 0 ? (
        <p className="rounded-[7px] border border-dashed border-border/50 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          No rolls yet. Use &quot;Log a roll&quot; above to add one and track it through the fridge, camera, processing, and beyond.
        </p>
      ) : (
        <ul className="space-y-3">
          {loggedRolls.map((roll) => (
            <li key={roll.id} className="rounded-[7px] border border-border/50 bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm">
                    {roll.format && <span>Format: {roll.format}</span>}
                    {roll.status && <span>Status: {roll.status}</span>}
                    {roll.expiry_date && <span>Expiry: {roll.expiry_date}</span>}
                    {roll.quantity > 1 && <span>Qty: {roll.quantity}</span>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Logged {new Date(roll.created_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </p>
                </div>
                <LoggedRollMenu rollId={roll.id} filmSlug={slug} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
