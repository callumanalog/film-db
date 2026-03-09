export type FilmFormat = "35mm" | "120" | "4x5" | "8x10" | "110" | "instant";

export type FilmType =
  | "color_negative"
  | "color_reversal"
  | "bw_negative"
  | "bw_reversal"
  | "instant";

export type PriceTier = 1 | 2 | 3;

export type GrainLevel = "fine" | "medium" | "heavy";
export type ContrastLevel = "low" | "medium" | "high";
export type BestFor =
  | "portrait"
  | "landscape"
  | "street"
  | "wedding"
  | "travel"
  | "night"
  | "studio"
  | "everyday";

export const GRAIN_LABELS: Record<GrainLevel, string> = {
  fine: "Fine",
  medium: "Medium",
  heavy: "Heavy",
};

export const CONTRAST_LABELS: Record<ContrastLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const BEST_FOR_LABELS: Record<BestFor, string> = {
  portrait: "Portraits",
  landscape: "Landscape",
  street: "Street",
  wedding: "Weddings",
  travel: "Travel",
  night: "Night / Low Light",
  studio: "Studio",
  everyday: "Everyday",
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
  shooting_tips: string | null;
  grain: string | null;
  contrast: string | null;
  latitude: string | null;
  color_palette: string | null;
  grain_level: GrainLevel;
  contrast_level: ContrastLevel;
  best_for: BestFor[];
  discontinued: boolean;
  price_tier: PriceTier | null;
  base_price_usd: number | null;
  image_url: string | null;
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
