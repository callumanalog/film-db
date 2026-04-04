import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getHomeFeedGroups } from "@/app/actions/home-feed";
import { getFilmStocksBySlugs } from "@/lib/supabase/queries";
import { HomeFeedClient, HomeFeedSignedOut } from "@/components/home-feed-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Home",
  description: "Scans from people and film stocks you follow, plus your own posts.",
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <HomeFeedSignedOut />
      </div>
    );
  }

  const groups = await getHomeFeedGroups();
  const slugs = [...new Set(groups.map((g) => g.film_stock_slug))];
  const stocks = await getFilmStocksBySlugs(slugs);
  const stockLabelBySlug = Object.fromEntries(stocks.map((s) => [s.slug, s.name]));

  return (
    <div className="min-h-screen bg-background">
      <HomeFeedClient initialGroups={groups} stockLabelBySlug={stockLabelBySlug} />
    </div>
  );
}
