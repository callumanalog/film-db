import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";
import { AllSavedImagesPageClient } from "./all-saved-images-client";

export const metadata: Metadata = {
  title: "All saved scans",
  description: `Community scans you saved on ${SITE_NAME} — boards.`,
};

export default function AllSavedImagesPage() {
  return (
    <div className="mx-auto flex min-h-0 w-full min-w-0 max-w-6xl flex-1 flex-col overflow-x-hidden overflow-y-visible px-0 pt-0 pb-8 sm:px-6 lg:px-8 md:flex-none md:overflow-visible md:pb-8">
      <AllSavedImagesPageClient />
    </div>
  );
}
