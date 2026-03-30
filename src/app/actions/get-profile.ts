"use server";

import { createClient } from "@/lib/supabase/server";
import type { InCameraEntry } from "@/app/actions/user-actions";
import { fetchDisplayNamesByUserIds } from "@/lib/supabase/fetch-display-names-batch";

export interface ProfileFromDb {
  /** Unique handle (`profiles.display_name`). */
  displayName: string;
  /** Optional friendly name (`profiles.full_name`); UI falls back to displayName when null. */
  fullName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  instagramUrl: string | null;
  websiteUrl: string | null;
  followersCount: number;
  followingCount: number;
  shotSlugs: string[];
  favouriteSlugs: string[];
  inCameraEntries: InCameraEntry[];
  ratings: Record<string, number>;
  reviewCount: number;
  uploadCount: number;
  reviews: { id: string; film_stock_slug: string; review_title: string | null; created_at: string; rating: number | null }[];
  uploads: {
    id: string;
    film_stock_slug: string;
    image_url: string | null;
    caption: string | null;
    created_at: string;
    upload_batch_id?: string | null;
  }[];
  likedReviews: {
    review_id: string;
    film_stock_slug: string;
    review_title: string | null;
    rating: number | null;
    review_created_at: string;
    liked_at: string;
  }[];
  /** Community scans the user saved (saved_uploads). */
  savedUploads: {
    savedUploadId: string;
    upload_id: string;
    film_stock_slug: string;
    image_url: string | null;
    caption: string | null;
    saved_at: string;
    uploaderUserId: string;
    uploaderDisplayName: string | null;
  }[];
  boards: {
    id: string;
    name: string;
    description: string | null;
    updatedAt: string;
    itemCount: number;
    coverUrl: string | null;
    coverUrl2: string | null;
    coverUrl3: string | null;
  }[];
  /** Community scans the user liked (upload_likes). */
  likedUploads: {
    upload_id: string;
    film_stock_slug: string;
    image_url: string | null;
    caption: string | null;
    liked_at: string;
  }[];
  /** Film stock lists this user created. */
  createdStockLists: {
    id: string;
    title: string;
    updatedAt: string;
    itemCount: number;
    /** Up to 5 image URLs in list order (nulls allowed). */
    previewUrls: (string | null)[];
  }[];
  /** Lists bookmarked from other members. */
  savedStockLists: {
    listId: string;
    title: string;
    updatedAt: string;
    savedAt: string;
    ownerUserId: string;
    ownerDisplayName: string;
    ownerAvatarUrl: string | null;
    itemCount: number;
    previewUrls: (string | null)[];
  }[];
}

export async function getProfileFromSupabase(): Promise<ProfileFromDb | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error("[get-profile] auth error:", authError.message);
      return null;
    }
    if (!user) return null;

    const [
      profileRes,
      shotRes,
      favRes,
      inCameraRes,
      ratingsRes,
      reviewsRes,
      uploadsRes,
      reviewsListRes,
      uploadsListRes,
      likedReviewsRes,
      savedUploadsRes,
      boardSummariesRes,
      likedUploadsRes,
      stockListSummariesRes,
      savedStockListsRes,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "display_name, full_name, bio, avatar_url, instagram_url, website_url, followers_count, following_count"
        )
        .eq("id", user.id)
        .single(),
      supabase.from("user_shot").select("film_stock_slug").eq("user_id", user.id),
      supabase.from("user_favourites").select("film_stock_slug").eq("user_id", user.id),
      supabase.from("user_in_camera").select("film_stock_slug, camera, format, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("user_ratings").select("film_stock_slug, rating").eq("user_id", user.id),
      supabase.from("reviews").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("user_uploads").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("reviews").select("id, film_stock_slug, review_title, created_at, rating").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase
        .from("user_uploads")
        .select(
          "id, film_stock_slug, image_url, caption, created_at, camera, shot_iso, lens, lab, filter, scanner, push_pull, format, location, upload_batch_id"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("review_likes")
        .select("created_at, reviews ( id, film_stock_slug, review_title, rating, created_at )")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("saved_uploads")
        .select(
          "id, created_at, user_uploads ( id, film_stock_slug, image_url, caption, user_id )"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.rpc("board_summaries_for_user"),
      supabase
        .from("upload_likes")
        .select(
          "created_at, user_uploads ( id, film_stock_slug, image_url, caption )"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.rpc("stock_list_summaries_for_user"),
      supabase
        .from("saved_stock_lists")
        .select("created_at, stock_lists ( id, title, updated_at, user_id )")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    if (profileRes.error) {
      console.error("[get-profile] profiles:", profileRes.error.message);
    }

    const profileRow = profileRes.error
      ? null
      : (profileRes.data as {
          display_name?: string | null;
          full_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          instagram_url?: string | null;
          website_url?: string | null;
          followers_count?: number | null;
          following_count?: number | null;
        } | null);

    const displayName =
      profileRow?.display_name?.trim() ||
      (user.user_metadata?.display_name as string)?.trim() ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "Member";

    const fullName = profileRow?.full_name?.trim() ? profileRow.full_name.trim() : null;
    const bio = profileRow?.bio?.trim() ? profileRow.bio.trim() : null;
    const avatarUrl = profileRow?.avatar_url?.trim() ? profileRow.avatar_url.trim() : null;
    const instagramUrl = profileRow?.instagram_url?.trim() ? profileRow.instagram_url.trim() : null;
    const websiteUrl = profileRow?.website_url?.trim() ? profileRow.website_url.trim() : null;
    const followersCount = Math.max(0, Number(profileRow?.followers_count ?? 0));
    const followingCount = Math.max(0, Number(profileRow?.following_count ?? 0));

    const shotSlugs = (shotRes.data ?? []).map((r) => r.film_stock_slug);
    const favouriteSlugs = (favRes.data ?? []).map((r) => r.film_stock_slug);
    const inCameraEntries: InCameraEntry[] = (inCameraRes.data ?? []).map((r) => ({
      film_stock_slug: r.film_stock_slug,
      camera: r.camera ?? null,
      format: r.format ?? null,
      created_at: r.created_at,
    }));
    const ratings: Record<string, number> = {};
    for (const r of ratingsRes.data ?? []) {
      ratings[r.film_stock_slug] = Number(r.rating);
    }

    if (likedReviewsRes.error) {
      console.error("[get-profile] review_likes:", likedReviewsRes.error.message);
    }
    const likedReviewsRaw = likedReviewsRes.error ? [] : (likedReviewsRes.data ?? []);
    const likedReviews: ProfileFromDb["likedReviews"] = [];
    for (const row of likedReviewsRaw as {
      created_at: string;
      reviews:
        | {
            id: string;
            film_stock_slug: string;
            review_title: string | null;
            rating: number | string | null;
            created_at: string;
          }
        | {
            id: string;
            film_stock_slug: string;
            review_title: string | null;
            rating: number | string | null;
            created_at: string;
          }[]
        | null;
    }[]) {
      const raw = row.reviews;
      const rev = Array.isArray(raw) ? raw[0] : raw;
      if (!rev) continue;
      likedReviews.push({
        review_id: rev.id,
        film_stock_slug: rev.film_stock_slug,
        review_title: rev.review_title,
        rating: rev.rating != null ? Number(rev.rating) : null,
        review_created_at: rev.created_at,
        liked_at: row.created_at,
      });
    }

    if (savedUploadsRes.error) {
      console.error("[get-profile] saved_uploads:", savedUploadsRes.error.message);
    }
    const savedUploadsRaw = savedUploadsRes.error ? [] : (savedUploadsRes.data ?? []);
    type SavedUp = {
      id: string;
      film_stock_slug: string;
      image_url: string | null;
      caption: string | null;
      user_id: string;
    };
    const savedPending: {
      savedUploadId: string;
      saved_at: string;
      upload: SavedUp;
    }[] = [];
    for (const row of savedUploadsRaw as {
      id: string;
      created_at: string;
      user_uploads: SavedUp | SavedUp[] | null;
    }[]) {
      const raw = row.user_uploads;
      const up = Array.isArray(raw) ? raw[0] : raw;
      if (!up) continue;
      savedPending.push({
        savedUploadId: row.id as string,
        saved_at: row.created_at,
        upload: up,
      });
    }
    const uploaderIds = [...new Set(savedPending.map((p) => p.upload.user_id).filter(Boolean))];
    const uploaderNames = await fetchDisplayNamesByUserIds(uploaderIds);
    const savedUploads: ProfileFromDb["savedUploads"] = savedPending.map((p) => ({
      savedUploadId: p.savedUploadId,
      upload_id: p.upload.id,
      film_stock_slug: p.upload.film_stock_slug,
      image_url: p.upload.image_url,
      caption: p.upload.caption,
      saved_at: p.saved_at,
      uploaderUserId: p.upload.user_id,
      uploaderDisplayName: uploaderNames.get(p.upload.user_id) ?? null,
    }));

    let boards: ProfileFromDb["boards"] = [];
    if (boardSummariesRes.error) {
      console.error("[get-profile] board_summaries_for_user:", boardSummariesRes.error.message);
    } else {
      const rawBoards = (boardSummariesRes.data ?? []) as {
        board_id: string;
        board_name: string;
        board_description: string | null;
        updated_at: string;
        item_count: number | string;
        cover_url: string | null;
        cover_url_2: string | null;
        cover_url_3: string | null;
      }[];
      boards = rawBoards.map((r) => ({
        id: r.board_id,
        name: r.board_name,
        description: r.board_description,
        updatedAt: r.updated_at,
        itemCount: Number(r.item_count),
        coverUrl: r.cover_url,
        coverUrl2: r.cover_url_2,
        coverUrl3: r.cover_url_3,
      }));
    }

    if (stockListSummariesRes.error) {
      console.error("[get-profile] stock_list_summaries_for_user:", stockListSummariesRes.error.message);
    }
    if (savedStockListsRes.error) {
      console.error("[get-profile] saved_stock_lists:", savedStockListsRes.error.message);
    }

    if (likedUploadsRes.error) {
      console.error("[get-profile] upload_likes:", likedUploadsRes.error.message);
    }
    const likedUploadsRaw = likedUploadsRes.error ? [] : (likedUploadsRes.data ?? []);
    const likedUploads: ProfileFromDb["likedUploads"] = [];
    for (const row of likedUploadsRaw as {
      created_at: string;
      user_uploads:
        | {
            id: string;
            film_stock_slug: string;
            image_url: string | null;
            caption: string | null;
          }
        | {
            id: string;
            film_stock_slug: string;
            image_url: string | null;
            caption: string | null;
          }[]
        | null;
    }[]) {
      const raw = row.user_uploads;
      const up = Array.isArray(raw) ? raw[0] : raw;
      if (!up) continue;
      likedUploads.push({
        upload_id: up.id,
        film_stock_slug: up.film_stock_slug,
        image_url: up.image_url,
        caption: up.caption,
        liked_at: row.created_at,
      });
    }

    let createdStockLists: ProfileFromDb["createdStockLists"] = [];
    if (!stockListSummariesRes.error && stockListSummariesRes.data) {
      const rawLists = stockListSummariesRes.data as {
        list_id: string;
        list_title: string;
        updated_at: string;
        item_count: number | string;
        preview_urls: (string | null)[] | null;
      }[];
      createdStockLists = rawLists.map((r) => {
        const raw = (r.preview_urls ?? []).slice(0, 5).map((u) => (u?.trim() ? u.trim() : null));
        while (raw.length < 5) raw.push(null);
        return {
          id: r.list_id,
          title: r.list_title,
          updatedAt: r.updated_at,
          itemCount: Number(r.item_count),
          previewUrls: raw,
        };
      });
    }

    type SavedListJoin = {
      created_at: string;
      stock_lists:
        | { id: string; title: string; updated_at: string; user_id: string }
        | { id: string; title: string; updated_at: string; user_id: string }[]
        | null;
    };

    const savedStockListsRaw = savedStockListsRes.error ? [] : (savedStockListsRes.data ?? []);
    const savedParsed: { listId: string; title: string; updatedAt: string; savedAt: string; ownerUserId: string }[] =
      [];
    for (const row of savedStockListsRaw as SavedListJoin[]) {
      const sl = Array.isArray(row.stock_lists) ? row.stock_lists[0] : row.stock_lists;
      if (!sl) continue;
      savedParsed.push({
        listId: sl.id,
        title: sl.title,
        updatedAt: sl.updated_at,
        savedAt: row.created_at,
        ownerUserId: sl.user_id,
      });
    }

    const savedListIds = savedParsed.map((s) => s.listId);
    const previewUrlsByListId = new Map<string, (string | null)[]>();
    const countByListId = new Map<string, number>();

    if (savedListIds.length > 0) {
      const { data: itemRows } = await supabase
        .from("stock_list_items")
        .select("list_id, sort_order, film_stock_slug")
        .in("list_id", savedListIds);

      type ItemRow = { list_id: string; sort_order: number; film_stock_slug: string };
      const sorted = [...(itemRows ?? [])] as ItemRow[];
      sorted.sort((a, b) => {
        if (a.list_id !== b.list_id) return a.list_id.localeCompare(b.list_id);
        return a.sort_order - b.sort_order;
      });

      const slugsByList = new Map<string, string[]>();
      const slugSet = new Set<string>();
      for (const r of sorted) {
        countByListId.set(r.list_id, (countByListId.get(r.list_id) ?? 0) + 1);
        const arr = slugsByList.get(r.list_id) ?? [];
        if (arr.length < 5) {
          arr.push(r.film_stock_slug);
          slugsByList.set(r.list_id, arr);
          slugSet.add(r.film_stock_slug);
        }
      }

      if (slugSet.size > 0) {
        const { data: stocks } = await supabase
          .from("film_stocks")
          .select("slug, image_url")
          .in("slug", [...slugSet]);
        const imgBySlug = new Map<string, string | null>();
        for (const st of stocks ?? []) {
          imgBySlug.set((st as { slug: string }).slug, (st as { image_url: string | null }).image_url);
        }
        for (const [lid, slugs] of slugsByList) {
          const urls = slugs.map((slug) => {
            const u = imgBySlug.get(slug);
            return u?.trim() ? u.trim() : null;
          });
          while (urls.length < 5) urls.push(null);
          previewUrlsByListId.set(lid, urls);
        }
      }
    }

    const savedOwnerIds = [...new Set(savedParsed.map((s) => s.ownerUserId))];
    const savedOwnerNames = new Map<string, string>();
    const savedOwnerAvatars = new Map<string, string | null>();
    if (savedOwnerIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", savedOwnerIds);
      for (const p of profs ?? []) {
        const id = (p as { id: string }).id;
        const dn = (p as { display_name: string | null }).display_name?.trim();
        const av = (p as { avatar_url: string | null }).avatar_url?.trim();
        savedOwnerNames.set(id, dn || "Member");
        savedOwnerAvatars.set(id, av || null);
      }
    }

    const emptyPreviews = (): (string | null)[] => [null, null, null, null, null];

    const savedStockLists: ProfileFromDb["savedStockLists"] = savedParsed.map((s) => ({
      listId: s.listId,
      title: s.title,
      updatedAt: s.updatedAt,
      savedAt: s.savedAt,
      ownerUserId: s.ownerUserId,
      ownerDisplayName: savedOwnerNames.get(s.ownerUserId) ?? "Member",
      ownerAvatarUrl: savedOwnerAvatars.get(s.ownerUserId) ?? null,
      itemCount: countByListId.get(s.listId) ?? 0,
      previewUrls: previewUrlsByListId.get(s.listId) ?? emptyPreviews(),
    }));

    return {
      displayName,
      fullName,
      bio,
      avatarUrl,
      instagramUrl,
      websiteUrl,
      followersCount,
      followingCount,
      shotSlugs,
      favouriteSlugs,
      inCameraEntries,
      ratings,
      reviewCount: reviewsRes.count ?? 0,
      uploadCount: uploadsRes.count ?? 0,
      reviews: (reviewsListRes.data ?? []).map((r) => ({
        id: r.id,
        film_stock_slug: r.film_stock_slug,
        review_title: r.review_title,
        created_at: r.created_at,
        rating: r.rating != null ? Number(r.rating) : null,
      })),
      uploads: (uploadsListRes.data ?? []).map((u) => ({
        id: u.id,
        film_stock_slug: u.film_stock_slug,
        image_url: u.image_url,
        caption: u.caption,
        created_at: u.created_at,
        upload_batch_id: u.upload_batch_id ?? null,
      })),
      likedReviews,
      savedUploads,
      likedUploads,
      boards,
      createdStockLists,
      savedStockLists,
    };
  } catch (err) {
    console.error("[get-profile] unexpected error:", err);
    return null;
  }
}

const MEMBER_PROFILE_USER_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Public profile payload for `/users/[userId]`: profile row, community scans, and stock lists they created.
 * Boards, saved lists, shot/shootlist, and other private graph data are omitted (empty arrays).
 */
export async function getMemberProfileByUserId(targetUserId: string): Promise<ProfileFromDb | null> {
  const id = targetUserId?.trim();
  if (!id || !MEMBER_PROFILE_USER_ID_RE.test(id)) return null;

  try {
    const supabase = await createClient();

    const [profileRes, uploadsRes, listsRes] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "display_name, full_name, bio, avatar_url, instagram_url, website_url, followers_count, following_count"
        )
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("user_uploads")
        .select(
          "id, film_stock_slug, image_url, caption, created_at, camera, shot_iso, lens, lab, filter, scanner, push_pull, format, location, upload_batch_id"
        )
        .eq("user_id", id)
        .order("created_at", { ascending: false }),
      supabase.from("stock_lists").select("id, title, updated_at").eq("user_id", id).order("updated_at", { ascending: false }),
    ]);

    if (profileRes.error || !profileRes.data) {
      if (profileRes.error) console.error("[get-member-profile] profiles:", profileRes.error.message);
      return null;
    }

    const profileRow = profileRes.data as {
      display_name?: string | null;
      full_name?: string | null;
      bio?: string | null;
      avatar_url?: string | null;
      instagram_url?: string | null;
      website_url?: string | null;
      followers_count?: number | null;
      following_count?: number | null;
    };

    const displayName = profileRow.display_name?.trim() || "Member";
    const fullName = profileRow.full_name?.trim() ? profileRow.full_name.trim() : null;
    const bio = profileRow.bio?.trim() ? profileRow.bio.trim() : null;
    const avatarUrl = profileRow.avatar_url?.trim() ? profileRow.avatar_url.trim() : null;
    const instagramUrl = profileRow.instagram_url?.trim() ? profileRow.instagram_url.trim() : null;
    const websiteUrl = profileRow.website_url?.trim() ? profileRow.website_url.trim() : null;
    const followersCount = Math.max(0, Number(profileRow.followers_count ?? 0));
    const followingCount = Math.max(0, Number(profileRow.following_count ?? 0));

    if (uploadsRes.error) {
      console.error("[get-member-profile] user_uploads:", uploadsRes.error.message);
    }

    const uploads = (uploadsRes.data ?? []).map((u) => ({
      id: u.id as string,
      film_stock_slug: u.film_stock_slug as string,
      image_url: u.image_url as string | null,
      caption: u.caption as string | null,
      created_at: u.created_at as string,
      upload_batch_id: (u as { upload_batch_id?: string | null }).upload_batch_id ?? null,
    }));

    let createdStockLists: ProfileFromDb["createdStockLists"] = [];
    const listRows = listsRes.error ? [] : (listsRes.data ?? []);
    if (listsRes.error) {
      console.error("[get-member-profile] stock_lists:", listsRes.error.message);
    }

    const listIds = listRows.map((r) => (r as { id: string }).id);
    if (listIds.length > 0) {
      const { data: itemRows, error: itemsErr } = await supabase
        .from("stock_list_items")
        .select("list_id, sort_order, film_stock_slug")
        .in("list_id", listIds);

      if (itemsErr) {
        console.error("[get-member-profile] stock_list_items:", itemsErr.message);
        const emptyPreviewsFallback = (): (string | null)[] => [null, null, null, null, null];
        createdStockLists = listRows.map((raw) => {
          const r = raw as { id: string; title: string; updated_at: string };
          return {
            id: r.id,
            title: r.title,
            updatedAt: r.updated_at,
            itemCount: 0,
            previewUrls: emptyPreviewsFallback(),
          };
        });
      } else {
        type ItemRow = { list_id: string; sort_order: number; film_stock_slug: string };
        const sorted = [...(itemRows ?? [])] as ItemRow[];
        sorted.sort((a, b) => {
          if (a.list_id !== b.list_id) return a.list_id.localeCompare(b.list_id);
          return a.sort_order - b.sort_order;
        });

        const countByListId = new Map<string, number>();
        const slugsByList = new Map<string, string[]>();
        const slugSet = new Set<string>();
        for (const r of sorted) {
          countByListId.set(r.list_id, (countByListId.get(r.list_id) ?? 0) + 1);
          const arr = slugsByList.get(r.list_id) ?? [];
          if (arr.length < 5) {
            arr.push(r.film_stock_slug);
            slugsByList.set(r.list_id, arr);
            slugSet.add(r.film_stock_slug);
          }
        }

        const previewUrlsByListId = new Map<string, (string | null)[]>();
        const emptyPreviews = (): (string | null)[] => [null, null, null, null, null];

        if (slugSet.size > 0) {
          const { data: stocks } = await supabase
            .from("film_stocks")
            .select("slug, image_url")
            .in("slug", [...slugSet]);
          const imgBySlug = new Map<string, string | null>();
          for (const st of stocks ?? []) {
            imgBySlug.set((st as { slug: string }).slug, (st as { image_url: string | null }).image_url);
          }
          for (const lid of listIds) {
            const slugs = slugsByList.get(lid) ?? [];
            const urls = slugs.map((slug) => {
              const u = imgBySlug.get(slug);
              return u?.trim() ? u.trim() : null;
            });
            while (urls.length < 5) urls.push(null);
            previewUrlsByListId.set(lid, urls);
          }
        }

        createdStockLists = listRows.map((raw) => {
          const r = raw as { id: string; title: string; updated_at: string };
          return {
            id: r.id,
            title: r.title,
            updatedAt: r.updated_at,
            itemCount: countByListId.get(r.id) ?? 0,
            previewUrls: previewUrlsByListId.get(r.id) ?? emptyPreviews(),
          };
        });
      }
    }

    return {
      displayName,
      fullName,
      bio,
      avatarUrl,
      instagramUrl,
      websiteUrl,
      followersCount,
      followingCount,
      shotSlugs: [],
      favouriteSlugs: [],
      inCameraEntries: [],
      ratings: {},
      reviewCount: 0,
      uploadCount: uploads.length,
      reviews: [],
      uploads,
      likedReviews: [],
      savedUploads: [],
      likedUploads: [],
      boards: [],
      createdStockLists,
      savedStockLists: [],
    };
  } catch (err) {
    console.error("[get-member-profile] unexpected error:", err);
    return null;
  }
}
