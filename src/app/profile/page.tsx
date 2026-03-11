import type { Metadata } from "next";
import { getFilmStocksBySlugs } from "@/lib/supabase/queries";
import { profileMock } from "@/lib/profile-mock-data";
import { ProfileView } from "@/components/profile-view";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your FilmDB profile — films you've shot, favourites, shootlist, ratings, reviews, and uploads.",
};

export default async function ProfilePage() {
  const allSlugs = [
    ...profileMock.shotSlugs,
    ...profileMock.favouriteSlugs,
    ...profileMock.shootlistSlugs,
    ...profileMock.ratings.map((r) => r.slug),
    ...profileMock.reviews.map((r) => r.slug),
    ...profileMock.uploads.map((u) => u.slug),
  ];
  const uniqueSlugs = [...new Set(allSlugs)];
  const stocks = await getFilmStocksBySlugs(uniqueSlugs);
  const stocksBySlug = new Map(stocks.map((s) => [s.slug, s]));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <ProfileView profile={profileMock} stocksBySlug={stocksBySlug} />
    </div>
  );
}
