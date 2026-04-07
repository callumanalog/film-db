import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Ensures community scans have a `reviews` row so PATCH / share-roll edit works.
 * Call when `user_uploads.review_id` was never set (legacy photo-only shares).
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const serviceRole = await createServiceRoleClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { upload_batch_id?: string; upload_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const batchId = typeof body.upload_batch_id === "string" ? body.upload_batch_id.trim() : "";
  const uploadId = typeof body.upload_id === "string" ? body.upload_id.trim() : "";
  const modes = [batchId, uploadId].filter(Boolean).length;
  if (modes !== 1) {
    return NextResponse.json(
      { error: "Send exactly one of upload_batch_id or upload_id" },
      { status: 400 }
    );
  }

  const userId = user.id;

  async function insertEmptyReview(filmStockSlug: string): Promise<string | null> {
    const { data: inserted, error: reviewError } = await supabase
      .from("reviews")
      .insert({
        user_id: userId,
        film_stock_slug: filmStockSlug,
        rating: 0,
        review_title: null,
        review_text: null,
        camera: null,
        format: null,
        location: null,
        iso: null,
        push_pull: null,
        shooting_tip: null,
        best_for: [],
      })
      .select("id")
      .single();

    if (reviewError || !inserted?.id) {
      console.error("[claim-review] insert review:", reviewError?.message);
      return null;
    }
    return inserted.id as string;
  }

  async function ensureRollForReview(
    filmStockSlug: string,
    reviewId: string,
    uploadBatchId?: string | null
  ): Promise<string | null> {
    const byReview = await supabase
      .from("rolls")
      .select("id")
      .eq("user_id", userId)
      .eq("film_stock_slug", filmStockSlug)
      .eq("review_id", reviewId)
      .maybeSingle();
    if (byReview.data?.id) return byReview.data.id as string;

    const creator = serviceRole ?? supabase;
    const { data: inserted, error } = await creator
      .from("rolls")
      .insert({
        user_id: userId,
        film_stock_slug: filmStockSlug,
        review_id: reviewId,
      })
      .select("id")
      .single();
    if (error || !inserted?.id) {
      console.error("[claim-review] create roll:", error?.message);
      return null;
    }
    const rollId = inserted.id as string;
    if (uploadBatchId?.trim()) {
      const updater = serviceRole ?? supabase;
      await updater
        .from("user_uploads")
        .update({ roll_id: rollId })
        .eq("upload_batch_id", uploadBatchId.trim())
        .eq("user_id", userId);
    }
    return rollId;
  }

  if (batchId) {
    const { data: rows, error: listErr } = await supabase
      .from("user_uploads")
      .select("id, review_id, film_stock_slug")
      .eq("upload_batch_id", batchId)
      .eq("user_id", userId);

    if (listErr) {
      console.error("[claim-review] list batch:", listErr.message);
      return NextResponse.json({ error: "Could not load uploads" }, { status: 500 });
    }
    if (!rows?.length) {
      return NextResponse.json({ error: "No uploads found for this batch" }, { status: 404 });
    }

    const slugs = [...new Set(rows.map((r) => (r as { film_stock_slug: string }).film_stock_slug))];
    if (slugs.length !== 1) {
      return NextResponse.json({ error: "Invalid batch (mixed film stocks)" }, { status: 400 });
    }

    const reviewIds = [
      ...new Set(
        rows
          .map((r) => (r as { review_id: string | null }).review_id?.trim())
          .filter((id): id is string => Boolean(id))
      ),
    ];
    if (reviewIds.length > 1) {
      return NextResponse.json({ error: "Batch is linked to multiple reviews" }, { status: 409 });
    }

    let targetReviewId: string | null = reviewIds[0] ?? null;
    if (!targetReviewId) {
      const created = await insertEmptyReview(slugs[0]!);
      targetReviewId = created;
      if (!targetReviewId) {
        return NextResponse.json({ error: "Could not create review for this roll" }, { status: 500 });
      }
      const uploader = serviceRole ?? supabase;
      const { error: upErr } = await uploader
        .from("user_uploads")
        .update({ review_id: targetReviewId })
        .eq("upload_batch_id", batchId)
        .eq("user_id", userId);
      if (upErr) {
        console.error("[claim-review] link batch:", upErr.message);
        return NextResponse.json({ error: "Could not link roll to review" }, { status: 500 });
      }
    } else {
      const orphanIds = rows
        .filter((r) => !(r as { review_id: string | null }).review_id)
        .map((r) => (r as { id: string }).id);
      if (orphanIds.length > 0) {
        const uploader = serviceRole ?? supabase;
        const { error: upErr } = await uploader
          .from("user_uploads")
          .update({ review_id: targetReviewId })
          .in("id", orphanIds)
          .eq("user_id", userId);
        if (upErr) {
          console.error("[claim-review] patch orphans:", upErr.message);
          return NextResponse.json({ error: "Could not link uploads to review" }, { status: 500 });
        }
      }
    }

    const rollId = await ensureRollForReview(slugs[0]!, targetReviewId, batchId);
    if (!rollId) {
      return NextResponse.json({ error: "Could not create roll for this review" }, { status: 500 });
    }
    return NextResponse.json({ reviewId: targetReviewId, rollId });
  }

  const { data: row, error: oneErr } = await supabase
    .from("user_uploads")
    .select("id, review_id, film_stock_slug")
    .eq("id", uploadId)
    .eq("user_id", userId)
    .maybeSingle();

  if (oneErr) {
    console.error("[claim-review] fetch one:", oneErr.message);
    return NextResponse.json({ error: "Could not load upload" }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Upload not found" }, { status: 404 });
  }

  const existingRid = (row as { review_id: string | null }).review_id?.trim();
  if (existingRid) {
    return NextResponse.json({ reviewId: existingRid });
  }

  const slug = (row as { film_stock_slug: string }).film_stock_slug;
  const newRid = await insertEmptyReview(slug);
  if (!newRid) {
    return NextResponse.json({ error: "Could not create review for this upload" }, { status: 500 });
  }

  const uploader = serviceRole ?? supabase;
  const { error: upErr } = await uploader
    .from("user_uploads")
    .update({ review_id: newRid })
    .eq("id", uploadId)
    .eq("user_id", userId);

  if (upErr) {
    console.error("[claim-review] link single:", upErr.message);
    return NextResponse.json({ error: "Could not link upload to review" }, { status: 500 });
  }

  const rollId = await ensureRollForReview(slug, newRid, null);
  if (!rollId) {
    return NextResponse.json({ error: "Could not create roll for this upload" }, { status: 500 });
  }
  await (serviceRole ?? supabase)
    .from("user_uploads")
    .update({ roll_id: rollId })
    .eq("id", uploadId)
    .eq("user_id", userId);

  return NextResponse.json({ reviewId: newRid, rollId });
}
