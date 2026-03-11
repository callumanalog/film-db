/**
 * Shared sample image type and data for Gallery tab and full Sample Images page.
 * imageUrl is used for the full page so each image is saveable (download).
 */

export type SampleImageSource = "flickr" | "community";

export interface SampleImage {
  id: string;
  username: string;
  camera: string;
  settings: string;
  likes: number;
  source?: SampleImageSource;
  /** Optional URL for display/download; placeholder used when not set. */
  imageUrl?: string;
}

const BASE_GALLERY: SampleImage[] = [
  { id: "g1", username: "nightcrawler_35mm", camera: "Contax G2 · 45mm f/2", settings: "f/2 · 1/60s", likes: 134, source: "flickr" },
  { id: "g2", username: "analog.sara", camera: "Nikon FM2 · 50mm f/1.4", settings: "f/2 · 1/125s", likes: 87, source: "community" },
  { id: "g3", username: "filmvault", camera: "Canon AE-1 · 50mm f/1.8", settings: "f/1.8 · 1/30s", likes: 201, source: "flickr" },
  { id: "g4", username: "tokyoframes", camera: "Olympus OM-1 · 28mm f/2.8", settings: "f/2.8 · 1/60s", likes: 156, source: "flickr" },
  { id: "g5", username: "grainsofsilver", camera: "Leica M6 · 35mm f/1.4", settings: "f/1.4 · 1/125s", likes: 98, source: "community" },
  { id: "g6", username: "shutterdiaries", camera: "Pentax 67 · 105mm f/2.4", settings: "f/2.4 · 1/30s", likes: 178, source: "flickr" },
  { id: "g7", username: "halation.club", camera: "Nikon F3 · 85mm f/1.4", settings: "f/1.4 · 1/60s", likes: 112, source: "community" },
  { id: "g8", username: "reelmoments", camera: "Minolta X-700 · 50mm f/1.7", settings: "f/1.7 · 1/30s", likes: 67, source: "flickr" },
];

/** Stable placeholder image URL per id so downloads work. */
function placeholderUrl(id: string, w = 800, h = 600): string {
  return `https://picsum.photos/seed/${id}/${w}/${h}`;
}

/** Gallery for the tab (first 8). */
export const SAMPLE_GALLERY: SampleImage[] = BASE_GALLERY.map((img) => ({
  ...img,
  imageUrl: placeholderUrl(img.id),
}));

/** Extra rows for full page (same style, more items). */
const EXTRA_IMAGES: SampleImage[] = [
  { id: "g9", username: "neon.lab", camera: "Leica M3 · 50mm f/2", settings: "f/2 · 1/30s", likes: 92, source: "flickr" },
  { id: "g10", username: "street.silver", camera: "Nikon F2 · 35mm f/2", settings: "f/2.8 · 1/60s", likes: 145, source: "community" },
  { id: "g11", username: "cinestill.lover", camera: "Canon F-1 · 50mm f/1.4", settings: "f/1.4 · 1/125s", likes: 78, source: "flickr" },
  { id: "g12", username: "tungsten.tales", camera: "Pentax K1000 · 50mm f/1.7", settings: "f/2 · 1/60s", likes: 203, source: "flickr" },
  { id: "g13", username: "roll.by.roll", camera: "Olympus XA · 35mm f/2.8", settings: "f/2.8 · 1/30s", likes: 61, source: "community" },
  { id: "g14", username: "halation.hunter", camera: "Contax T2", settings: "f/2.8 · 1/60s", likes: 167, source: "flickr" },
  { id: "g15", username: "film.soup", camera: "Minolta SRT 101 · 58mm f/1.4", settings: "f/1.4 · 1/30s", likes: 89, source: "community" },
  { id: "g16", username: "night.shooter", camera: "Nikon FE2 · 28mm f/2.8", settings: "f/2.8 · 1/60s", likes: 124, source: "flickr" },
  { id: "g17", username: "800t.daily", camera: "Yashica T4", settings: "f/3.5 · 1/125s", likes: 156, source: "flickr" },
  { id: "g18", username: "analog.only", camera: "Canon EOS 1V · 50mm f/1.2", settings: "f/1.4 · 1/60s", likes: 98, source: "community" },
  { id: "g19", username: "red.glow", camera: "Leica M6 TTL · 35mm f/1.4", settings: "f/1.4 · 1/30s", likes: 212, source: "flickr" },
  { id: "g20", username: "cinema.still", camera: "Pentax 67II · 90mm f/2.8", settings: "f/2.8 · 1/125s", likes: 134, source: "flickr" },
];

/** Full list for the dedicated sample images page; every item has imageUrl for save. */
export function getSampleImagesForPage(slug: string): SampleImage[] {
  const extraWithUrls = EXTRA_IMAGES.map((img) => ({ ...img, imageUrl: placeholderUrl(img.id) }));
  return [...SAMPLE_GALLERY, ...extraWithUrls];
}

/** Image with stock/brand context for the global gallery. */
export interface GalleryImage extends SampleImage {
  stockSlug: string;
  stockName: string;
  brandName: string;
  /** Unique across all stocks (e.g. stockSlug-id). */
  galleryId: string;
}

export type StockForGallery = { slug: string; name: string; brand: { name: string } };

/** Flatten sample images for all given stocks; each image is tagged with its stock and brand. */
export function getGalleryImages(stocks: StockForGallery[]): GalleryImage[] {
  const out: GalleryImage[] = [];
  for (const stock of stocks) {
    const images = getSampleImagesForPage(stock.slug);
    const stockName = stock.name;
    for (const img of images) {
      out.push({
        ...img,
        galleryId: `${stock.slug}-${img.id}`,
        stockSlug: stock.slug,
        stockName,
        brandName: stock.brand.name,
      });
    }
  }
  return out;
}
