import type { MetadataRoute } from "next";
import { getFilmStocks } from "@/lib/supabase/queries";
import { getCameras } from "@/lib/camera-queries";
import { getSiteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const stocks = await getFilmStocks({ sort: "alphabetical" });
  const cameras = await getCameras();
  const brandSlugs = [...new Set(stocks.map((s) => s.brand.slug))];

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/films",
    "/search",
    "/community",
    "/cameras",
    "/brands",
    "/about",
    "/labs",
    "/terms",
    "/privacy",
  ].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/films" ? 0.95 : 0.8,
  }));

  const filmRoutes: MetadataRoute.Sitemap = stocks.map((s) => ({
    url: `${base}/films/${s.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  const brandRoutes: MetadataRoute.Sitemap = brandSlugs.map((slug) => ({
    url: `${base}/brands/${slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.75,
  }));

  const cameraRoutes: MetadataRoute.Sitemap = cameras.map((c) => ({
    url: `${base}/cameras/${c.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.65,
  }));

  return [...staticRoutes, ...filmRoutes, ...brandRoutes, ...cameraRoutes];
}
