# Setting up film-db on a new device

---

## Quick: Switching back to this device

When you’ve been working on another machine and come back to this one:

1. **Pull latest** (in project root):
   ```bash
   git pull
   ```

2. **Check `.env.local`**  
   It’s not in git, so it should still be here from last time. If you deleted it or the folder was replaced, recreate it with your Supabase URL and anon key (Step 1 below).

3. **Start the app**
   ```bash
   npm run dev
   ```
   Open the URL the terminal shows (e.g. `http://localhost:3000`). If you get a lock error, close any other terminal running `npm run dev` or run:
   ```bash
   rm -f .next/dev/lock
   ```
   then `npm run dev` again.

That’s it. No need to run “new device” setup again unless you cloned the repo fresh or removed `.env.local`.

---

## Full setup (new device or fresh clone)

When you move the project to a new machine (or clone it fresh), follow these steps so Supabase and the dev server work correctly.

---

## Step 1: Create `.env.local` (required)

The repo does **not** include `.env.local` (it’s in `.gitignore`), so you must add it on each device.

1. In the **project root** (same folder as `package.json`), create a file named `.env.local`.
2. Add these two lines, with **your** values from [Supabase Dashboard → Project Settings → API](https://supabase.com/dashboard):

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. Save the file. There should be **no spaces** around `=` and **no quotes** unless the value itself contains spaces.

---

## Step 2: Stop any running dev servers

On the new device you might have old terminals or multiple `next dev` processes. Clean them up:

1. Close every terminal tab/window where you ran `npm run dev` (or stop the process if you can).
2. In a **new** terminal, from the project root, run:

   ```bash
   pkill -9 -f "next dev" 2>/dev/null; pkill -9 -f "node.*next" 2>/dev/null; sleep 2
   rm -f .next/dev/lock
   ```

   (On Windows use Task Manager to end any “Node” processes that look like Next.js.)

---

## Step 3: Install dependencies and run dev

From the project root:

```bash
npm install
npm run dev
```

- The app uses **Webpack** for `npm run dev` so `NEXT_PUBLIC_*` env vars work in the browser (Turbopack has a known bug with them).
- Note the URL in the terminal (e.g. `http://localhost:3000` or `http://localhost:3001`).

---

## Step 4: Open the app

1. In your browser, go to the URL shown in the terminal (e.g. `http://localhost:3000`).
2. Do a **hard refresh**: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux).

If you still see “Supabase is not configured”, tell your assistant:

- The **exact** URL you’re opening (e.g. `http://localhost:3000`).
- That you’ve completed Steps 1–4 and that `.env.local` exists in the project root with both variables set.

---

## Optional: Clean rebuild

If the error persists after the steps above:

```bash
# Stop dev server first (Ctrl+C or kill the process), then:
rm -rf .next
npm run dev
```

Then open the URL from the terminal again and hard refresh.
