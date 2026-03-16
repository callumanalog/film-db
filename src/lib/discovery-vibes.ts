import type { BestFor } from "@/lib/types";

export interface DiscoveryVibePill {
  id: string;
  label: string;
  bestFor: BestFor[];
}

/** Discovery vibe pills: id, label, and bestFor filters for the vibe page. */
export const DISCOVERY_PILLS: DiscoveryVibePill[] = [
  { id: "essential_everyday", label: "Essential Everyday", bestFor: ["general_purpose"] },
  { id: "golden_hour", label: "Golden Hour", bestFor: ["golden_hour", "landscapes"] },
  { id: "dreamy_portraits", label: "Dreamy Portraits", bestFor: ["portrait", "weddings"] },
  { id: "gritty_street", label: "Gritty Street", bestFor: ["street", "documentary"] },
  { id: "cinematic_nights", label: "Cinematic Nights", bestFor: ["artificial_light", "low_light"] },
  { id: "vivid_landscapes", label: "Vivid Landscapes", bestFor: ["landscapes", "bright_sun"] },
  { id: "nostalgic_travel", label: "Nostalgic Travel", bestFor: ["travel"] },
  { id: "experimental", label: "Experimental", bestFor: ["experimental"] },
];

export function getVibeById(id: string): DiscoveryVibePill | undefined {
  return DISCOVERY_PILLS.find((p) => p.id === id);
}
