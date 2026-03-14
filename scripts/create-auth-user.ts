/**
 * One-time script to create an auth user in Supabase (bypasses sign-up flow).
 * The user can then log in at /auth/sign-in with the same email and password.
 *
 * Usage:
 *   npx tsx scripts/create-auth-user.ts "YourChosenPassword"
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL=
 *   SUPABASE_SERVICE_ROLE_KEY=   (from Supabase Dashboard → Settings → API → service_role)
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const EMAIL = "callumkilbs@gmail.com";
const DISPLAY_NAME = "filumbycallum";

async function main() {
  const password = process.argv[2];
  if (!password || password.length < 6) {
    console.error("Usage: npx tsx scripts/create-auth-user.ts \"YourPassword\"");
    console.error("Password must be at least 6 characters.");
    process.exit(1);
  }

  if (!url || !serviceRoleKey) {
    console.error("Missing env. In .env.local set:");
    console.error("  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co");
    console.error("  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key");
    console.error("Get the service role key from Supabase Dashboard → Settings → API → service_role (never expose in client).");
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data: user, error } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password,
    email_confirm: true,
    user_metadata: { full_name: DISPLAY_NAME },
  });

  if (error) {
    if (error.message.includes("already been registered") || error.message.includes("already exists")) {
      console.log("User with this email already exists. Updating password and metadata.");
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list?.users?.find((u) => u.email === EMAIL);
      if (existing) {
        const { error: updateErr } = await supabase.auth.admin.updateUserById(existing.id, {
          password,
          user_metadata: { full_name: DISPLAY_NAME },
        });
        if (updateErr) {
          console.error("Update failed:", updateErr.message);
          process.exit(1);
        }
        console.log("Password and display name updated. You can log in at /auth/sign-in");
        return;
      }
    }
    console.error("Error creating user:", error.message);
    process.exit(1);
  }

  console.log("\nUser created in Supabase:");
  console.log("  User ID:", user.user?.id);
  console.log("  Email:  ", EMAIL);
  console.log("  Name:   ", DISPLAY_NAME);
  console.log("\nLog in at: /auth/sign-in");
  console.log("  Email:    ", EMAIL);
  console.log("  Password: (the one you passed to this script)");
  console.log("");
}

main();
