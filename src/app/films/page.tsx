import type { Metadata } from "next";
import { getFilmsPageData } from "@/app/actions/nav-cache";
import { FilmsPageClient } from "@/app/films/films-page-client";
export const metadata: Metadata = {
  title: "Film Stocks",
  description: "Browse and filter every film stock — color negative, slide, black & white, and more.",
};

interface FilmsPageProps {
  searchParams: Promise<{
    tab?: string;
    search?: string;
    vibe?: string;
    brand?: string;
    type?: string;
    format?: string;
    grain?: string;
    contrast?: string;
    latitude?: string;
    saturation?: string;
    bestFor?: string;
    iso?: string;
    sort?: string;
    filters?: string;
  }>;
}

export default async function FilmsPage({ searchParams }: FilmsPageProps) {
  const params = await searchParams;
  const navParams = {
    tab: params.tab,
    search: params.search,
    vibe: params.vibe,
    brand: params.brand,
    type: params.type,
    format: params.format,
    grain: params.grain,
    contrast: params.contrast,
    latitude: params.latitude,
    saturation: params.saturation,
    bestFor: params.bestFor,
    iso: params.iso,
    sort: params.sort,
    filters: params.filters,
  };
  const fallbackData = await getFilmsPageData(navParams);

  return <FilmsPageClient fallbackData={fallbackData} />;
}
