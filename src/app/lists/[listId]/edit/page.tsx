import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { SITE_NAME } from "@/lib/site";
import { StockListFormClient } from "@/components/stock-list-form-client";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Props = { params: Promise<{ listId: string }> };

export const metadata: Metadata = {
  title: "Edit list",
  description: `Edit a film stock list on ${SITE_NAME}.`,
};

function FormFallback() {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-white dark:bg-background"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <p className="text-sm text-muted-foreground">Loading…</p>
    </div>
  );
}

export default async function EditStockListPage({ params }: Props) {
  const { listId } = await params;
  if (!UUID_RE.test(listId)) notFound();

  const supabase = await createClient();
  const { data: list } = await supabase.from("stock_lists").select("id").eq("id", listId).maybeSingle();
  if (!list) notFound();

  return (
    <Suspense fallback={<FormFallback />}>
      <StockListFormClient mode="edit" listId={listId} />
    </Suspense>
  );
}
