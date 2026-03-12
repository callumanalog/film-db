# FilmDB — Supabase setup

This app uses **Supabase** for auth, user profiles, reviews, uploads, and optionally the film catalog. Follow these steps to run it properly with user accounts and image uploads.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a project (or use an existing one).
2. In **Project Settings → API**, copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. (Optional) For running seed scripts or admin operations that bypass RLS, copy the **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`. **Never** expose this in client code.

## 2. Environment variables

Copy the example env and fill in Supabase:

```bash
cp .env.local.example .env.local
```

In `.env.local` set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

For one-off admin scripts (e.g. creating a user without the sign-up flow), also set:

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Get it from **Supabase Dashboard → Settings → API → service_role**. Never expose this in client code or commit it.

Without these, the app still runs using local/seed data, but sign-in and profile/reviews/uploads will not work.

## 3. Run database migrations

In the Supabase Dashboard go to **SQL Editor** and run the migrations in order:

1. **First:** `src/supabase/migrations/001_initial_schema.sql` (if you use Supabase for the catalog).
2. **Second:** `src/supabase/migrations/002_storage_buckets.sql` (for user uploads and film images).
3. **Required for actions and stats:** `src/supabase/migrations/003_user_actions_and_stats.sql`  
   - Creates `profiles`, `user_shot`, `user_favourites`, `user_tracked`, `user_ratings`, `user_shootlist`, `reviews`, `user_uploads`, and the `get_film_stock_stats` RPC. Without this, Shot it / Favourite / Rate won’t persist and film page stats will stay at zero.

If you use the Supabase CLI instead:

```bash
npx supabase link --project-ref your-project-ref
npx supabase db push
```

## 4. Enable Auth (Email)

In Supabase: **Authentication → Providers**:

- Enable **Email**.
- Optionally enable **Confirm email** (recommended for production). If you enable it, users must click the confirmation link before signing in.
- You can also enable **Google** or other providers later.

## 5. (Optional) Create a user without the sign-up flow

To create an auth user directly in Supabase (e.g. for your own account without going through sign-up/email confirmation):

1. Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` (see step 2).
2. Run:
   ```bash
   npx tsx scripts/create-auth-user.ts "YourChosenPassword"
   ```
3. Sign in at **/auth/sign-in** with the same email and password. The script creates the user with email and display name; the password is the one you pass to the script.

You can edit `scripts/create-auth-user.ts` to change the email and display name, or pass them as arguments if you extend the script.

## 6. (Optional) Use Supabase for the film catalog

By default the app reads brands and film stocks from local files / seed data. To use Supabase for the catalog as well (Option B — catalog in Supabase Storage):

1. **Populate `brands` and `film_stocks`**  
   You can insert rows via the Supabase Table Editor, or run a one-time seed script that reads from `data/film-stocks.json` (and brands) and inserts into Supabase. The app’s queries will use Supabase when these tables have data.

2. **Catalog images in Storage**  
   - Put images in the **film-stocks** bucket (e.g. under paths like `portra-400.jpg` or `kodak/portra-400.jpg`).
   - Set each film stock’s `image_url` in the `film_stocks` table to the **public URL** of that image (e.g. `https://your-project.supabase.co/storage/v1/object/public/film-stocks/portra-400.jpg`).

Until `brands` and `film_stocks` are populated in Supabase, the app keeps using the existing file/seed catalog.

## 7. Deploy (e.g. Vercel)

Add the same env vars in your hosting provider:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Then deploy. Auth, profile, reviews, and user uploads will work against your Supabase project.

---

## Summary of what’s implemented

| Feature | Where it lives |
|--------|-----------------|
| **Auth** | Supabase Auth (email sign-in/sign-up). Session in cookies via `@supabase/ssr`. |
| **Profiles** | `profiles` table + `user_shot`, `user_favourites`, `user_tracked`, `user_ratings`. |
| **Reviews** | `reviews` table. Submitted from the “Add review & photos” modal when logged in. |
| **User uploads** | `user_uploads` table + **user-uploads** storage bucket. Images uploaded from the same modal. |
| **Catalog** | Optional: `brands`, `film_stocks`, `film_stock_purchase_links`. Images in **film-stocks** bucket. If empty, app uses local/seed data. |

If something doesn’t work, check the browser console and Supabase Dashboard (Auth, Table Editor, Storage, Logs).
