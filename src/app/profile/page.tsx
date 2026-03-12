import type { Metadata } from "next";
import { ProfilePageClient } from "./profile-page-client";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your FilmDB profile — films you've shot, shootlist, tracked stocks, and ratings.",
};

export default function ProfilePage() {
  return <ProfilePageClient />;
}
