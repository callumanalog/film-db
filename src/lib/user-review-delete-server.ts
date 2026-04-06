import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "user-uploads";

export function storagePathFromPublicUserUploadUrl(url: string): string | null {
  const marker = "/object/public/user-uploads/";
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
}

/**
 * Deletes a `reviews` row and all `user_uploads` linked by `review_id`, plus storage objects.
 * Caller must have already verified the review belongs to `userId` if needed.
 */
export async function performDeleteUserReview(
  supabase: SupabaseClient,
  userId: string,
  reviewId: string
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const { data: existing, error: fetchError } = await supabase
    .from("reviews")
    .select("id, user_id")
    .eq("id", reviewId)
    .maybeSingle();

  if (fetchError || !existing) {
    return { ok: false, error: "Review not found", status: 404 };
  }
  if ((existing as { user_id: string }).user_id !== userId) {
    return { ok: false, error: "Forbidden", status: 403 };
  }

  const { data: uploads, error: uploadsError } = await supabase
    .from("user_uploads")
    .select("id, image_url")
    .eq("review_id", reviewId)
    .eq("user_id", userId);

  if (uploadsError) {
    console.error("[performDeleteUserReview] list uploads:", uploadsError);
    return { ok: false, error: "Failed to prepare delete", status: 500 };
  }

  const paths: string[] = [];
  for (const u of uploads ?? []) {
    const url = (u as { image_url: string | null }).image_url;
    if (!url) continue;
    const path = storagePathFromPublicUserUploadUrl(url);
    if (path) paths.push(path);
  }

  if (paths.length > 0) {
    const { error: rmError } = await supabase.storage.from(BUCKET).remove(paths);
    if (rmError) {
      console.error("[performDeleteUserReview] storage remove:", rmError);
    }
  }

  if (uploads?.length) {
    const { error: delUploadsError } = await supabase
      .from("user_uploads")
      .delete()
      .eq("review_id", reviewId)
      .eq("user_id", userId);
    if (delUploadsError) {
      console.error("[performDeleteUserReview] user_uploads delete:", delUploadsError);
      return { ok: false, error: "Failed to delete review images", status: 500 };
    }
  }

  const { error: delReviewError } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("user_id", userId);

  if (delReviewError) {
    console.error("[performDeleteUserReview] review delete:", delReviewError);
    return { ok: false, error: "Failed to delete review", status: 500 };
  }

  return { ok: true };
}

export async function deleteUserUploadRowsAndStorage(
  supabase: SupabaseClient,
  rows: { id: string; image_url: string | null }[]
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const paths: string[] = [];
  for (const u of rows) {
    const url = u.image_url;
    if (!url) continue;
    const path = storagePathFromPublicUserUploadUrl(url);
    if (path) paths.push(path);
  }
  if (paths.length > 0) {
    const { error: rmError } = await supabase.storage.from(BUCKET).remove(paths);
    if (rmError) {
      console.error("[deleteUserUploadRowsAndStorage] storage remove:", rmError);
    }
  }
  const ids = rows.map((r) => r.id);
  if (ids.length === 0) return { ok: true };
  const { error: delErr } = await supabase.from("user_uploads").delete().in("id", ids);
  if (delErr) {
    console.error("[deleteUserUploadRowsAndStorage] delete:", delErr);
    return { ok: false, error: "Failed to delete uploads", status: 500 };
  }
  return { ok: true };
}
