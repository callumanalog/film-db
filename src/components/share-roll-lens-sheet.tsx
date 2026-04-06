"use client";

import { ShareRollMetadataTextSheet } from "@/components/share-roll-metadata-text-sheet";

type ShareRollLensSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (value: string) => void;
  /** Used to key localStorage recents; null uses anonymous bucket. */
  userId: string | null;
};

export function ShareRollLensSheet(props: ShareRollLensSheetProps) {
  return (
    <ShareRollMetadataTextSheet
      {...props}
      title="Lens"
      placeholder="Canon 50mm f/1.8"
      ariaLabel="Lens"
      buttonLabel="Add lens"
      mruKind="lens"
      recentSectionTitle="Recent lenses"
      autoComplete="off"
    />
  );
}
