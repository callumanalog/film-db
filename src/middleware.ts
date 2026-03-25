import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Skip middleware for API routes so large multipart bodies (e.g. review + multiple images)
     * are not buffered/truncated by the middleware/proxy layer — truncated bodies make
     * request.formData() throw and surface as "Invalid form data".
     * Session cookies are still sent; route handlers use createClient() as usual.
     */
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
