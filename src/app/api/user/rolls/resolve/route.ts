import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const serviceRole = await createServiceRoleClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { review_id?: string; upload_batch_id?: string; upload_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const reviewId = (body.review_id ?? "").trim();
  const uploadBatchId = (body.upload_batch_id ?? "").trim();
  const uploadId = (body.upload_id ?? "").trim();

  type UploadRow = {
    id: string;
    review_id: string | null;
    upload_batch_id: string | null;
    film_stock_slug: string;
    roll_id: string | null;
  };
  let rows: UploadRow[] = [];

  if (reviewId) {
    const { data, error } = await supabase
      .from("user_uploads")
      .select("id,review_id,upload_batch_id,film_stock_slug,roll_id")
      .eq("review_id", reviewId)
      .eq("user_id", user.id)
      .limit(25);
    if (error) return NextResponse.json({ error: "Could not resolve roll" }, { status: 500 });
    rows = (data as UploadRow[]) ?? [];
  } else if (uploadBatchId) {
    const { data, error } = await supabase
      .from("user_uploads")
      .select("id,review_id,upload_batch_id,film_stock_slug,roll_id")
      .eq("upload_batch_id", uploadBatchId)
      .eq("user_id", user.id)
      .limit(25);
    if (error) return NextResponse.json({ error: "Could not resolve roll" }, { status: 500 });
    rows = (data as UploadRow[]) ?? [];
  } else if (uploadId) {
    const { data, error } = await supabase
      .from("user_uploads")
      .select("id,review_id,upload_batch_id,film_stock_slug,roll_id")
      .eq("id", uploadId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error || !data) return NextResponse.json({ error: "Could not resolve roll" }, { status: 500 });
    rows = [data as UploadRow];
  } else {
    return NextResponse.json(
      { error: "Send one of review_id, upload_batch_id, or upload_id" },
      { status: 400 }
    );
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "No uploads found for this roll" }, { status: 404 });
  }

  const existingRollId = rows.find((r) => r.roll_id?.trim())?.roll_id?.trim();
  if (existingRollId) {
    return NextResponse.json({ rollId: existingRollId, reviewId: rows[0]?.review_id ?? null });
  }

  const filmStockSlug = rows[0]!.film_stock_slug;
  const linkedReviewId = rows[0]!.review_id;
  const creator = serviceRole ?? supabase;
  const { data: createdRoll, error: rollErr } = await creator
    .from("rolls")
    .insert({
      user_id: user.id,
      film_stock_slug: filmStockSlug,
      review_id: linkedReviewId,
    })
    .select("id")
    .single();
  if (rollErr || !createdRoll?.id) {
    return NextResponse.json({ error: "Could not create roll" }, { status: 500 });
  }

  const rollId = createdRoll.id as string;
  const ids = rows.map((r) => r.id);
  const { error: upErr } = await (serviceRole ?? supabase)
    .from("user_uploads")
    .update({ roll_id: rollId })
    .in("id", ids)
    .eq("user_id", user.id);
  if (upErr) return NextResponse.json({ error: "Could not attach uploads to roll" }, { status: 500 });

  return NextResponse.json({ rollId, reviewId: linkedReviewId ?? null });
}
