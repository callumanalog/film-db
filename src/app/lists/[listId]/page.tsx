import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SITE_NAME } from "@/lib/site";
import { StockListDetailClient } from "@/components/stock-list-detail-client";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Props = { params: Promise<{ listId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { listId } = await params;
  if (!UUID_RE.test(listId)) return { title: "List", description: `Film stock list on ${SITE_NAME}.` };

  const supabase = await createClient();
  const { data } = await supabase.from("stock_lists").select("title").eq("id", listId).maybeSingle();
  const title = data?.title?.trim() || "List";
  return { title, description: `${title} — film stock list on ${SITE_NAME}.` };
}

export default async function StockListPage({ params }: Props) {
  const { listId } = await params;
  if (!UUID_RE.test(listId)) notFound();

  const supabase = await createClient();
  const { data: list } = await supabase.from("stock_lists").select("user_id").eq("id", listId).maybeSingle();
  if (!list) notFound();

  const { data: prof } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", list.user_id as string)
    .maybeSingle();
  const ownerName = prof?.display_name?.trim() || "Member";

  return <StockListDetailClient listId={listId} initialOwnerDisplayName={ownerName} />;
}
