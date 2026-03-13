export type FilmFormat = "35mm" | "120" | "4x5" | "8x10" | "110" | "instant";

export type FilmType =
  | "color_negative"
  | "color_reversal"
  | "bw_negative"
  | "bw_reversal"
  | "instant";

export type PriceTier = 1 | 2 | 3;

/** Integer scale 1–5 for grain, contrast, saturation, latitude in the DB. */
export type Scale1To5 = 1 | 2 | 3 | 4 | 5;

/** Filter values shown on landing page: Grain 1&2=Fine, 3=Medium, 4&5=Coarse. */
export type GrainFilter = "fine" | "medium" | "coarse";
/** Filter values: Contrast 1&2=Soft, 3=Balanced, 4&5=Punchy. */
export type ContrastFilter = "soft" | "balanced" | "punchy";
/** Filter values: Latitude 1&2=Narrow, 3=Moderate, 4&5=Wide. */
export type LatitudeFilter = "narrow" | "moderate" | "wide";
/** Filter values: Saturation 1&2=Muted, 3=Natural, 4&5=Vivid. */
export type SaturationFilter = "muted" | "natural" | "vivid";

/** B&W stocks use the same 1–5 scale as "Color Sensitivity": 1=Orthochromatic, 3=Panchromatic, 5=Extended Panchromatic. */
export const COLOR_SENSITIVITY_LABELS: Record<number, string> = {
  1: "Orthochromatic",
  2: "Orthochromatic",
  3: "Panchromatic",
  4: "Extended Panchromatic",
  5: "Extended Panchromatic",
};

/** True if film type is Black & White (uses Color Sensitivity instead of Saturation in UI). */
export function isBlackAndWhiteFilm(type: FilmType | null | undefined): boolean {
  return type === "bw_negative" || type === "bw_reversal";
}

/** @deprecated Use GrainFilter and scale 1–5. Kept for filter URL/API compatibility. */
export type GrainLevel = GrainFilter;
/** @deprecated Use ContrastFilter and scale 1–5. */
export type ContrastLevel = ContrastFilter;
/** @deprecated Use LatitudeFilter and scale 1–5. */
export type LatitudeLevel = LatitudeFilter;

export type DevelopmentProcess = "c41" | "e6" | "bw" | "ecn2";

export type ColorBalanceType = "daylight" | "tungsten" | "neutral" | "daylight_balanced";

export type BestFor =
  | "general_purpose"
  | "portrait"
  | "street"
  | "landscapes"
  | "architecture"
  | "documentary"
  | "sports"
  | "travel"
  | "weddings"
  | "studio"
  | "bright_sun"
  | "golden_hour"
  | "low_light"
  | "artificial_light"
  | "experimental";

/** Discovery pill vibes: map to filter criteria for the Film Stocks landing page. */
export type DiscoveryVibe =
  | "golden_hour"
  | "soft_portraits"
  | "gritty_street"
  | "neon_nights"
  | "vivid_landscapes"
  | "experimental";

export const DISCOVERY_VIBE_LABELS: Record<DiscoveryVibe, string> = {
  golden_hour: "Golden Hour",
  soft_portraits: "Soft Portraits",
  gritty_street: "Gritty Street",
  neon_nights: "Neon Nights",
  vivid_landscapes: "Vivid Landscapes",
  experimental: "Experimental",
};

export const GRAIN_LABELS: Record<GrainFilter, string> = {
  fine: "Fine",
  medium: "Medium",
  coarse: "Coarse",
};

export const CONTRAST_LABELS: Record<ContrastFilter, string> = {
  soft: "Soft",
  balanced: "Balanced",
  punchy: "Punchy",
};

export const LATITUDE_LABELS: Record<LatitudeFilter, string> = {
  narrow: "Narrow",
  moderate: "Moderate",
  wide: "Wide",
};

export const SATURATION_LABELS: Record<SaturationFilter, string> = {
  muted: "Muted",
  natural: "Natural",
  vivid: "Vivid",
};

/** Map scale 1–5 to filter bucket for grain: 1,2→fine; 3→medium; 4,5→coarse. */
export function scaleToGrainFilter(scale: number | null | undefined): GrainFilter | null {
  if (scale == null || scale < 1 || scale > 5) return null;
  if (scale <= 2) return "fine";
  if (scale === 3) return "medium";
  return "coarse";
}

/** Map scale 1–5 to filter bucket for contrast: 1,2→soft; 3→balanced; 4,5→punchy. */
export function scaleToContrastFilter(scale: number | null | undefined): ContrastFilter | null {
  if (scale == null || scale < 1 || scale > 5) return null;
  if (scale <= 2) return "soft";
  if (scale === 3) return "balanced";
  return "punchy";
}

/** Map scale 1–5 to filter bucket for latitude: 1,2→narrow; 3→moderate; 4,5→wide. */
export function scaleToLatitudeFilter(scale: number | null | undefined): LatitudeFilter | null {
  if (scale == null || scale < 1 || scale > 5) return null;
  if (scale <= 2) return "narrow";
  if (scale === 3) return "moderate";
  return "wide";
}

/** Map scale 1–5 to filter bucket for saturation: 1,2→muted; 3→natural; 4,5→vivid. */
export function scaleToSaturationFilter(scale: number | null | undefined): SaturationFilter | null {
  if (scale == null || scale < 1 || scale > 5) return null;
  if (scale <= 2) return "muted";
  if (scale === 3) return "natural";
  return "vivid";
}

/** Filter value to scale range for DB query: grain "fine" → [1,2], "medium" → [3], "coarse" → [4,5]. */
export function grainFilterToScales(filter: GrainFilter): Scale1To5[] {
  if (filter === "fine") return [1, 2];
  if (filter === "medium") return [3];
  return [4, 5];
}

export function contrastFilterToScales(filter: ContrastFilter): Scale1To5[] {
  if (filter === "soft") return [1, 2];
  if (filter === "balanced") return [3];
  return [4, 5];
}

export function latitudeFilterToScales(filter: LatitudeFilter): Scale1To5[] {
  if (filter === "narrow") return [1, 2];
  if (filter === "moderate") return [3];
  return [4, 5];
}

export function saturationFilterToScales(filter: SaturationFilter): Scale1To5[] {
  if (filter === "muted") return [1, 2];
  if (filter === "natural") return [3];
  return [4, 5];
}

export const DEVELOPMENT_PROCESS_LABELS: Record<DevelopmentProcess, string> = {
  c41: "C-41",
  e6: "E-6",
  bw: "B&W",
  ecn2: "ECN-2",
};

export const COLOR_BALANCE_LABELS: Record<ColorBalanceType, string> = {
  daylight: "Daylight",
  tungsten: "Tungsten",
  neutral: "Neutral",
  daylight_balanced: "Daylight",
};

export const BEST_FOR_LABELS: Record<BestFor, string> = {
  general_purpose: "General purpose",
  portrait: "Portrait",
  street: "Street",
  landscapes: "Landscapes",
  architecture: "Architecture",
  documentary: "Documentary",
  sports: "Sports",
  travel: "Travel",
  weddings: "Weddings",
  studio: "Studio",
  bright_sun: "Bright Sun",
  golden_hour: "Golden Hour",
  low_light: "Low Light",
  artificial_light: "Artificial Light",
  experimental: "Experimental",
};

export interface FilmBrand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
}

/** Single shooting note: headline (hed) and body (dek). */
export interface ShootingNote {
  header: string;
  dek: string;
}

export interface FilmStock {
  id: string;
  name: string;
  slug: string;
  brand_id: string;
  format: FilmFormat[];
  type: FilmType;
  iso: number;
  description: string | null;
  history: string | null;
  /** Shooting notes: array of { header, dek }. Replaces legacy shooting_tips. */
  shooting_notes: ShootingNote[];
  /** Grain scale 1–5 (1=Fine, 3=Medium, 5=Coarse). */
  grain: number | null;
  /** Contrast scale 1–5 (1=Soft, 3=Balanced, 5=Punchy). */
  contrast: number | null;
  /** Latitude scale 1–5 (1=Narrow, 3=Moderate, 5=Wide). */
  latitude: number | null;
  /** Saturation scale 1–5 (1=Muted, 3=Natural, 5=Vivid). */
  saturation: number | null;
  /** Open-text color balance for specs (e.g. "Daylight (5500K)" or "Warm, natural skin tones"). */
  color_balance: string | null;
  /** Derived for landing-page filters and display: 1,2→fine; 3→medium; 4,5→coarse. */
  grain_level: GrainFilter;
  /** Derived for filters/display: 1,2→soft; 3→balanced; 4,5→punchy. */
  contrast_level: ContrastFilter;
  /** Derived for filters/display: 1,2→narrow; 3→moderate; 4,5→wide. */
  latitude_level: LatitudeFilter | null;
  /** Derived for filters/display: 1,2→muted; 3→natural; 4,5→vivid. */
  saturation_filter: SaturationFilter | null;
  color_balance_type?: ColorBalanceType | null;
  color_balance_kelvin?: number | null;
  dx_coding?: boolean;
  development_process?: DevelopmentProcess | null;
  best_for: BestFor[];
  discontinued: boolean;
  price_tier: PriceTier | null;
  base_price_usd: number | null;
  image_url: string | null;
  /** Year the stock was introduced/released (e.g. 1998). Sourced for reference; not yet displayed. */
  year_introduced: number | null;
  rating: number;
  featured: boolean;
  created_at: string;
  updated_at: string;
  brand?: FilmBrand;
}

export interface FilmStockPurchaseLink {
  id: string;
  film_stock_id: string;
  retailer_name: string;
  url: string;
  price_note: string | null;
  created_at: string;
}

export interface FilmStockSampleImage {
  id: string;
  film_stock_id: string;
  image_url: string;
  caption: string | null;
  camera_used: string | null;
  lens_used: string | null;
  settings: string | null;
  created_at: string;
}

export interface FilmStockWithRelations extends FilmStock {
  brand: FilmBrand;
  purchase_links: FilmStockPurchaseLink[];
  sample_images: FilmStockSampleImage[];
}

export const FILM_TYPE_LABELS: Record<FilmType, string> = {
  color_negative: "Color Negative",
  color_reversal: "Slide / Reversal",
  bw_negative: "Black & White",
  bw_reversal: "B&W Reversal",
  instant: "Instant",
};

export const FILM_TYPE_COLORS: Record<FilmType, string> = {
  color_negative: "bg-amber-600",
  color_reversal: "bg-emerald-600",
  bw_negative: "bg-zinc-600",
  bw_reversal: "bg-zinc-500",
  instant: "bg-sky-600",
};

// --- Film Cameras ---
export type CameraFormat = "35mm" | "120" | "4x5" | "8x10" | "110" | "instant" | "127" | "220" | "620";

export type CameraType =
  | "slr"
  | "rangefinder"
  | "tlr"
  | "point_and_shoot"
  | "viewfinder"
  | "folding"
  | "instant"
  | "large_format"
  | "medium_format_slr"
  | "medium_format_rangefinder"
  | "toy"
  | "pinhole";

export const CAMERA_TYPE_LABELS: Record<CameraType, string> = {
  slr: "SLR",
  rangefinder: "Rangefinder",
  tlr: "TLR",
  point_and_shoot: "Point & Shoot",
  viewfinder: "Viewfinder",
  folding: "Folding",
  instant: "Instant",
  large_format: "Large Format",
  medium_format_slr: "Medium Format SLR",
  medium_format_rangefinder: "Medium Format Rangefinder",
  toy: "Toy",
  pinhole: "Pinhole",
};

export interface CameraBrand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface FilmCamera {
  id: string;
  name: string;
  slug: string;
  brand_id: string;
  format: CameraFormat[];
  type: CameraType;
  year_introduced: number | null;
  year_discontinued: number | null;
  description: string | null;
  lens_mount: string | null;
  features: string[]; // e.g. ["Aperture priority", "TTL metering"]
  image_url: string | null;
  created_at: string;
  updated_at: string;
  brand?: CameraBrand;
}
