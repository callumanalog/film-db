import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfilePageClient } from "./profile-page-client";
import { SITE_NAME } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { getProfileCriticalFromSupabase } from "@/app/actions/get-profile";

export const metadata: Metadata = {
  title: "Profile",
  description: `Your ${SITE_NAME} profile — films you've shot, shootlist, tracked stocks, and ratings.`,
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/profile");
  const initialProfile = await getProfileCriticalFromSupabase();
  if (!initialProfile) redirect("/auth/sign-in?next=/profile");
  const isEmailVerified = Boolean((user as { email_confirmed_at?: string | null }).email_confirmed_at);
  return (
    <ProfilePageClient
      initialProfile={initialProfile}
      userId={user.id}
      userEmail={user.email ?? null}
      isEmailVerified={isEmailVerified}
    />
  );
}
