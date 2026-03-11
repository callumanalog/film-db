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
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
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

  const uploadedUrls: string[] = [];
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
      console.error("[reviews] upload error:", uploadError);
      continue;
    }
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(uploadData.path);
    uploadedUrls.push(urlData.publicUrl);
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

  for (const url of uploadedUrls) {
    const { error: insertError } = await supabase.from("user_uploads").insert({
      user_id: user.id,
      film_stock_slug: slug,
      image_url: url,
      caption: null,
    });
    if (insertError) console.error("[reviews] user_uploads insert error:", insertError);
  }

  return NextResponse.json({
    ok: true,
    uploaded: uploadedUrls.length,
    reviewSaved: mode === "review" && (rating > 0 || reviewTitle || reviewText),
  });
}
