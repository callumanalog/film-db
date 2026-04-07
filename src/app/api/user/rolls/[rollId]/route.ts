import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { shotDateForUserUploadDb } from "@/lib/user-upload-shot-date";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ rollId: string }> }
) {
  const { rollId } = await context.params;
  if (!rollId) return NextResponse.json({ error: "roll id required" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const reviewTitle = ((formData.get("review_title") as string) || "").trim();
  const caption = ((formData.get("caption") as string) || "").trim();
  const camera = ((formData.get("camera") as string) || "").trim();
  const shotIso = ((formData.get("shot_iso") as string) || "").trim();
  const lens = ((formData.get("lens") as string) || "").trim();
  const lab = ((formData.get("lab") as string) || "").trim();
  const scanner = ((formData.get("scanner") as string) || "").trim();
  const pushPull = ((formData.get("push_pull") as string) || "").trim();
  const format = ((formData.get("format") as string) || "").trim();
  const location = ((formData.get("location") as string) || "").trim();
  const shotDate = shotDateForUserUploadDb(formData.get("shot_date") as string);
  const tags = (((formData.get("tags") as string) || "").trim().slice(0, 500) || null) as
    | string
    | null;

  const patch: Record<string, string | null> = {
    title: reviewTitle || null,
    caption: caption || null,
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
    updated_at: new Date().toISOString(),
  };

  const { data: rollRow, error: rollErr } = await supabase
    .from("rolls")
    .update(patch)
    .eq("id", rollId)
    .eq("user_id", user.id)
    .select("id,review_id")
    .maybeSingle();
  if (rollErr || !rollRow) {
    return NextResponse.json({ error: "Failed to update roll metadata" }, { status: 500 });
  }

  const uploadsPatch = {
    caption: patch.caption,
    camera: patch.camera,
    shot_iso: patch.shot_iso,
    lens: patch.lens,
    lab: patch.lab,
    scanner: patch.scanner,
    push_pull: patch.push_pull,
    format: patch.format,
    location: patch.location,
    shot_date: patch.shot_date,
    tags: patch.tags,
  };
  const { error: uploadsErr } = await supabase
    .from("user_uploads")
    .update(uploadsPatch)
    .eq("roll_id", rollId)
    .eq("user_id", user.id);
  if (uploadsErr) {
    return NextResponse.json({ error: "Failed to update roll metadata" }, { status: 500 });
  }

  if (rollRow.review_id) {
    const { error: titleErr } = await supabase
      .from("reviews")
      .update({ review_title: patch.title })
      .eq("id", rollRow.review_id)
      .eq("user_id", user.id);
    if (titleErr) {
      return NextResponse.json({ error: "Failed to update roll title" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, rollUpdated: true, reviewId: rollRow.review_id ?? null });
}
