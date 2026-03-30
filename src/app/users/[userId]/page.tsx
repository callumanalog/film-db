import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMemberProfileByUserId } from "@/app/actions/get-profile";
import { SITE_NAME } from "@/lib/site";
import { PublicMemberProfileClient } from "./public-member-profile-client";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> {
  const { userId } = await params;
  if (!UUID_RE.test(userId)) return { title: "Member" };

  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle();

  const name = data?.display_name?.trim() || "Member";
  return { title: `${name} · ${SITE_NAME}` };
}

export default async function PublicUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  if (!UUID_RE.test(userId)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id === userId) redirect("/profile");

  const profileDb = await getMemberProfileByUserId(userId);
  if (!profileDb) notFound();

  let initialFollowing = false;
  if (user) {
    const { data: followRow } = await supabase
      .from("user_follows")
      .select("follower_id")
      .eq("follower_id", user.id)
      .eq("following_id", userId)
      .maybeSingle();
    initialFollowing = Boolean(followRow);
  }

  return (
    <PublicMemberProfileClient
      profileUserId={userId}
      profileDb={profileDb}
      viewerUserId={user?.id ?? null}
      initialFollowing={initialFollowing}
    />
  );
}
