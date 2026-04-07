"use client";

import { ShareRollMetadataTextSheet } from "@/components/share-roll-metadata-text-sheet";
import { suggestNormalizedLocations } from "@/lib/location-normalization-cities";

type ShareRollLocationSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (value: string) => void;
  /** Used to key localStorage recents; null uses anonymous bucket. */
  userId: string | null;
};

export function ShareRollLocationSheet(props: ShareRollLocationSheetProps) {
  return (
    <ShareRollMetadataTextSheet
      {...props}
      title="Location"
      placeholder="City, country or place name"
      ariaLabel="City, country or place name"
      buttonLabel="Add location"
      mruKind="location"
      recentSectionTitle="Recent locations"
      suggestionSectionTitle="Suggestions"
      getSuggestions={suggestNormalizedLocations}
      autoComplete="street-address"
    />
  );
}
