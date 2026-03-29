import DOMPurify from "dompurify";

const ALLOWED_TAGS = ["p", "strong", "em", "s", "blockquote", "a", "br"];
const ALLOWED_ATTR = ["href", "target", "rel", "class"];

/** Sanitize review/caption HTML (TipTap StarterKit subset). */
export function sanitizeReviewLikeHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR });
}

/** Strip tags for alt text / previews (caption may be TipTap HTML). */
export function plainTextFromPossibleHtml(html: string): string {
  const t = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return t.length > 200 ? `${t.slice(0, 200)}…` : t;
}
