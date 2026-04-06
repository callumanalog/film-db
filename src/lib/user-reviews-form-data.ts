import type { AddReviewModalPayload } from "@/components/add-review-modal";

export function appendReviewsPayloadFields(
  formData: FormData,
  filmStockSlug: string,
  mode: "review" | "upload",
  payload: AddReviewModalPayload
): void {
  formData.set("film_stock_slug", filmStockSlug);
  formData.set("mode", mode);
  formData.set("rating", String(payload.rating));
  if (payload.reviewTitle) formData.set("review_title", payload.reviewTitle);
  if (payload.reviewText) formData.set("review_text", payload.reviewText);
  if (payload.camera) formData.set("camera", payload.camera);
  if (payload.lens) formData.set("lens", payload.lens);
  if (payload.developedAt) formData.set("developed_at", payload.developedAt);
  if (payload.caption) formData.set("caption", payload.caption);
  if (payload.shotIso) formData.set("shot_iso", payload.shotIso);
  if (payload.lab) formData.set("lab", payload.lab);
  if (payload.scanner) formData.set("scanner", payload.scanner);
  if (payload.format) formData.set("format", payload.format);
  if (payload.location) formData.set("location", payload.location);
  if (payload.shotDate) formData.set("shot_date", payload.shotDate);
  if (payload.tags) formData.set("tags", payload.tags);
  if (payload.iso) formData.set("iso", payload.iso);
  if (payload.bestFor?.length) formData.set("best_for", JSON.stringify(payload.bestFor));
}
