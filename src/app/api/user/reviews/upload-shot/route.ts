import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "user-uploads";
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

/**
 * Pre-upload a single shot to storage. Called when user selects a file so the
 * final "Post to Gallery" only does a DB INSERT (metadata + this URL).
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const filmStockSlug = formData.get("film_stock_slug");
  if (typeof filmStockSlug !== "string" || !filmStockSlug.trim()) {
    return NextResponse.json({ error: "film_stock_slug required" }, { status: 400 });
  }
  const slug = filmStockSlug.trim();

  const file = formData.get("file") ?? formData.get("file_0");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Use PNG, JPG, or WebP." },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File too large. Max 50MB." },
      { status: 400 }
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["png", "jpeg", "jpg", "webp"].includes(ext) ? ext : "jpg";
  const path = `${user.id}/${slug}/${Date.now()}.${safeExt}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false });

  if (uploadError) {
    console.error("[upload-shot] storage error:", uploadError);
    return NextResponse.json(
      {
        error:
          uploadError.message === "The resource already exists"
            ? "File with this name already exists. Try again."
            : "Upload failed. Try again.",
      },
      { status: 500 }
    );
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(uploadData.path);
  return NextResponse.json({
    publicUrl: urlData.publicUrl,
    storagePath: uploadData.path,
  });
}
