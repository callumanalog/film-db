"use client";

import { CommunityGallery } from "@/components/community-section";
import type { FlickrPhoto } from "@/lib/flickr";

interface ShotsTabContentProps {
  stockName: string;
  slug: string;
  flickrImages: FlickrPhoto[];
}

export function ShotsTabContent({ stockName, slug, flickrImages }: ShotsTabContentProps) {
  return (
    <section>
      <CommunityGallery stockName={stockName} slug={slug} flickrImages={flickrImages} variant="tab" />
    </section>
  );
}
