import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const redirectTo = searchParams.get("redirect_to");
  const fallback = "/profile";
  let target = next ?? redirectTo ?? fallback;
  if (target.startsWith("/auth/") || target.startsWith("http")) target = fallback;

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      await supabase
        .from("profiles")
        .update({ email_verified_at: new Date().toISOString() })
        .eq("id", data.user.id);
      return NextResponse.redirect(`${origin}${target}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/auth/sign-in?error=auth_callback_error&next=${encodeURIComponent(target)}`
  );
}
