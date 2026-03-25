import type { Metadata } from "next";
import { ProfilePageClient } from "./profile-page-client";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Profile",
  description: `Your ${SITE_NAME} profile — films you've shot, shootlist, tracked stocks, and ratings.`,
};

export default function ProfilePage() {
  return <ProfilePageClient />;
}
