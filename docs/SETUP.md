# Exposure Club — Supabase setup

This app uses **Supabase** for auth, user profiles, reviews, uploads, and optionally the film catalog. Follow these steps to run **Exposure Club** with user accounts and image uploads.

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

Without these, the app still runs using local/seed data, but log-in and profile/reviews/uploads will not work.

**Production (email verification):** So that sign-up and password-reset emails link to your live site instead of localhost, set your canonical URL:

```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

**Sending email with Resend (optional):** If you use the Resend Node.js SDK (e.g. `/api/send` or custom transactional emails), add:

```env
RESEND_API_KEY=re_your_api_key
```

Get the key from [resend.com/api-keys](https://resend.com/api-keys). For production, use a [verified domain](https://resend.com/domains) in the `from` address.

**Support email (optional):** Set `NEXT_PUBLIC_SUPPORT_EMAIL` so Terms, Privacy, and Settings can show a contact address. See `.env.local.example`.

**Flickr (optional):** Set `FLICKR_API_KEY` for reference photos on film pages (see `src/lib/flickr.ts`).

## 3. Run database migrations

Apply SQL in **numeric filename order** on a fresh project (or use migrations you have not yet applied).

**Track A — core schema, auth-adjacent tables, reviews, uploads, stats**  
Run every file under `src/supabase/migrations/` **in order**: `001` → `012` (e.g. `001_initial_schema.sql` through `012_simplify_remove_roll_tracking.sql`). Highlights:

- `001` — initial catalog tables (if you host the catalog in Supabase).
- `003` — `profiles`, user actions (`user_shot`, `user_favourites`, etc.), `reviews`, `user_uploads`, `get_film_stock_stats`.
- `004` — review columns + **public read** policy on `reviews` (community tabs).
- `005` — **public read** on `user_uploads` (community gallery).
- `006`–`008` — storage buckets and related pieces.

**Track B — catalog data migrations and follow-on features**  
After Track A, run every file under `supabase/migrations/` **in order**: `009` → `036` (film stock columns, profile email verification, admin `role`, review likes, follows, **`user_uploads.review_id`**, and **`036` = Storage bucket `user-uploads`** with RLS — required for review image uploads).

If you use the Supabase CLI, point it at the migration folder you are tracking or paste SQL in the Dashboard **SQL Editor** in the same order.

```bash
npx supabase link --project-ref your-project-ref
npx supabase db push
```

## 4. Enable Auth (Email)

In Supabase: **Authentication → Providers**:

- Enable **Email**.
- Optionally enable **Confirm email** (recommended for production). If you enable it, users must click the confirmation link before signing in.
- You can also enable **Google** or other providers later.

## 5. (Optional) Custom SMTP for auth emails

Supabase’s built-in email service has a **fixed rate limit** (e.g. 2 emails/hour on free tier). If you hit “email rate limit exceeded” during sign-up or password reset, configure a custom SMTP provider so you can send more auth emails.

**Using Resend (free tier):**

1. **Sign up at [resend.com](https://resend.com)** and create an API key (**API Keys** in the dashboard).
2. **Add a domain** in Resend (or use their test sender `onboarding@resend.dev` for development).
3. In Resend, open **Domains** → your domain → **SMTP** and note:
   - **Host:** `smtp.resend.com`
   - **Port:** `465` (SSL) or `587` (TLS)
   - **Username:** `resend`
   - **Password:** your Resend API key (starts with `re_`)
4. **In Supabase:** **Project Settings** (gear) → **Auth** → scroll to **SMTP Settings**.
5. Enable **Custom SMTP** and fill in:
   - **Sender email:** Your verified address (e.g. `noreply@yourdomain.com`) or `onboarding@resend.dev` for testing.
   - **Sender name:** e.g. `Exposure Club`
   - **Host:** `smtp.resend.com`
   - **Port:** `465` or `587`
   - **Username:** `resend`
   - **Password:** your Resend API key
6. Save. All auth emails (sign-up confirmation, password reset, etc.) will go through Resend. The built-in rate limit no longer applies; you’re limited by Resend’s plan instead.

Other providers (SendGrid, Postmark, etc.) work the same way: get their SMTP host, port, username, and password from their docs and enter them in **Auth → SMTP Settings**.

## 6. (Optional) Create a user without the sign-up flow

To create an auth user directly in Supabase (e.g. for your own account without going through sign-up/email confirmation):

1. Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local` (see step 2).
2. Run:
   ```bash
   npx tsx scripts/create-auth-user.ts "YourChosenPassword"
   ```
3. Log in at **/auth/sign-in** with the same email and password. The script creates the user with email and display name; the password is the one you pass to the script.

You can edit `scripts/create-auth-user.ts` to change the email and display name, or pass them as arguments if you extend the script.

## 7. (Optional) Use Supabase for the film catalog

By default the app reads brands and film stocks from local files / seed data. To use Supabase for the catalog as well (Option B — catalog in Supabase Storage):

1. **Populate `brands` and `film_stocks`**  
   You can insert rows via the Supabase Table Editor, or run a one-time seed script that reads from `data/film-stocks.json` (and brands) and inserts into Supabase. The app’s queries will use Supabase when these tables have data.

2. **Catalog images in Storage**  
   - Create the **film-stocks** bucket by running `src/supabase/migrations/008_film_stocks_storage_bucket.sql` in the SQL Editor (or run `npx supabase db push` if you use the CLI).
   - Either upload images manually in the Dashboard (Storage → film-stocks) and set each `film_stocks.image_url` to the image’s public URL, or use the automated script:
     - Put your image files in a folder (e.g. `film-stock-images/`) with **filenames matching film stock slugs** (e.g. `portra-400.jpg`, `adox-chs-100-ii.jpg`).
     - In `.env.local` set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
     - Run: `npx tsx scripts/upload-film-stock-images.ts film-stock-images`  
     The script uploads each file to the bucket and updates `film_stocks.image_url` for the matching slug.
   - Public URL form: `https://<project>.supabase.co/storage/v1/object/public/film-stocks/<filename>`.

3. **Replacing placeholder images**  
   When you have new images (e.g. background-removed or reshot) for existing stocks:
   - **Option A — Match bucket filenames (easiest):** Name each new file exactly as it appears in Storage (e.g. `adox-chs-100.jpg`, `portra-400.jpg`). Put them in a folder (e.g. `public/films`) and run:
     ```bash
     npx tsx scripts/replace-film-stock-images.ts public/films
     ```
     This uploads each file (overwriting the object in the bucket) and updates any `film_stocks` row that points to that filename. No slug list needed.
   - **Option B — Name by slug:** Name files by `film_stocks.slug` (e.g. `adox-chs-100-ii.jpg`, `kodak-gold-200.jpg`). Run `npx tsx scripts/upload-film-stock-images.ts <folder>`. Use this when adding new stocks or when you prefer slug-based filenames.

Until `brands` and `film_stocks` are populated in Supabase, the app keeps using the existing file/seed catalog.

## 8. Deploy (e.g. Vercel)

In your hosting dashboard, set at least:

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Same as local. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Anon key only in the client bundle. |
| `NEXT_PUBLIC_APP_URL` | **Yes (production)** | Canonical `https://your-domain.com` — auth email links and SEO metadata. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Recommended** | Server-only. Used for sign-up edge cases (`sign-up-status`). Without it, duplicate-email flows are less graceful. |
| `RESEND_API_KEY` | Optional | For `/api/send` and/or custom Auth SMTP. |
| `FLICKR_API_KEY` | Optional | Reference photos on film pages. |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Optional | Shown in Terms, Privacy, and Settings. |

Then deploy. Auth, profile, reviews, and user uploads use your Supabase project.

### Production checklist

1. All migrations applied (Track A then Track B, §3).
2. **Auth → URL configuration:** Site URL and redirect URLs include your production domain.
3. **Custom SMTP** (recommended) so sign-up/password reset are not rate-limited on the Supabase default mailer.
4. Storage buckets **public** where the app expects public URLs for community images (see bucket migrations).
5. Run `npm run build` locally with production-like env to catch missing variables.

### Community content & RLS (trust)

After migrations:

- **`reviews`:** Policies allow **authenticated insert** for own rows and **public `SELECT`** (see `004_reviews_columns_and_policies.sql`) so film pages can show community reviews.
- **`user_uploads`:** **Public read** on rows (see `005_user_uploads_public_read.sql`) so discovery and film galleries work; inserts remain scoped to the owning user.
- **Moderation:** Removing abusive content is done via Supabase (Table Editor / SQL), future admin tools, or support per your in-app **Terms of use** and **Privacy Policy** pages. There is no automated moderation pipeline in the app repo.

---

## Summary of what’s implemented

| Feature | Where it lives |
|--------|-----------------|
| **Auth** | Supabase Auth (email log-in/sign-up). Session in cookies via `@supabase/ssr`. |
| **Profiles** | `profiles` table + `user_shot`, `user_favourites`, `user_tracked`, `user_ratings`. |
| **Reviews** | `reviews` table. Submitted from the “Add review & photos” modal when logged in. |
| **User uploads** | `user_uploads` table + **user-uploads** storage bucket. Images uploaded from the same modal. |
| **Catalog** | Optional: `brands`, `film_stocks`, `film_stock_purchase_links`. Images in **film-stocks** bucket. If empty, app uses local/seed data. |

If something doesn’t work, check the browser console and Supabase Dashboard (Auth, Table Editor, Storage, Logs).
