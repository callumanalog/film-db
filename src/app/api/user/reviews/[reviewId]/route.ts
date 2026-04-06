import { NextResponse } from "next/server";
import imageSize from "image-size";
import { createClient } from "@/lib/supabase/server";
import { shotDateForUserUploadDb } from "@/lib/user-upload-shot-date";
import {
  validateClientStoredImageRows,
  type ClientStoredImageInput,
} from "@/lib/client-stored-image-validation";
import { performDeleteUserReview } from "@/lib/user-review-delete-server";

const BUCKET = "user-uploads";
const MAX_FILES = 10;

function supabaseProjectUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    ""
  ).trim();
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ reviewId: string }> }
) {
  const { reviewId } = await context.params;
  if (!reviewId) {
    return NextResponse.json({ error: "review id required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: existing, error: fetchError } = await supabase
    .from("reviews")
    .select("id, user_id, film_stock_slug")
    .eq("id", reviewId)
    .maybeSingle();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }
  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const isSizeError = /limit|size|length|exceeded|413|body.*large|max.*body/i.test(message);
    console.error("[reviews PATCH] formData error:", message, e);
    return NextResponse.json(
      {
        error: isSizeError ? "Upload too large. Try fewer or smaller images." : "Invalid form data",
        ...(process.env.NODE_ENV === "development" ? { detail: message.slice(0, 500) } : {}),
      },
      { status: 400 }
    );
  }

  const slug = existing.film_stock_slug as string;
  const mode = formData.get("mode");
  const ratingRaw = formData.get("rating");
  const rating = ratingRaw != null ? Number(ratingRaw) : 0;
  const reviewTitle = (formData.get("review_title") as string) || null;
  const reviewText = (formData.get("review_text") as string) || null;
  const camera = (formData.get("camera") as string) || null;
  const format = (formData.get("format") as string) || null;
  const location = (formData.get("location") as string) || null;
  const iso = (formData.get("iso") as string) || null;
  const pushPull = (formData.get("push_pull") as string) || null;
  const shootingTip = (formData.get("shooting_tip") as string) || null;
  const caption = (formData.get("caption") as string) || null;
  const shotIso = (formData.get("shot_iso") as string) || null;
  const lens = (formData.get("lens") as string) || null;
  const lab = (formData.get("lab") as string) || null;
  const scanner = (formData.get("scanner") as string) || null;
  const shotDate = shotDateForUserUploadDb(formData.get("shot_date") as string);
  const tagsTrim = ((formData.get("tags") as string) || "").trim().slice(0, 500);
  const tags = tagsTrim.length > 0 ? tagsTrim : null;
  const bestForRaw = (formData.get("best_for") as string) || null;
  let bestFor: string[] = [];
  if (bestForRaw) {
    try {
      bestFor = JSON.parse(bestForRaw);
    } catch {
      /* ignore */
    }
    if (!Array.isArray(bestFor)) bestFor = [];
  }

  const captionToUse = caption || null;
  const metadata = {
    camera: camera || null,
    shot_iso: shotIso || null,
    lens: lens || null,
    lab: lab || null,
    scanner: scanner || null,
    push_pull: pushPull || null,
    format: format || null,
    location: location || null,
    shot_date: shotDate,
    tags,
  };

  const reviewTitleTrim = reviewTitle?.trim() ?? "";
  const reviewTextTrim = reviewText?.trim() ?? "";
  const shootingTipTrim = shootingTip?.trim() ?? "";

  const shareRollMetadataOnly = formData.get("share_roll_metadata_only") === "1";
  if (shareRollMetadataOnly) {
    if (formData.has("review_title")) {
      const titleRaw = (formData.get("review_title") as string) || "";
      const titleTrim = titleRaw.trim();
      const { error: titleErr } = await supabase
        .from("reviews")
        .update({ review_title: titleTrim || null })
        .eq("id", reviewId)
        .eq("user_id", user.id);

      if (titleErr) {
        console.error("[reviews PATCH] review title (share roll):", titleErr);
        return NextResponse.json({ error: "Failed to update roll title" }, { status: 500 });
      }
    }

    const { error: metaErr } = await supabase
      .from("user_uploads")
      .update({
        ...metadata,
        caption: captionToUse,
      })
      .eq("review_id", reviewId)
      .eq("user_id", user.id);

    if (metaErr) {
      console.error("[reviews PATCH] user_uploads share-roll metadata:", metaErr);
      return NextResponse.json({ error: "Failed to update roll metadata" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      reviewUpdated: true,
      shareRollMetadataUpdated: true,
    });
  }

  const { error: updateError } = await supabase
    .from("reviews")
    .update({
      rating: rating > 0 ? Math.min(5, Math.max(0, rating)) : null,
      review_title: reviewTitleTrim || null,
      review_text: reviewTextTrim || null,
      camera: camera || null,
      format: format || null,
      location: location || null,
      iso: iso || null,
      push_pull: pushPull || null,
      shooting_tip: shootingTipTrim || null,
      best_for: bestFor.length > 0 ? bestFor : [],
    })
    .eq("id", reviewId)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("[reviews PATCH] update error:", updateError);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }

  if (rating > 0) {
    await supabase.from("user_ratings").upsert(
      { user_id: user.id, film_stock_slug: slug, rating: Math.min(5, Math.max(0, rating)) },
      { onConflict: "user_id,film_stock_slug" }
    );
  } else {
    await supabase
      .from("user_ratings")
      .delete()
      .eq("user_id", user.id)
      .eq("film_stock_slug", slug);
  }

  const clientStoredRaw = (formData.get("client_stored_images") as string) || null;
  type UploadedRow = { url: string; image_width: number | null; image_height: number | null };
  let uploadedRows: UploadedRow[] = [];

  if (clientStoredRaw && clientStoredRaw.trim().length > 0) {
    let items: ClientStoredImageInput[] = [];
    try {
      const parsed = JSON.parse(clientStoredRaw) as unknown;
      if (!Array.isArray(parsed)) throw new Error("not array");
      items = parsed as ClientStoredImageInput[];
    } catch {
      return NextResponse.json({ error: "Invalid client_stored_images JSON." }, { status: 400 });
    }
    const validated = validateClientStoredImageRows(
      supabaseProjectUrl(),
      user.id,
      slug,
      items,
      MAX_FILES
    );
    if (!validated.ok) {
      return NextResponse.json({ error: validated.message }, { status: 400 });
    }
    uploadedRows = validated.rows.map((r) => ({
      url: r.url,
      image_width: r.image_width,
      image_height: r.image_height,
    }));
  }

  const preUploadedImageUrl = (formData.get("image_url") as string) || null;

  if (uploadedRows.length === 0 && mode === "upload" && preUploadedImageUrl && preUploadedImageUrl.trim().length > 0) {
    uploadedRows = [{ url: preUploadedImageUrl.trim(), image_width: null, image_height: null }];
  } else if (uploadedRows.length === 0 && mode === "upload") {
    const files: File[] = [];
    for (let i = 0; i < MAX_FILES; i++) {
      const f = formData.get(`file_${i}`) ?? formData.get("files");
      if (f instanceof File && f.size > 0) files.push(f);
    }
    if (files.length === 0) {
      const allFiles = formData.getAll("files");
      for (const f of allFiles) {
        if (f instanceof File && f.size > 0) files.push(f);
      }
    }

    const prefix = `${user.id}/${slug}`;
    let firstStorageErrorMessage = "";
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;
      const ab = await file.arrayBuffer();
      const bytes = new Uint8Array(ab);
      let image_width: number | null = null;
      let image_height: number | null = null;
      try {
        const dim = imageSize(Buffer.from(bytes));
        if (dim.width && dim.height) {
          image_width = dim.width;
          image_height = dim.height;
        }
      } catch {
        /* optional */
      }
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${prefix}/${Date.now()}-${i}.${ext}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, bytes, { upsert: true, contentType: file.type });
      if (uploadError) {
        if (!firstStorageErrorMessage) firstStorageErrorMessage = uploadError.message;
        console.error("[reviews PATCH] storage upload error:", uploadError.message, uploadError);
        continue;
      }
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(uploadData.path);
      uploadedRows.push({ url: urlData.publicUrl, image_width, image_height });
    }

    if (files.length > 0 && uploadedRows.length === 0) {
      return NextResponse.json(
        { error: "Image upload failed.", detail: firstStorageErrorMessage || "No files stored" },
        { status: 500 }
      );
    }
  }

  const uploadBatchId = uploadedRows.length > 0 ? crypto.randomUUID() : null;
  let uploadInsertErrors = 0;
  const patchInsertResults = await Promise.all(
    uploadedRows.map((row) =>
      supabase.from("user_uploads").insert({
        user_id: user.id,
        film_stock_slug: slug,
        image_url: row.url,
        caption: captionToUse,
        image_width: row.image_width,
        image_height: row.image_height,
        review_id: reviewId,
        upload_batch_id: uploadBatchId,
        ...metadata,
      })
    )
  );
  for (const { error: insertError } of patchInsertResults) {
    if (insertError) {
      console.error("[reviews PATCH] user_uploads insert error:", insertError);
      uploadInsertErrors++;
    }
  }

  if (uploadedRows.length > 0 && uploadInsertErrors === uploadedRows.length) {
    return NextResponse.json(
      { error: "Images were uploaded but could not be saved to your review." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    uploaded: uploadedRows.length,
    reviewUpdated: true,
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ reviewId: string }> }
) {
  const { reviewId } = await context.params;
  if (!reviewId) {
    return NextResponse.json({ error: "review id required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await performDeleteUserReview(supabase, user.id, reviewId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true });
}
