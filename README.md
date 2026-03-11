# FilmDB

A comprehensive film photography database and community resource. Browse every film stock, learn the history, get shooting tips, find where to buy, and view sample images.

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- **Next.js 16** (App Router, React Server Components, TypeScript)
- **Tailwind CSS v4** + **shadcn/ui** components
- **Supabase** (PostgreSQL, Auth, Storage) — ready to connect
- Seed data included for 20 film stocks (works without Supabase)

## Current Features

- Dark theme with warm amber accents
- 20 film stocks with detailed descriptions, history, shooting tips, and purchase links
- Film stock browser with filtering by brand, type, format, and search
- Individual film stock detail pages with specs, history, tips, buy links, and related stocks
- Brand pages with descriptions and film stock listings
- Responsive design (mobile-first)
- Loading skeleton states

## Future Phases

- User accounts and community image uploads
- Roll tracking (log your rolls, link to scans)
- Lab finder with map integration
- Reviews, ratings, and social features

## Database

The app currently runs on local seed data. To connect to Supabase:

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run the migration in `src/supabase/migrations/001_initial_schema.sql`.
3. Copy `.env.local.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from Project Settings → API).
4. Update `src/lib/supabase/queries.ts` to use the Supabase client instead of seed data.

### GitHub and secrets

- **Never commit real keys.** `.env*` is in `.gitignore`; only commit `.env.local.example` (no real values).
- **CI (e.g. GitHub Actions):** Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as repository secrets, and inject them as env vars in your workflow.
- **Deployments (Vercel, etc.):** Configure the same env vars in the host’s dashboard (or link Supabase via their integration). Use the anon key for the frontend; it’s safe for client-side use with Row Level Security.
