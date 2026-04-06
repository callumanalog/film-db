"use server";

import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fetchMemberPublicFieldsByUserIds } from "@/lib/supabase/fetch-display-names-batch";
import type { FilmUploadRow } from "@/app/actions/uploads";

const HOME_FEED_SELECT =
  "id, user_id, film_stock_slug, image_url, caption, created_at, camera, shot_iso, lens, lab, scanner, push_pull, format, location, shot_date, tags, upload_batch_id, image_width, image_height, review_id, like_count, save_count";

const PER_SOURCE_LIMIT = 120;

export interface HomeFeedUpload extends FilmUploadRow {
  display_name: string | null;
  /** From `profiles.avatar_url` for the uploader. */
  avatar_url: string | null;
}

export interface HomeFeedGroup {
  key: string;
  sortAt: string;
  film_stock_slug: string;
  user_id: string;
  uploads: HomeFeedUpload[];
}

function mergeUniqueRows(rows: (FilmUploadRow & { created_at: string })[]): (FilmUploadRow & { created_at: string })[] {
  const byId = new Map<string, FilmUploadRow & { created_at: string }>();
  for (const r of rows) {
    byId.set(r.id, r);
  }
  return [...byId.values()].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

function buildGroups(rows: HomeFeedUpload[]): HomeFeedGroup[] {
  const byKey = new Map<string, HomeFeedUpload[]>();
  for (const r of rows) {
    const key = r.upload_batch_id?.trim() ? `batch:${r.upload_batch_id}` : `single:${r.id}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key)!.push(r);
  }

  const groups: HomeFeedGroup[] = [];
  for (const [key, ups] of byKey) {
    const sorted = [...ups].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const sortAt = sorted.reduce(
      (max, u) => (u.created_at > max ? u.created_at : max),
      sorted[0].created_at
    );
    groups.push({
      key,
      sortAt,
      film_stock_slug: sorted[0].film_stock_slug,
      user_id: sorted[0].user_id,
      uploads: sorted,
    });
  }
  groups.sort((a, b) => new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime());
  return groups;
}

/** Home feed: uploads from stocks you follow, users you follow, and your own posts. Signed-out users get []. */
export async function getHomeFeedGroups(): Promise<HomeFeedGroup[]> {
  noStore();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const [{ data: followRows, error: followErr }, { data: stockFollowRows, error: stockFollowErr }] =
    await Promise.all([
      supabase.from("user_follows").select("following_id").eq("follower_id", user.id),
      supabase.from("user_followed_film_stocks").select("film_stock_slug").eq("user_id", user.id),
    ]);

  if (followErr) console.error("[getHomeFeedGroups] follows", followErr.message);
  if (stockFollowErr) {
    const msg = stockFollowErr.message ?? "";
    const missingTable =
      msg.includes("user_followed_film_stocks") &&
      (msg.includes("schema cache") || msg.includes("does not exist"));
    if (missingTable) {
      console.warn(
        "[getHomeFeedGroups] Table user_followed_film_stocks is missing. Apply supabase/migrations/056_user_followed_film_stocks.sql (e.g. supabase db push). Feed will work without stock-follow sources until then."
      );
    } else {
      console.error("[getHomeFeedGroups] stock follows", msg);
    }
  }

  const followingIds = (followRows ?? []).map((r) => r.following_id as string).filter(Boolean);
  const followedSlugs = stockFollowErr
    ? []
    : (stockFollowRows ?? []).map((r) => r.film_stock_slug as string).filter(Boolean);

  const ownRes = await supabase
    .from("user_uploads")
    .select(HOME_FEED_SELECT)
    .eq("user_id", user.id)
    .not("image_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(PER_SOURCE_LIMIT);

  const followingRes =
    followingIds.length > 0
      ? await supabase
          .from("user_uploads")
          .select(HOME_FEED_SELECT)
          .in("user_id", followingIds)
          .not("image_url", "is", null)
          .order("created_at", { ascending: false })
          .limit(PER_SOURCE_LIMIT)
      : { data: [] as unknown[], error: null };

  const stockRes =
    followedSlugs.length > 0
      ? await supabase
          .from("user_uploads")
          .select(HOME_FEED_SELECT)
          .in("film_stock_slug", followedSlugs)
          .not("image_url", "is", null)
          .order("created_at", { ascending: false })
          .limit(PER_SOURCE_LIMIT)
      : { data: [] as unknown[], error: null };

  const results = [ownRes, followingRes, stockRes];
  const merged: (FilmUploadRow & { created_at: string })[] = [];
  for (const res of results) {
    if (res.error) {
      console.error("[getHomeFeedGroups] upload query", res.error.message);
      continue;
    }
    const rows = (res.data ?? []) as (FilmUploadRow & { created_at: string })[];
    merged.push(...rows);
  }

  const uniqueSorted = mergeUniqueRows(merged);
  const userIds = [...new Set(uniqueSorted.map((r) => r.user_id))];
  const fieldsByUserId = await fetchMemberPublicFieldsByUserIds(userIds);

  const withNames: HomeFeedUpload[] = uniqueSorted.map((r) => {
    const f = fieldsByUserId.get(r.user_id);
    return {
      ...r,
      display_name: f?.displayName ?? null,
      avatar_url: f?.avatarUrl ?? null,
    };
  });

  return buildGroups(withNames);
}
