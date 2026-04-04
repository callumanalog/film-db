# Exposure Club

Film photography database and community: browse film stocks and cameras, read reviews, upload community references, and track what you’ve shot — built with **Next.js** and **Supabase**.

## Getting started

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (e.g. [http://localhost:3000](http://localhost:3000)).

The dev script uses **Webpack** so `NEXT_PUBLIC_*` environment variables are picked up reliably (see [docs/SETUP-NEW-DEVICE.md](docs/SETUP-NEW-DEVICE.md)).

## Website + app

The website remains the canonical product. Mobile app work uses a **Capacitor shell** that points at hosted staging/production deployments of the same Next.js app, with only a thin runtime layer for safe areas, status bar polish, and later native features.

See [docs/CAPACITOR.md](docs/CAPACITOR.md) for:

- the readiness threshold before wrapping
- staging vs production app configuration
- Android-first rollout steps
- iOS/TestFlight follow-up
- native feature sequencing

## Tech stack

- **Next.js 16** (App Router, React Server Components, TypeScript)
- **Tailwind CSS v4** and shared UI components
- **Supabase** (PostgreSQL, Auth, Storage) for accounts, profiles, reviews, uploads, and optional hosted catalog
- **Vercel Speed Insights** (optional telemetry when deployed on Vercel)

## Current features

- Film stock catalog with filters, search, brand pages, and rich detail pages (specs, tips, buy links, community gallery, reviews)
- **Discover** and **Community** views for browsing uploads
- **Accounts:** sign-up, sign-in, password reset, profiles (shot / favourite / rate / track, reviews, uploads)
- **Cameras** directory (seed data)
- **Admin** UI for catalog maintenance (Supabase `profiles.role = admin`)
- **Legal:** Terms of use and Privacy Policy (`/terms`, `/privacy`)
- **SEO:** `sitemap.xml` and `robots.txt` via App Router conventions

Without Supabase env vars, the app still runs on local/seed catalog data; auth and community persistence require a project — see [docs/SETUP.md](docs/SETUP.md).

## Environment variables

Copy [.env.local.example](.env.local.example) to `.env.local` and fill in values. Never commit real secrets.

## Database

Migrations live in `src/supabase/migrations/` (core schema and community tables) and `supabase/migrations/` (catalog evolutions and follow-on features). Apply **both** tracks in numeric order on a new project — full instructions in [docs/SETUP.md](docs/SETUP.md).

Production must include **`038`** (upload `format` / `location`) and **`057`** (`user_uploads.shot_date`, `tags`); without them, share-roll inserts can fail after storage uploads. The API surfaces migration hints when inserts error.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Development server (Webpack) |
| `npm run build` / `npm start` | Production build and serve |
| `npm run lint` | ESLint |
| `npm run cap:sync` | Sync Capacitor config/plugins into native shells |
| `npm run cap:open:android` | Open the Android project in Android Studio |
| `npm run cap:open:ios` | Open the iOS project in Xcode |
| `npm run cap:run:android` | Build/run the Android shell on a connected device |
| `npm run seed:supabase` | Seed Supabase from local data (requires service role where applicable) |
| `npm run upload:film-images` | Upload film stock images to Storage |
| `npm run replace:film-images` | Replace existing film stock Storage images in bulk |
| `npm run replace:single-film-image` | Replace one film stock Storage image by slug |
| `npm run fix:film-image-urls` | Rewrite legacy `/films/...` DB paths to Supabase public URLs |
| `npm run check:film-image-urls` | Validate that runtime film stock image URLs are canonical Supabase Storage URLs |
| `npm run normalize:film-images` | Normalize raw stock shots into box-only white-canvas images |
| `npm run replace:normalized-film-images` | Upload normalized film images from `public/films-normalized` |
| `npm run refresh:film-images` | Normalize, bulk replace, and validate image URLs in one run |

## Film image workflow

Use the box-only normalization pipeline when you want film stock product images to share:
- a fixed canvas size
- a consistent white background
- a similar visual scale across stocks
- only the film box, not the canister

The current normalization target is a `1600x1200` landscape canvas so product images use less vertical space on larger detail layouts while still sitting cleanly inside square thumbnail containers.

Folder flow:
- `public/films-source`: raw source product shots named by slug
- `public/films-normalized`: generated production-ready images
- `public/films-debug`: review images showing the detected crop area
- `public/films-overrides.json`: optional per-slug crop and scaling overrides

Typical flow:

```bash
npm run normalize:film-images
npm run replace:normalized-film-images
npm run check:film-image-urls
```

If the detector misses a box, add an override in `public/films-overrides.json` and rerun normalization.

## CI

Pull requests run lint and production build via [`.github/workflows/ci.yml`](.github/workflows/ci.yml) with placeholder public Supabase env vars so the bundle can compile.
