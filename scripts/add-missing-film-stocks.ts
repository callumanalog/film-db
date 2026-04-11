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
    image_url: "https://wgrnjwqrmikfypvtwdab.supabase.co/storage/v1/object/public/film-stocks/fujifilm-400.jpg",
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
    image_url: "/films/harman-phoenix-ii.jpg",
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
    image_url: "/films/harman-red.jpg",
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
    image_url: "/films/harman-switch-azure.jpg",
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
    image_url: "https://wgrnjwqrmikfypvtwdab.supabase.co/storage/v1/object/public/film-stocks/kodak-proimage-100.jpg",
    year_introduced: 1997,
    featured: false,
  },
  {
    slug: "kodak-kodacolor-100",
    name: "Kodak Kodacolor 100",
    brandSlug: "kodak",
    format: ["35mm"],
    type: "color_negative",
    iso: 100,
    description:
      "Kodak Kodacolor 100 is a daylight-balanced consumer color negative film sold through Eastman Kodak's revived direct still-film distribution, rather than the long-running Kodak Alaris channel. It offers fine grain, high sharpness, and a natural, balanced Kodak color palette that suits travel, portraits, and general-purpose daylight shooting when you want a cleaner, slower-speed consumer stock.",
    history:
      "Eastman Kodak reintroduced the Kodacolor name in 2025 as part of its return to directly distributing still films for the first time since 2013, reviving one of Kodak's best-known consumer color brands for a new 35mm release. Kodak has described Kodacolor 100 as a sub-brand of an existing Kodak emulsion rather than a wholly new chemistry, but has not published a full datasheet confirming its exact lineage.",
    shooting_notes: [
      {
        header: "Color Bias",
        dek: "Kodacolor 100 leans more natural and neutral than many people expect from a consumer Kodak stock. Colors stay clean and believable, with enough warmth for classic Kodak character without the heavier golden cast of Gold 200.",
      },
      {
        header: "Grain",
        dek: "Grain is fine and fairly tight for a consumer color negative film. It is not as ultra-smooth as Ektar 100, but it looks cleaner and more controlled than the faster Kodak consumer stocks.",
      },
      {
        header: "Highlights",
        dek: "Despite Kodak's wide-latitude marketing, highlights can clip sooner than expected in harsh sun. Metering carefully for bright scenes pays off, especially around white buildings, pavement, and reflective surfaces.",
      },
      {
        header: "Shadow Detail",
        dek: "Shadow recovery is one of the stock's better traits. It keeps usable detail in darker areas when exposure is close, which helps offset its more fragile highlight handling.",
      },
      {
        header: "Best Light",
        dek: "It is strongest in bright daylight, open shade, and controlled outdoor light. This is a film for clean, sunlit shooting rather than dim interiors or dramatic backlit contrast.",
      },
    ],
    grain: 1,
    contrast: 3,
    latitude: 4,
    saturation: 3,
    color_balance: "Natural-to-warm daylight balance with restrained saturation",
    color_balance_type: "daylight",
    color_balance_kelvin: 5500,
    dx_coding: true,
    development_process: "c41",
    best_for: ["general_purpose", "travel", "portrait", "documentary", "bright_sun"],
    discontinued: false,
    image_url: "https://wgrnjwqrmikfypvtwdab.supabase.co/storage/v1/object/public/film-stocks/kodak-kodacolor-100.jpg",
    year_introduced: 2025,
    featured: false,
  },
  {
    slug: "kodak-kodacolor-200",
    name: "Kodak Kodacolor 200",
    brandSlug: "kodak",
    format: ["35mm"],
    type: "color_negative",
    iso: 200,
    description:
      "Kodak Kodacolor 200 is a daylight-balanced consumer color negative film sold through Eastman Kodak's restored direct still-film distribution channel, distinct from the Kodak Alaris marketed still-film line. In practice it occupies the same budget-friendly everyday space as Kodak ColorPlus 200, with warm nostalgic rendering, moderate grain, and straightforward performance in bright conditions.",
    history:
      "Eastman Kodak launched Kodacolor 200 in 2025 as part of the Kodacolor revival and its first directly distributed still-film range since 2013. Kodak and the trade press positioned Kodacolor 200 as a sub-brand of an existing Kodak emulsion, and it has been widely identified as effectively the same film as Kodak ColorPlus 200 under Eastman Kodak's new distribution strategy.",
    shooting_notes: [
      {
        header: "Skin Tones",
        dek: "Warm and nostalgic. It has a classic family-photo feel, leaning toward yellow and red tones that feel very 1980s/90s.",
      },
      {
        header: "Color Bias",
        dek: "Definite yellow/red bias. It is less sophisticated than the professional stocks, often producing a warm wash over the entire image.",
      },
      {
        header: "Push/Pull",
        dek: "Poor. Pushing leads to a noticeable grain increase and muddier, browner shadows. It works best at box speed or with a small amount of overexposure.",
      },
      {
        header: "Shadow Detail",
        dek: "Moderate to low. It wants plenty of light to avoid becoming grainy and soft in darker areas.",
      },
      {
        header: "Highlight Roll-off",
        dek: "Good. It keeps enough of the classic Kodak consumer ability to hold bright skies and sunlit areas if exposure is sensible.",
      },
    ],
    grain: 3,
    contrast: 3,
    latitude: 3,
    saturation: 3,
    color_balance: "Warm, slightly muted, nostalgic",
    color_balance_type: "daylight",
    color_balance_kelvin: 5500,
    dx_coding: true,
    development_process: "c41",
    best_for: ["general_purpose", "travel", "bright_sun"],
    discontinued: false,
    image_url: "https://wgrnjwqrmikfypvtwdab.supabase.co/storage/v1/object/public/film-stocks/kodak-kodacolor-200.jpg",
    year_introduced: 2025,
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
