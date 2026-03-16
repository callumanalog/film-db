"use client";

import { CommunityReviews } from "@/components/community-section";

interface NotesTabContentWrapperProps {
  slug: string;
}

export function NotesTabContentWrapper({ slug }: NotesTabContentWrapperProps) {
  return (
    <section className="space-y-10">
      <CommunityReviews slug={slug} />
    </section>
  );
}
