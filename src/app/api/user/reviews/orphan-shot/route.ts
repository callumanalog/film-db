import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "user-uploads";

/**
 * Delete an orphaned shot from storage (user closed sheet without posting).
 * Only allows deleting objects under the current user's folder.
 */
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { storage_path?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const storagePath = body.storage_path;
  if (typeof storagePath !== "string" || !storagePath.trim()) {
    return NextResponse.json({ error: "storage_path required" }, { status: 400 });
  }

  // Path must be {user_id}/... so user can only delete their own orphans
  const prefix = `${user.id}/`;
  if (!storagePath.startsWith(prefix)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error: deleteError } = await supabase.storage.from(BUCKET).remove([storagePath]);
  if (deleteError) {
    console.error("[orphan-shot] delete error:", deleteError);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
