import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "user-uploads";
const MAX_FILES = 10;

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
    const isSizeError = /limit|size|length|exceeded/i.test(message);
    console.error("[reviews] formData error:", message, e);
    return NextResponse.json(
      { error: isSizeError ? "Upload too large. Try fewer or smaller images." : "Invalid form data" },
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
  const caption = (formData.get("caption") as string) || null;
  const shotIso = (formData.get("shot_iso") as string) || null;
  const lens = (formData.get("lens") as string) || null;
  const lab = (formData.get("lab") as string) || null;
  const filter = (formData.get("filter") as string) || null;
  const scanner = (formData.get("scanner") as string) || null;

  // Pre-upload flow (shot sheet): image_url already in storage, only INSERT
  const preUploadedImageUrl = (formData.get("image_url") as string) || null;
  let uploadedUrls: string[] = [];

  if (mode === "upload" && preUploadedImageUrl && preUploadedImageUrl.trim().length > 0) {
    uploadedUrls = [preUploadedImageUrl.trim()];
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
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${prefix}/${Date.now()}-${i}.${ext}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true });
      if (uploadError) {
        console.error("[reviews] storage upload error:", uploadError);
        continue;
      }
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(uploadData.path);
      uploadedUrls.push(urlData.publicUrl);
    }

    if (files.length > 0 && uploadedUrls.length === 0) {
      return NextResponse.json(
        { error: "Image upload failed. Check that the 'user-uploads' storage bucket exists and allows uploads." },
        { status: 500 }
      );
    }
  }

  if (mode === "review" && (rating > 0 || reviewTitle || reviewText)) {
    const { error: reviewError } = await supabase.from("reviews").insert({
      user_id: user.id,
      film_stock_slug: slug,
      rating: Math.min(5, Math.max(0, rating)),
      review_title: reviewTitle || null,
      review_text: reviewText || null,
      camera: camera || null,
      format: format || null,
      location: location || null,
      iso: iso || null,
      push_pull: pushPull || null,
    });
    if (reviewError) {
      console.error("[reviews] insert error:", reviewError);
      return NextResponse.json({ error: "Failed to save review" }, { status: 500 });
    }
  }

  if (rating > 0) {
    await supabase.from("user_ratings").upsert(
      { user_id: user.id, film_stock_slug: slug, rating: Math.min(5, Math.max(0, rating)) },
      { onConflict: "user_id,film_stock_slug" }
    );
  }

  let uploadInsertErrors = 0;
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
  for (const url of uploadedUrls) {
    const { error: insertError } = await supabase.from("user_uploads").insert({
      user_id: user.id,
      film_stock_slug: slug,
      image_url: url,
      caption: captionToUse,
      ...metadata,
    });
    if (insertError) {
      console.error("[reviews] user_uploads insert error:", insertError);
      uploadInsertErrors++;
    }
  }

  if (uploadedUrls.length > 0 && uploadInsertErrors === uploadedUrls.length) {
    return NextResponse.json(
      { error: "Images were uploaded but could not be saved. Ensure migrations 004 and 005 are applied (user_uploads columns and RLS)." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    uploaded: uploadedUrls.length,
    reviewSaved: mode === "review" && (rating > 0 || reviewTitle || reviewText),
  });
}
