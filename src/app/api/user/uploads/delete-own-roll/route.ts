import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  deleteUserUploadRowsAndStorage,
  performDeleteUserReview,
} from "@/lib/user-review-delete-server";

/**
 * Deletes scans that were never linked to a review (legacy), or a single upload by id.
 * If rows already have `review_id`, delegates to full review delete.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
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
  if ([batchId, uploadId].filter(Boolean).length !== 1) {
    return NextResponse.json(
      { error: "Send exactly one of upload_batch_id or upload_id" },
      { status: 400 }
    );
  }

  if (batchId) {
    const { data: rows, error: listErr } = await supabase
      .from("user_uploads")
      .select("id, image_url, review_id")
      .eq("upload_batch_id", batchId)
      .eq("user_id", user.id);

    if (listErr) {
      console.error("[delete-own-roll] list batch:", listErr.message);
      return NextResponse.json({ error: "Could not load uploads" }, { status: 500 });
    }
    if (!rows?.length) {
      return NextResponse.json({ error: "Nothing to delete" }, { status: 404 });
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
    if (reviewIds.length === 1) {
      const result = await performDeleteUserReview(supabase, user.id, reviewIds[0]!);
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: result.status });
      }
      return NextResponse.json({ ok: true });
    }

    const del = await deleteUserUploadRowsAndStorage(
      supabase,
      rows as { id: string; image_url: string | null }[]
    );
    if (!del.ok) {
      return NextResponse.json({ error: del.error }, { status: del.status });
    }
    return NextResponse.json({ ok: true });
  }

  const { data: row, error: oneErr } = await supabase
    .from("user_uploads")
    .select("id, image_url, review_id")
    .eq("id", uploadId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (oneErr) {
    console.error("[delete-own-roll] fetch one:", oneErr.message);
    return NextResponse.json({ error: "Could not load upload" }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: "Upload not found" }, { status: 404 });
  }

  const rid = (row as { review_id: string | null }).review_id?.trim();
  if (rid) {
    const result = await performDeleteUserReview(supabase, user.id, rid);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ ok: true });
  }

  const del = await deleteUserUploadRowsAndStorage(supabase, [
    row as { id: string; image_url: string | null },
  ]);
  if (!del.ok) {
    return NextResponse.json({ error: del.error }, { status: del.status });
  }
  return NextResponse.json({ ok: true });
}
