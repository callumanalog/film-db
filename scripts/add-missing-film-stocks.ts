import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type BrandSlug = "fujifilm" | "harman" | "kodak" | "lomography";
type FilmType = "color_negative" | "bw_negative";
type DevelopmentProcess = "c41" | "bw";
type ColorBalanceType = "daylight" | "tungsten" | null;
type BestFor =
  | "general_purpose"
  | "portrait"
  | "street"
  | "landscapes"
  | "documentary"
  | "travel"
  | "weddings"
  | "bright_sun"
  | "golden_hour"
  | "artificial_light"
  | "experimental";

interface ShootingNote {
  header: string;
  dek: string;
}

interface StockSeed {
  slug: string;
  name: string;
  brandSlug: BrandSlug;
  format: ("35mm" | "120")[];
  type: FilmType;
  iso: number;
  description: string;
  history: string;
  shooting_notes: ShootingNote[];
  grain: 1 | 2 | 3 | 4 | 5;
  contrast: 1 | 2 | 3 | 4 | 5;
  latitude: 1 | 2 | 3 | 4 | 5;
  saturation: 1 | 2 | 3 | 4 | 5 | null;
  color_balance: string | null;
  color_balance_type: ColorBalanceType;
  color_balance_kelvin: number | null;
  dx_coding: boolean;
  development_process: DevelopmentProcess;
  best_for: BestFor[];
  discontinued: boolean;
  image_url: string | null;
  year_introduced: number | null;
  featured: boolean;
}

const stocks: StockSeed[] = [
  {
    slug: "fujifilm-400",
    name: "Fujifilm 400",
    brandSlug: "fujifilm",
    format: ["35mm"],
    type: "color_negative",
    iso: 400,
    description:
      "Fujifilm 400 is a daylight-balanced consumer color negative film that delivers the familiar Fuji mix of crisp sharpness, lively color, and forgiving exposure latitude at an easy all-round speed. It is designed as a versatile everyday stock for travel, family snapshots, and general outdoor shooting.",
    history:
      "Fujifilm 400 is part of Fujifilm's current consumer-film lineup in the US market. It is positioned as a modern, accessible 400-speed color negative film that continues Fujifilm's long-standing consumer color tradition after much of the older Superia range became harder to find in some regions.",
    shooting_notes: [
      {
        header: "Color Bias",
        dek: "Expect a classic Fuji palette with clean blues and greens, natural skin tones, and enough punch to make daylight scenes feel lively without looking overly processed.",
      },
      {
        header: "Latitude",
        dek: "It is forgiving for a consumer 400-speed film and handles bright outdoor contrast well. Slight overexposure smooths grain and keeps colors especially pleasant.",
      },
      {
        header: "Best Light",
        dek: "Works best in daylight, open shade, and travel situations where you want one roll to cover a wide range of scenes without much fuss.",
      },
    ],
    grain: 2,
    contrast: 3,
    latitude: 4,
    saturation: 4,
    color_balance: "Daylight-balanced (≈5500K)",
    color_balance_type: "daylight",
    color_balance_kelvin: 5500,
    dx_coding: true,
    development_process: "c41",
    best_for: ["general_purpose", "travel", "street", "documentary", "bright_sun"],
    discontinued: false,
    image_url: null,
    year_introduced: 2023,
    featured: false,
  },
  {
    slug: "harman-phoenix-ii",
    name: "Harman Phoenix II 200",
    brandSlug: "harman",
    format: ["35mm", "120"],
    type: "color_negative",
    iso: 200,
    description:
      "Harman Phoenix II 200 is the second-generation version of Harman's experimental color negative film. It keeps Phoenix's bold personality but improves color control, sharpness, grain, and scan-friendliness for a more usable everyday creative stock.",
    history:
      "Released in 2025, Phoenix II followed the original Phoenix 200 as Harman Technology refined its first in-house color-film platform. The second version was introduced as a more balanced and practical evolution rather than a complete departure from the original film's character.",
    shooting_notes: [
      {
        header: "Character",
        dek: "Phoenix II still has a distinctly expressive look, but it is more controlled than the original Phoenix, with cleaner color separation and less unruly grain.",
      },
      {
        header: "Exposure",
        dek: "Harman recommends working around EI 100-200 for best results. A little extra exposure helps preserve smoother shadows and more stable color.",
      },
      {
        header: "Scanning",
        dek: "Compared with the first Phoenix release, highlights and shadows are easier to manage in scans, making it a better fit for day-to-day shooting as well as experimental work.",
      },
    ],
    grain: 4,
    contrast: 4,
    latitude: 3,
    saturation: 4,
    color_balance: "Daylight-balanced (≈5500K)",
    color_balance_type: "daylight",
    color_balance_kelvin: 5500,
    dx_coding: true,
    development_process: "c41",
    best_for: ["street", "travel", "general_purpose", "experimental"],
    discontinued: false,
    image_url: null,
    year_introduced: 2025,
    featured: false,
  },
  {
    slug: "harman-red",
    name: "Harman Red 125",
    brandSlug: "harman",
    format: ["35mm", "120"],
    type: "color_negative",
    iso: 125,
    description:
      "Harman Red 125 is a professionally finished redscale color negative film built on Harman's Phoenix emulsion. It produces dramatic red, orange, and yellow-heavy images with a deliberately stylized palette that turns ordinary scenes into something cinematic and surreal.",
    history:
      "Released in 2025, Harman Red 125 expanded Harman Technology's early color-film lineup beyond standard negative stocks into creatively modified emulsions. It was introduced as a ready-to-shoot redscale film rather than a homemade redscale workaround.",
    shooting_notes: [
      {
        header: "Color Shift",
        dek: "Red, orange, and yellow tones dominate the frame, while greens can behave unpredictably depending on subject matter and scan choices. The effect is the point of the film, not a flaw.",
      },
      {
        header: "Exposure",
        dek: "It can be used across a broad range, but shooting around EI 100-200 gives the most balanced results. More exposure tends to brighten the image and tame grain slightly.",
      },
      {
        header: "Use Case",
        dek: "Best for portraits, street scenes, golden hour, and any project where a strong warm cast is part of the desired aesthetic rather than something to correct away.",
      },
    ],
    grain: 3,
    contrast: 4,
    latitude: 3,
    saturation: 5,
    color_balance: "Redscale creative daylight-balanced C-41 film",
    color_balance_type: "daylight",
    color_balance_kelvin: 5500,
    dx_coding: true,
    development_process: "c41",
    best_for: ["portrait", "street", "golden_hour", "experimental"],
    discontinued: false,
    image_url: null,
    year_introduced: 2025,
    featured: false,
  },
  {
    slug: "harman-switch-azure",
    name: "Harman Switch Azure 125",
    brandSlug: "harman",
    format: ["35mm", "120"],
    type: "color_negative",
    iso: 125,
    description:
      "Harman Switch Azure 125 is a creative color negative film designed for intentionally shifted, surreal color. It remaps familiar hues into unexpected blues, oranges, purples, and cyan tones, making it a stock built for experimentation rather than neutrality.",
    history:
      "Released in 2026, Switch Azure joined Harman Technology's growing family of creative color films after Phoenix, Phoenix II, and Red. It was introduced as a purpose-built effect film whose final look depends heavily on scene colors and scanner interpretation.",
    shooting_notes: [
      {
        header: "Color Shift",
        dek: "This film intentionally swaps familiar color relationships, so blues can skew orange while warmer tones can veer toward purple or azure. Consistent realism is not the goal.",
      },
      {
        header: "Scanning",
        dek: "Scanner choice and color correction have a large effect on the final result. The same negative can look noticeably different depending on who scans it and how heavily it is corrected.",
      },
      {
        header: "Best Use",
        dek: "Ideal for travel, landscapes, and creative personal work where unusual color is an advantage. It rewards photographers who want to lean into surprise rather than control every hue precisely.",
      },
    ],
    grain: 3,
    contrast: 3,
    latitude: 3,
    saturation: 4,
    color_balance: "Creative switched-color daylight-balanced C-41 film",
    color_balance_type: "daylight",
    color_balance_kelvin: 5500,
    dx_coding: true,
    development_process: "c41",
    best_for: ["landscapes", "travel", "general_purpose", "experimental"],
    discontinued: false,
    image_url: null,
    year_introduced: 2026,
    featured: false,
  },
  {
    slug: "kodak-proimage-100",
    name: "Kodak Pro Image 100",
    brandSlug: "kodak",
    format: ["35mm"],
    type: "color_negative",
    iso: 100,
    description:
      "Kodak Pro Image 100 is a professional daylight-balanced color negative film known for warm skin tones, clean grain, and forgiving behavior in bright conditions. It sits between consumer and pro portrait stocks, offering a polished Kodak look at a comparatively approachable price.",
    history:
      "Kodak introduced Pro Image 100 in 1997 as a professional film aimed at portrait and social photography. It developed a strong reputation in markets outside the US for pairing flattering color with generous exposure behavior and good latent-image keeping.",
    shooting_notes: [
      {
        header: "Skin Tones",
        dek: "This is one of the stock's strongest traits. It renders skin warmly and naturally, making it especially attractive for portraits, weddings, and casual people photography.",
      },
      {
        header: "Latitude",
        dek: "Pro Image 100 tolerates overexposure very gracefully, which makes it easy to rate a little generously when you want smoother negatives and richer color.",
      },
      {
        header: "Color Bias",
        dek: "Expect a warm Kodak palette with healthy reds and yellows, moderate saturation, and a polished look that favors people and sunlit scenes.",
      },
    ],
    grain: 1,
    contrast: 2,
    latitude: 4,
    saturation: 4,
    color_balance: "Daylight-balanced (≈5500K)",
    color_balance_type: "daylight",
    color_balance_kelvin: 5500,
    dx_coding: true,
    development_process: "c41",
    best_for: ["portrait", "weddings", "travel", "general_purpose", "golden_hour", "bright_sun"],
    discontinued: false,
    image_url: null,
    year_introduced: 1997,
    featured: false,
  },
  {
    slug: "lomography-earl-grey-100",
    name: "Lomography Earl Grey 100",
    brandSlug: "lomography",
    format: ["35mm", "120"],
    type: "bw_negative",
    iso: 100,
    description:
      "Lomography Earl Grey 100 is a fine-grained panchromatic black-and-white negative film with crisp detail, bright highlights, and a refined tonal range. It offers a cleaner, slower counterpart to Lady Grey 400 while still keeping the accessible character that defines Lomography's B&W line.",
    history:
      "Earl Grey 100 was introduced as Lomography's lower-speed everyday black-and-white stock and is positioned as the finer-grained partner to Lady Grey 400. It has become a popular choice for photographers who want a simple, modern B&W film with good tonality in both 35mm and 120.",
    shooting_notes: [
      {
        header: "Tonality",
        dek: "The film produces bright whites, rich blacks, and smooth midtones without feeling flat. It has enough snap for everyday shooting while keeping a clean, elegant grayscale.",
      },
      {
        header: "Grain",
        dek: "Grain stays fine and well controlled for a classic-looking ISO 100 B&W film, especially in 120 where it appears especially smooth.",
      },
      {
        header: "Best Light",
        dek: "It thrives in bright daylight and open shade. Indoors it benefits from flash or stronger light, since the slower speed is part of what gives it its clean look.",
      },
    ],
    grain: 1,
    contrast: 3,
    latitude: 3,
    saturation: null,
    color_balance: "Panchromatic",
    color_balance_type: null,
    color_balance_kelvin: null,
    dx_coding: true,
    development_process: "bw",
    best_for: ["portrait", "street", "landscapes", "general_purpose", "experimental"],
    discontinued: false,
    image_url: null,
    year_introduced: 2014,
    featured: false,
  },
];

async function main() {
  const targetBrandSlugs = [...new Set(stocks.map((stock) => stock.brandSlug))];
  const { data: brands, error: brandError } = await supabase
    .from("film_brands")
    .select("id, slug")
    .in("slug", targetBrandSlugs);

  if (brandError) {
    throw brandError;
  }

  const brandIdBySlug = new Map((brands ?? []).map((brand) => [brand.slug as BrandSlug, brand.id as string]));

  for (const brandSlug of targetBrandSlugs) {
    if (!brandIdBySlug.has(brandSlug)) {
      throw new Error(`Missing film brand in Supabase: ${brandSlug}`);
    }
  }

  const rows = stocks.map((stock) => ({
    name: stock.name,
    slug: stock.slug,
    brand_id: brandIdBySlug.get(stock.brandSlug)!,
    format: stock.format,
    type: stock.type,
    iso: stock.iso,
    description: stock.description,
    history: stock.history,
    shooting_notes: stock.shooting_notes,
    grain: stock.grain,
    contrast: stock.contrast,
    latitude: stock.latitude,
    saturation: stock.saturation,
    color_balance: stock.color_balance,
    color_balance_type: stock.color_balance_type,
    color_balance_kelvin: stock.color_balance_kelvin,
    dx_coding: stock.dx_coding,
    development_process: stock.development_process,
    best_for: stock.best_for,
    discontinued: stock.discontinued,
    image_url: stock.image_url,
    year_introduced: stock.year_introduced,
    featured: stock.featured,
  }));

  const { data, error } = await supabase
    .from("film_stocks")
    .upsert(rows, { onConflict: "slug" })
    .select("slug, name");

  if (error) {
    throw error;
  }

  console.log("Upserted film stocks:");
  for (const row of data ?? []) {
    console.log(`- ${row.slug} (${row.name})`);
  }
}

main().catch((error) => {
  console.error("Failed to add missing film stocks:", error);
  process.exit(1);
});
