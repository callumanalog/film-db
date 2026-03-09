import type { FilmCamera, CameraBrand, CameraType, CameraFormat } from "@/lib/types";
import { seedCameraBrands, seedFilmCameras } from "@/lib/camera-seed-data";

export interface CameraFilters {
  brand?: string;
  type?: CameraType;
  format?: CameraFormat;
  search?: string;
}

function getAllCameraBrands(): CameraBrand[] {
  return seedCameraBrands;
}

function getAllCameras(): (FilmCamera & { brand: CameraBrand })[] {
  return seedFilmCameras.map((cam) => ({
    ...cam,
    brand: seedCameraBrands.find((b) => b.id === cam.brand_id)!,
  }));
}

export async function getCameras(
  filters?: CameraFilters
): Promise<(FilmCamera & { brand: CameraBrand })[]> {
  let cameras = getAllCameras();

  if (filters) {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      cameras = cameras.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.brand.name.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q)) ||
          (c.lens_mount && c.lens_mount.toLowerCase().includes(q))
      );
    }
    if (filters.brand) {
      cameras = cameras.filter((c) => c.brand.slug === filters.brand);
    }
    if (filters.type) {
      cameras = cameras.filter((c) => c.type === filters.type);
    }
    if (filters.format) {
      cameras = cameras.filter((c) => c.format.includes(filters.format!));
    }
  }

  cameras.sort((a, b) => {
    const keyA = `${a.brand.name} ${a.name}`.toLowerCase();
    const keyB = `${b.brand.name} ${b.name}`.toLowerCase();
    return keyA.localeCompare(keyB);
  });

  return cameras;
}

export async function getCameraBySlug(
  slug: string
): Promise<(FilmCamera & { brand: CameraBrand }) | null> {
  const camera = seedFilmCameras.find((c) => c.slug === slug);
  if (!camera) return null;
  const brand = seedCameraBrands.find((b) => b.id === camera.brand_id)!;
  return { ...camera, brand };
}

export async function getCameraBrands(): Promise<CameraBrand[]> {
  return getAllCameraBrands();
}

export async function getCameraBrandBySlug(
  slug: string
): Promise<CameraBrand | null> {
  return seedCameraBrands.find((b) => b.slug === slug) || null;
}

export async function getCamerasByBrand(
  brandSlug: string
): Promise<(FilmCamera & { brand: CameraBrand })[]> {
  const cameras = getAllCameras();
  return cameras.filter((c) => c.brand.slug === brandSlug);
}

/** Up to `limit` other cameras from the same brand, excluding the given camera. */
export async function getMoreCamerasFromBrand(
  camera: FilmCamera & { brand: CameraBrand },
  limit = 6
): Promise<(FilmCamera & { brand: CameraBrand })[]> {
  const byBrand = await getCamerasByBrand(camera.brand.slug);
  return byBrand.filter((c) => c.id !== camera.id).slice(0, limit);
}

/** Related cameras: same type and/or format, same brand first. */
export async function getRelatedCameras(
  camera: FilmCamera,
  limit = 6
): Promise<(FilmCamera & { brand: CameraBrand })[]> {
  const all = getAllCameras();
  const candidates = all.filter((c) => c.id !== camera.id);

  const scored = candidates.map((c) => {
    const sameType = c.type === camera.type ? 1 : 0;
    const formatOverlap = c.format.some((f) => camera.format.includes(f)) ? 0.5 : 0;
    const sameBrand = c.brand_id === camera.brand_id ? 0.8 : 0;
    return { camera: c, score: sameType + formatOverlap + sameBrand };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(({ camera: c }) => c);
}
