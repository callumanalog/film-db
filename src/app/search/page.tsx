import type { Metadata } from "next";
import { getDiscoverCarouselPayload } from "@/app/actions/search";
import { SearchPageClient } from "@/app/search/search-page-client";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Discover",
  description: "Discover images, film stocks, cameras, lists, and users from across the app.",
};

export default async function SearchPage() {
  const carousels = await getDiscoverCarouselPayload();

  return (
    <div className="min-h-screen bg-white">
      <SearchPageClient carousels={carousels} />
    </div>
  );
}
