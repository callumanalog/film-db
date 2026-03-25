# Exposure Club

Film photography database and community: browse film stocks and cameras, read reviews, upload community references, and track what you’ve shot — built with **Next.js** and **Supabase**.

## Getting started

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (e.g. [http://localhost:3000](http://localhost:3000)).

The dev script uses **Webpack** so `NEXT_PUBLIC_*` environment variables are picked up reliably (see [docs/SETUP-NEW-DEVICE.md](docs/SETUP-NEW-DEVICE.md)).

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

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Development server (Webpack) |
| `npm run build` / `npm start` | Production build and serve |
| `npm run lint` | ESLint |
| `npm run seed:supabase` | Seed Supabase from local data (requires service role where applicable) |
| `npm run upload:film-images` | Upload film stock images to Storage |

## CI

Pull requests run lint and production build via [`.github/workflows/ci.yml`](.github/workflows/ci.yml) with placeholder public Supabase env vars so the bundle can compile.
