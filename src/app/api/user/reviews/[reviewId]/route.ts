import { NextResponse } from "next/server";
import imageSize from "image-size";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "user-uploads";
const MAX_FILES = 10;

function storagePathFromPublicUrl(url: string): string | null {
  const marker = "/object/public/user-uploads/";
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
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
  const filter = (formData.get("filter") as string) || null;
  const scanner = (formData.get("scanner") as string) || null;
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

  const reviewTitleTrim = reviewTitle?.trim() ?? "";
  const reviewTextTrim = reviewText?.trim() ?? "";
  const shootingTipTrim = shootingTip?.trim() ?? "";

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

  const preUploadedImageUrl = (formData.get("image_url") as string) || null;
  type UploadedRow = { url: string; image_width: number | null; image_height: number | null };
  let uploadedRows: UploadedRow[] = [];

  if (mode === "upload" && preUploadedImageUrl && preUploadedImageUrl.trim().length > 0) {
    uploadedRows = [{ url: preUploadedImageUrl.trim(), image_width: null, image_height: null }];
  } else {
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

  const captionToUse = caption || null;
  const metadata = {
    camera: camera || null,
    shot_iso: shotIso || null,
    lens: lens || null,
    lab: lab || null,
    filter: filter || null,
    scanner: scanner || null,
    push_pull: pushPull || null,
  };

  let uploadInsertErrors = 0;
  for (const row of uploadedRows) {
    const { error: insertError } = await supabase.from("user_uploads").insert({
      user_id: user.id,
      film_stock_slug: slug,
      image_url: row.url,
      caption: captionToUse,
      image_width: row.image_width,
      image_height: row.image_height,
      review_id: reviewId,
      ...metadata,
    });
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

  const { data: uploads, error: uploadsError } = await supabase
    .from("user_uploads")
    .select("id, image_url")
    .eq("review_id", reviewId)
    .eq("user_id", user.id);

  if (uploadsError) {
    console.error("[reviews DELETE] list uploads:", uploadsError);
    return NextResponse.json({ error: "Failed to prepare delete" }, { status: 500 });
  }

  const paths: string[] = [];
  for (const u of uploads ?? []) {
    const url = u.image_url as string | null;
    if (!url) continue;
    const path = storagePathFromPublicUrl(url);
    if (path) paths.push(path);
  }

  if (paths.length > 0) {
    const { error: rmError } = await supabase.storage.from(BUCKET).remove(paths);
    if (rmError) {
      console.error("[reviews DELETE] storage remove:", rmError);
      /* continue — still remove DB rows */
    }
  }

  if (uploads?.length) {
    const { error: delUploadsError } = await supabase
      .from("user_uploads")
      .delete()
      .eq("review_id", reviewId)
      .eq("user_id", user.id);
    if (delUploadsError) {
      console.error("[reviews DELETE] user_uploads delete:", delUploadsError);
      return NextResponse.json({ error: "Failed to delete review images" }, { status: 500 });
    }
  }

  const { error: delReviewError } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("user_id", user.id);

  if (delReviewError) {
    console.error("[reviews DELETE] review delete:", delReviewError);
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
