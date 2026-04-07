import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import imageSize from "image-size";
import { createClient } from "@/lib/supabase/server";
import { shotDateForUserUploadDb } from "@/lib/user-upload-shot-date";
import {
  validateClientStoredImageRows,
  type ClientStoredImageInput,
} from "@/lib/client-stored-image-validation";

const BUCKET = "user-uploads";
const MAX_FILES = 10;

function supabaseProjectUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    ""
  ).trim();
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const isSizeError = /limit|size|length|exceeded|413|body.*large|max.*body/i.test(message);
    console.error("[reviews] formData error:", message, e);
    return NextResponse.json(
      {
        error: isSizeError ? "Upload too large. Try fewer or smaller images." : "Invalid form data",
        ...(process.env.NODE_ENV === "development" ? { detail: message.slice(0, 500) } : {}),
      },
      { status: 400 }
    );
  }

  const filmStockSlug = formData.get("film_stock_slug");
  if (typeof filmStockSlug !== "string" || !filmStockSlug.trim()) {
    return NextResponse.json({ error: "film_stock_slug required" }, { status: 400 });
  }
  const slug = filmStockSlug.trim();

  const mode = formData.get("mode"); // "review" | "upload"
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
    try { bestFor = JSON.parse(bestForRaw); } catch { /* ignore malformed */ }
    if (!Array.isArray(bestFor)) bestFor = [];
  }

  // Browser-direct uploads: JSON array of { url, width?, height? } already in user-uploads
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

  // Pre-upload flow (shot sheet): image_url already in storage, only INSERT
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
        /* dimensions optional */
      }
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${prefix}/${Date.now()}-${i}.${ext}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, bytes, { upsert: true, contentType: file.type });
      if (uploadError) {
        if (!firstStorageErrorMessage) firstStorageErrorMessage = uploadError.message;
        console.error("[reviews] storage upload error:", uploadError.message, uploadError);
        continue;
      }
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(uploadData.path);
      uploadedRows.push({ url: urlData.publicUrl, image_width, image_height });
    }

    if (files.length > 0 && uploadedRows.length === 0) {
      const errLower = firstStorageErrorMessage.toLowerCase();
      const isBucketMissing =
        errLower.includes("bucket not found") ||
        (errLower.includes("not found") && errLower.includes("bucket"));
      const isSize =
        /size|limit|large|too big|413|exceeds|maximum/i.test(firstStorageErrorMessage);
      const isMime = /mime|type|not allowed|invalid.*type/i.test(firstStorageErrorMessage);
      const isRls = /policy|row-level|rls|permission|denied|unauthorized/i.test(errLower);

      let detail =
        "Run SQL migration 036_user_uploads_storage_bucket.sql (creates the bucket, 50MB limit, and Storage policies), or create bucket `user-uploads` in Dashboard → Storage.";
      if (isSize) {
        detail =
          "File is larger than the Storage bucket limit. Run migration 036 (50MB) or raise the limit in Dashboard → Storage → user-uploads.";
      } else if (isMime) {
        detail =
          "This image type is blocked by the bucket. Use JPEG, PNG, or WebP, or add the MIME type to the bucket in Dashboard → Storage.";
      } else if (isRls) {
        detail =
          "Storage rejected the upload (RLS). Run migration 036 so authenticated users can upload under their user id folder.";
      } else if (!isBucketMissing && firstStorageErrorMessage) {
        detail = firstStorageErrorMessage;
      }

      return NextResponse.json(
        {
          error: "Image upload failed.",
          detail,
        },
        { status: 500 }
      );
    }
  }

  const reviewTitleTrim = reviewTitle?.trim() ?? "";
  const reviewTextTrim = reviewText?.trim() ?? "";
  const shootingTipTrim = shootingTip?.trim() ?? "";

  const shouldSaveReview =
    (mode === "review" &&
      (rating > 0 ||
        reviewTitleTrim.length > 0 ||
        reviewTextTrim.length > 0 ||
        shootingTipTrim.length > 0 ||
        bestFor.length > 0)) ||
    /** Share-roll / scan posts: always attach a `reviews` row so `user_uploads.review_id` is set (enables edit/delete in lightbox). */
    (mode === "upload" && uploadedRows.length > 0);

  let newReviewId: string | null = null;
  if (shouldSaveReview) {
    const { data: inserted, error: reviewError } = await supabase
      .from("reviews")
      .insert({
        user_id: user.id,
        film_stock_slug: slug,
        rating: Math.min(5, Math.max(0, rating)),
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
      .select("id")
      .single();
    if (reviewError || !inserted?.id) {
      console.error("[reviews] insert error:", reviewError?.code, reviewError?.message);
      const hint =
        reviewError?.message?.toLowerCase().includes("column") ||
        reviewError?.code === "42703"
          ? "If this mentions a missing column, apply the latest Supabase migrations for `reviews`."
          : undefined;
      return NextResponse.json(
        { error: "Could not save your review.", detail: hint ?? reviewError?.message?.slice(0, 200) },
        { status: 500 }
      );
    }
    newReviewId = inserted.id as string;
  }

  if (rating > 0) {
    await supabase.from("user_ratings").upsert(
      { user_id: user.id, film_stock_slug: slug, rating: Math.min(5, Math.max(0, rating)) },
      { onConflict: "user_id,film_stock_slug" }
    );
  }

  let uploadInsertErrors = 0;
  let uploadInserted = 0;
  let firstUploadInsertError: { message?: string; code?: string } | null = null;
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
  const uploadBatchId = uploadedRows.length > 1 ? crypto.randomUUID() : null;
  let rollId: string | null = null;
  if (mode === "upload" && uploadedRows.length > 0) {
    const { data: insertedRoll, error: rollErr } = await supabase
      .from("rolls")
      .insert({
        user_id: user.id,
        film_stock_slug: slug,
        review_id: newReviewId,
        title: reviewTitleTrim || null,
        caption: captionToUse,
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
      })
      .select("id")
      .single();
    if (rollErr || !insertedRoll?.id) {
      console.error("[reviews] rolls insert error:", rollErr?.code, rollErr?.message);
      return NextResponse.json({ error: "Could not create roll." }, { status: 500 });
    }
    rollId = insertedRoll.id as string;
  }
  const insertResults = await Promise.all(
    uploadedRows.map((row) =>
      supabase.from("user_uploads").insert({
        user_id: user.id,
        film_stock_slug: slug,
        image_url: row.url,
        caption: captionToUse,
        image_width: row.image_width,
        image_height: row.image_height,
        review_id: newReviewId,
        upload_batch_id: uploadBatchId,
        roll_id: rollId,
        ...metadata,
      })
    )
  );
  for (const { error: insertError } of insertResults) {
    if (insertError) {
      console.error("[reviews] user_uploads insert error:", insertError.code, insertError.message);
      uploadInsertErrors++;
      if (!firstUploadInsertError) firstUploadInsertError = insertError;
    } else {
      uploadInserted++;
    }
  }

  if (uploadedRows.length > 0 && uploadInsertErrors === uploadedRows.length) {
    const raw = (firstUploadInsertError?.message ?? "").toLowerCase();
    const missingShotDateOrTags =
      raw.includes("shot_date") ||
      raw.includes("tags") ||
      (raw.includes("column") && (raw.includes("shot_date") || raw.includes("tags")));
    const detail = missingShotDateOrTags
      ? "Your database is missing columns used by the share-roll flow. Apply Supabase migration 057_user_uploads_shot_date_tags.sql (adds `shot_date` and `tags`). Also ensure migrations 038 (format, location) and 004/005 (base user_uploads + RLS) are applied."
      : /policy|row-level|rls|permission|denied/i.test(raw)
        ? "Saving scans was blocked by database rules. Ensure migration 005 (and related RLS) allows inserts into `user_uploads` for authenticated users."
        : firstUploadInsertError?.message?.slice(0, 400) ||
          "Ensure migrations 004 and 005 are applied (user_uploads columns and RLS).";

    return NextResponse.json(
      {
        error: "Images uploaded, but they could not be saved to your gallery.",
        detail,
      },
      { status: 500 }
    );
  }

  revalidatePath("/");
  return NextResponse.json({
    ok: true,
    uploaded: uploadInserted,
    uploadFailed: uploadInsertErrors > 0 ? uploadInsertErrors : undefined,
    reviewSaved: shouldSaveReview,
    rollId: rollId ?? undefined,
  });
}
