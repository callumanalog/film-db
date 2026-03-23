import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Toggle like on a review. Returns { liked, like_count }. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { review_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const reviewId = typeof body.review_id === "string" ? body.review_id.trim() : "";
  if (!reviewId) {
    return NextResponse.json({ error: "review_id required" }, { status: 400 });
  }

  const { data: existing, error: selErr } = await supabase
    .from("review_likes")
    .select("id")
    .eq("review_id", reviewId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (selErr) {
    console.error("[review-likes] select error:", selErr);
    return NextResponse.json({ error: "Failed to read like state" }, { status: 500 });
  }

  if (existing) {
    const { error: delErr } = await supabase
      .from("review_likes")
      .delete()
      .eq("review_id", reviewId)
      .eq("user_id", user.id);
    if (delErr) {
      console.error("[review-likes] delete error:", delErr);
      return NextResponse.json({ error: "Failed to unlike" }, { status: 500 });
    }
  } else {
    const { error: insErr } = await supabase.from("review_likes").insert({
      review_id: reviewId,
      user_id: user.id,
    });
    if (insErr) {
      console.error("[review-likes] insert error:", insErr);
      return NextResponse.json({ error: insErr.message || "Failed to like" }, { status: 500 });
    }
  }

  const { count, error: countErr } = await supabase
    .from("review_likes")
    .select("id", { count: "exact", head: true })
    .eq("review_id", reviewId);

  if (countErr) {
    console.error("[review-likes] count error:", countErr);
  }

  const likeCount = count ?? 0;
  const liked = !existing;

  return NextResponse.json({ liked, like_count: likeCount });
}
