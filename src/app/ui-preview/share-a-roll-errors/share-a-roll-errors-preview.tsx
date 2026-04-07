"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { ScanReviewThumb } from "@/components/scan-review-thumb";
import {
  SCAN_TILE_MSG_SIGN_IN,
  SCAN_TILE_MSG_TOO_LARGE,
  SCAN_TILE_MSG_TRY_AGAIN,
  SCAN_TILE_MSG_WRONG_TYPE,
} from "@/lib/share-roll-image-errors";
import {
  REVIEW_POST_ERROR_TOAST,
  ROLL_UPDATE_ERROR_TOAST,
  SHARE_ROLL_SUBMIT_ERROR_TOAST,
  apiErrorMessageForToast,
} from "@/lib/review-submit-feedback";

function noop() {}

function InlineError({ children }: { children: ReactNode }) {
  return (
    <p className="whitespace-pre-line rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-xs text-destructive">
      {children}
    </p>
  );
}

function ToastMock({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Toast
      </span>
      <p className="text-sm leading-snug">{children}</p>
    </div>
  );
}

function SuccessToastMock({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/[0.07] px-3 py-2 text-sm text-foreground shadow-md dark:bg-emerald-500/10">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300/90">
        Success toast
      </span>
      <p className="text-sm leading-snug">{children}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-sm font-semibold text-foreground">{children}</h2>;
}

function When({ children }: { children: ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}

/** Step 3 compact cell (non-interactive), for edit-roll / edge cases. */
function Step3CellPreview({
  variant,
  fileName,
  errorMessage,
}: {
  variant: "loading" | "error" | "ready";
  fileName?: string;
  errorMessage?: string;
}) {
  return (
    <div
      className="relative aspect-square w-full max-w-[120px] overflow-hidden rounded-[7px] border border-border/50 bg-muted/10"
      aria-hidden
    >
      {variant === "error" ? (
        <div className="flex h-full flex-col items-center justify-center gap-0.5 bg-destructive/5 p-1 text-center">
          <span className="text-[9px] font-semibold leading-tight text-destructive">Error</span>
          {fileName ? (
            <span className="line-clamp-1 w-full text-[8px] text-muted-foreground">{fileName}</span>
          ) : null}
          {errorMessage ? (
            <span className="line-clamp-3 w-full text-[7px] leading-snug text-muted-foreground" title={errorMessage}>
              {errorMessage}
            </span>
          ) : null}
        </div>
      ) : variant === "loading" ? (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={DEMO_IMAGE} alt="" className="h-full w-full object-cover" draggable={false} />
      )}
    </div>
  );
}

const DEMO_IMAGE =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="#e4e4e7" width="400" height="300"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#71717a" font-family="system-ui" font-size="14">Demo scan</text></svg>`
  );

/** Shown after a successful POST from `AddReviewModal` (`plus-action-sheet`, `hero-mockups`). */
const TOAST_ROLL_PUBLISHED = "Roll shared!";
const TOAST_REVIEW_SUBMITTED = "Review posted!";

/** After successful PATCH (`reviews-tab-content`). */
const TOAST_REVIEW_UPDATED = "Review updated.";

/** After successful PATCH for edit roll (`image-lightbox`). */
const TOAST_ROLL_UPDATED = "Roll updated.";

/** After successful DELETE on the same surfaces. */
const TOAST_REVIEW_DELETED = "Review deleted.";
const TOAST_ROLL_DELETED = "Roll deleted.";

/** Mixed outcome after POST when some gallery rows fail (`interpretReviewsPostResult`). */
const TOAST_PARTIAL_GALLERY_EXAMPLE =
  "2 image(s) saved; 1 could not be saved to your gallery. Try again from your profile if needed.";

export function ShareARollUxMessagesPreview() {
  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-14">
        <header className="space-y-3">
          <h1 className="font-heading text-2xl font-semibold text-foreground">share-a-roll - UX messages</h1>
          <p className="text-sm text-muted-foreground">
            Reference for user-facing copy aligned with production: section 6 is success toasts from{" "}
            <code className="rounded bg-muted px-1">showToastViaEvent</code> after submit; sections 1–5 are in-modal
            states and progress; section 7 is errors after Share and API edge cases. Text reviews no longer attach images
            in reviews — rolls are the only image path for new uploads.
          </p>
          <div className="rounded-lg border border-border/70 bg-muted/30 px-4 py-3 text-sm text-foreground">
            <p className="font-medium text-foreground">What changed for share-a-roll (so many older errors never show)</p>
            <ul className="mt-2 list-inside list-disc space-y-1.5 text-muted-foreground">
              <li>
                <span className="text-foreground">Sign-in</span> happens before the upload modal (redirect), not as
                “log in to save your roll” toasts on submit.
              </li>
              <li>
                <span className="text-foreground">Supabase storage</span> runs on step 2 after each prepare — not again on
                Share. You won’t get a second batch of storage failures or “uploading image N of M…” only at submit for
                those scans.
              </li>
              <li>
                <span className="text-foreground">Next</span> is blocked until every slot is uploaded (or removed), so step
                3 normally has no failed-scan tiles. There is no separate “review + images at submit” path anymore.
              </li>
              <li>
                <span className="text-foreground">413 / huge multipart</span> is much less likely for a new roll (body is
                mostly JSON + fields), but network, abort, and API errors after Share still apply.
              </li>
            </ul>
          </div>
        </header>

        {/* 1 — Blocked before modal */}
        <section className="space-y-4 rounded-xl border border-border/60 bg-white p-4 shadow-sm dark:bg-card">
          <SectionTitle>1 — Before the modal</SectionTitle>
          <When>
            Signed-out users are redirected to sign-in from entry points (plus sheet, film actions,{" "}
            <code className="rounded bg-muted px-1">?action=upload</code>). This is navigation, not an in-flow error
            toast.
          </When>
          <p className="text-sm text-foreground">
            You are sent to <code className="rounded bg-muted px-1">/auth/sign-in?next=…</code> so you can return and
            continue.
          </p>
        </section>

        {/* 2 — Step 2 batch */}
        <section className="space-y-4 rounded-xl border border-border/60 bg-white p-4 shadow-sm dark:bg-card">
          <SectionTitle>2 — Step 2 — batch (red text under the grid)</SectionTitle>
          <When>Shown when no file slots were created, or when some picks were skipped before processing.</When>
          <div className="space-y-3">
            <div>
              <p className="mb-1 text-xs font-medium text-foreground">Nothing valid to add</p>
              <InlineError>
                No images were added — please use JPG, PNG or WebP files under 50MB.
              </InlineError>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-foreground">Wrong type or file over 50MB (batch)</p>
              <InlineError>
                2 images couldn&apos;t be added — please use JPG, PNG or WebP files under 50MB.
              </InlineError>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-foreground">10 scans limit</p>
              <InlineError>
                3 images were skipped — you&apos;ve reached the 10 scan limit for this roll.
              </InlineError>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-foreground">Combined batch message</p>
              <InlineError>
                {`1 image couldn't be added — please use JPG, PNG or WebP files under 50MB. 2 images were skipped — you've reached the 10 scan limit for this roll.`}
              </InlineError>
            </div>
          </div>
        </section>

        {/* 3 — Step 2 per thumb */}
        <section className="space-y-4 rounded-xl border border-border/60 bg-white p-4 shadow-sm dark:bg-card">
          <SectionTitle>3 — Step 2 — per thumbnail</SectionTitle>
          <When>
            Spinner while decoding, preparing, or uploading to Storage. Failures stay on this step;{" "}
            <strong className="font-medium text-foreground">Next</strong> stays off until every slot succeeds or is
            removed. Each failed slot keeps the title <strong className="font-medium text-foreground">Couldn&apos;t add
            this scan</strong> and the file name; the line below is a short hint from{" "}
            <code className="rounded bg-muted px-1">share-roll-image-errors</code> (most paths say “Please try again.”).
          </When>
          <ul className="space-y-8">
            <li>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Loading</p>
              <div className="max-w-[200px]">
                <ScanReviewThumb url={null} fileName="IMG_0001.jpg" onRemove={noop} onOpenPreview={noop} />
              </div>
            </li>
            <li>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Decode, prepare, or storage — typical failure (corrupt file, encode failure, size limit on bucket, etc.)
              </p>
              <div className="max-w-[200px]">
                <ScanReviewThumb
                  url={null}
                  fileName="corrupted-vacation.jpg"
                  errorMessage={SCAN_TILE_MSG_TRY_AGAIN}
                  onRemove={noop}
                  onOpenPreview={noop}
                />
              </div>
            </li>
            <li>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Decode — image too large (pixels per side)</p>
              <div className="max-w-[200px]">
                <ScanReviewThumb
                  url={null}
                  fileName="huge-scan.tif"
                  errorMessage={SCAN_TILE_MSG_TOO_LARGE}
                  onRemove={noop}
                  onOpenPreview={noop}
                />
              </div>
            </li>
            <li>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Storage — wrong file type for the bucket</p>
              <div className="max-w-[200px]">
                <ScanReviewThumb
                  url={null}
                  fileName="wrong-type.bin"
                  errorMessage={SCAN_TILE_MSG_WRONG_TYPE}
                  onRemove={noop}
                  onOpenPreview={noop}
                />
              </div>
            </li>
            <li>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Storage / session — RLS or expired session during step-2 upload
              </p>
              <div className="max-w-[200px]">
                <ScanReviewThumb
                  url={null}
                  fileName="policy.jpg"
                  errorMessage={SCAN_TILE_MSG_SIGN_IN}
                  onRemove={noop}
                  onOpenPreview={noop}
                />
              </div>
            </li>
            <li>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Ready — preview load failure copy</p>
              <div className="max-w-[200px]">
                <ScanReviewThumb url={DEMO_IMAGE} onRemove={noop} onOpenPreview={noop} />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                If the preview image fails to load, the tile shows: “Couldn&apos;t show preview — file is still queued
                for upload…”
              </p>
            </li>
          </ul>
        </section>

        {/* 4 — Step 3 */}
        <section className="space-y-4 rounded-xl border border-border/60 bg-white p-4 shadow-sm dark:bg-card">
          <SectionTitle>4 — Step 3 — compact reorder grid</SectionTitle>
          <When>
            For a <strong className="font-medium text-foreground">new</strong> roll you only reach this step after every
            scan has a stored URL, so the grid is reorderable previews. Edit roll can still show sparse or error tiles
            from existing data.
          </When>
          <div className="space-y-3">
            <p className="text-[10px] font-medium text-muted-foreground">New roll (typical)</p>
            <div className="grid max-w-md grid-cols-5 gap-2">
              <Step3CellPreview variant="ready" />
              <Step3CellPreview variant="ready" />
              <Step3CellPreview variant="ready" />
            </div>
            <p className="text-[10px] font-medium text-muted-foreground">Edit roll / edge</p>
            <div className="flex flex-wrap gap-4">
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground">Error + message</p>
                <Step3CellPreview variant="error" fileName="bad-scan.jpg" errorMessage={SCAN_TILE_MSG_TRY_AGAIN} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground">Loading</p>
                <Step3CellPreview variant="loading" />
              </div>
            </div>
          </div>
        </section>

        {/* 5 — Progress hints */}
        <section className="space-y-4 rounded-xl border border-border/60 bg-white p-4 shadow-sm dark:bg-card">
          <SectionTitle>5 — Progress hints (footer / upload zone)</SectionTitle>
          <When>
            Short status text while working — not errors. There is no footer copy like “Compressing image 2 of 5…” or
            “Uploading image 2 of 5…”; those were removed. Per-slot decode / prepare / Storage runs only show as
            spinners on each thumbnail (and errors on failed slots). The batch uses a single umbrella label.
          </When>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div>
              <p className="mb-2 text-xs font-medium text-foreground">
                Step 2 — pick scans (<code className="rounded bg-muted px-1">AddReviewModal</code>)
              </p>
              <ul className="list-inside list-disc space-y-2">
                <li>
                  <span className="text-foreground">Adding scans…</span> — on the large dashed upload button when the
                  grid is empty, and on the sticky primary button that normally says{" "}
                  <strong className="font-medium text-foreground">Next</strong>, whenever{" "}
                  <code className="rounded bg-muted px-1">isUploading</code> is true after a file pick (all slots finish
                  decode → prepare → Storage before <strong className="font-medium text-foreground">Next</strong>{" "}
                  enables). Add-more tiles show a spinner only.
                </li>
                <li>
                  <span className="text-foreground">Saving...</span> — same sticky row if{" "}
                  <code className="rounded bg-muted px-1">submitting</code> wins over{" "}
                  <code className="rounded bg-muted px-1">isUploading</code> (ASCII dots in source).
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-foreground">Step 3 — Share roll / Save roll</p>
              <ul className="list-inside list-disc space-y-2">
                <li>
                  Default labels on the primary button: <span className="text-foreground">Share roll</span> /{" "}
                  <span className="text-foreground">Save roll</span>. While <code className="rounded bg-muted px-1">
                    submitting
                  </code>
                  , the modal shows <code className="rounded bg-muted px-1">shareRollSubmitHint</code> when the parent
                  sets it — otherwise <span className="text-foreground">Sharing…</span> (new) or{" "}
                  <span className="text-foreground">Saving…</span> (edit). In production,{" "}
                  <code className="rounded bg-muted px-1">plus-action-sheet</code> (and similar) pass{" "}
                  <code className="rounded bg-muted px-1">onProgress</code> from{" "}
                  <code className="rounded bg-muted px-1">postReviewModalSubmission</code> /{" "}
                  <code className="rounded bg-muted px-1">patchReviewModalSubmission</code>;{" "}
                  <code className="rounded bg-muted px-1">user-reviews-client-submit</code> calls{" "}
                  <code className="rounded bg-muted px-1">onProgress(&quot;Saving…&quot;)</code> immediately before{" "}
                  <code className="rounded bg-muted px-1">fetch</code>, so the button usually reads{" "}
                  <span className="text-foreground">Saving…</span> for both new and edit during the request.
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-foreground">Text-only review (same modal, different step)</p>
              <ul className="list-inside list-disc space-y-2">
                <li>
                  <span className="text-foreground">Saving...</span> — submit row while{" "}
                  <code className="rounded bg-muted px-1">submitting</code> (vs. Submit review / Save changes).
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 6 — Success toasts */}
        <section className="space-y-6 rounded-xl border border-border/60 bg-white p-4 shadow-sm dark:bg-card">
          <SectionTitle>6 — Success toasts (after submit)</SectionTitle>
          <When>
            All of these are fired via <code className="rounded bg-muted px-1">showToastViaEvent</code> in production.
            New roll / plus sheet: <code className="rounded bg-muted px-1">plus-action-sheet.tsx</code> and film hero:{" "}
            <code className="rounded bg-muted px-1">hero-mockups.tsx</code> (same branching after{" "}
            <code className="rounded bg-muted px-1">postReviewModalSubmission</code> +{" "}
            <code className="rounded bg-muted px-1">interpretReviewsPostResult</code>). Edit flows use PATCH handlers
            below.
          </When>

          <div className="space-y-4">
            <p className="text-xs font-medium text-foreground">
              <code className="rounded bg-muted px-1">POST /api/user/reviews</code> — happy path
            </p>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                <code className="rounded bg-muted px-1">mode === &quot;upload&quot;</code> — new roll shared (
                <code className="rounded bg-muted px-1">plus-action-sheet</code>,{" "}
                <code className="rounded bg-muted px-1">hero-mockups</code>)
              </p>
              <SuccessToastMock>{TOAST_ROLL_PUBLISHED}</SuccessToastMock>
              <p className="mt-2 text-[11px] text-muted-foreground">
                The modal never enables <strong className="font-medium text-foreground">Share roll</strong> without at
                least one stored scan (<code className="rounded bg-muted px-1">canPostShareRollScans</code> /{" "}
                <code className="rounded bg-muted px-1">hasAtLeastOneReadyScan</code> in{" "}
                <code className="rounded bg-muted px-1">add-review-modal.tsx</code>), so a successful POST from those
                entry points always includes <code className="rounded bg-muted px-1">clientStoredScanImages</code>. An
                older <code className="rounded bg-muted px-1">Done.</code> branch for empty scans was removed from the
                submit handlers. Editing an existing roll still goes through PATCH in{" "}
                <code className="rounded bg-muted px-1">image-lightbox.tsx</code> →{" "}
                <strong className="font-medium text-foreground">Roll updated.</strong>
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                <code className="rounded bg-muted px-1">mode === &quot;review&quot;</code> only — text review submitted
                (not share-a-roll; upload mode uses <strong className="font-medium text-foreground">Roll shared!</strong>)
              </p>
              <SuccessToastMock>{TOAST_REVIEW_SUBMITTED}</SuccessToastMock>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Partial gallery attach (HTTP OK but some uploads did not persist) — still a toast, not a pure success
              </p>
              <ToastMock>{TOAST_PARTIAL_GALLERY_EXAMPLE}</ToastMock>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-medium text-foreground">
              <code className="rounded bg-muted px-1">PATCH /api/user/reviews/:id</code> — happy path
            </p>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Edit text review — <code className="rounded bg-muted px-1">reviews-tab-content.tsx</code>
              </p>
              <SuccessToastMock>{TOAST_REVIEW_UPDATED}</SuccessToastMock>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Edit roll metadata / scans sheet — <code className="rounded bg-muted px-1">image-lightbox.tsx</code> (
                <code className="rounded bg-muted px-1">mode: &quot;upload&quot;</code>,{" "}
                <code className="rounded bg-muted px-1">shareRollMetadataOnly</code> or full edit payload)
              </p>
              <SuccessToastMock>{TOAST_ROLL_UPDATED}</SuccessToastMock>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-medium text-foreground">Delete — happy path</p>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Delete text review — <code className="rounded bg-muted px-1">reviews-tab-content.tsx</code>
              </p>
              <SuccessToastMock>{TOAST_REVIEW_DELETED}</SuccessToastMock>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Delete roll — <code className="rounded bg-muted px-1">image-lightbox.tsx</code>
              </p>
              <SuccessToastMock>{TOAST_ROLL_DELETED}</SuccessToastMock>
            </div>
          </div>
        </section>

        {/* 7 — After Share */}
        <section className="space-y-6 rounded-xl border border-border/60 bg-white p-4 shadow-sm dark:bg-card">
          <SectionTitle>7 — After Share — network, API, and other flows</SectionTitle>
          <When>
            For <span className="text-foreground">share-a-roll</span>, blobs are already in Storage;{" "}
            <strong className="font-medium text-foreground">Share</strong> posts form fields +{" "}
            <code className="rounded bg-muted px-1">client_stored_images</code> JSON. There is no client-side batch upload at
            submit anymore (no “N of M images reached storage” toast from the app).
          </When>

          <div className="space-y-4">
            <p className="text-xs font-medium text-foreground">HTTP / transport / thrown errors</p>
            <When>
              Any failed <code className="rounded bg-muted px-1">postReviewModalSubmission</code> (always{" "}
              <code className="rounded bg-muted px-1">POST</code>) or{" "}
              <code className="rounded bg-muted px-1">patchReviewModalSubmission</code> (
              <code className="rounded bg-muted px-1">PATCH</code>) maps to{" "}
              <code className="rounded bg-muted px-1">reviewsModalSubmitErrorToast(mode, method)</code> — including 413,
              5xx, non-JSON bodies, network failure, abort, or thrown errors while building the request.
            </When>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                <code className="rounded bg-muted px-1">POST</code> +{" "}
                <code className="rounded bg-muted px-1">mode === &quot;upload&quot;</code> — share a new roll
              </p>
              <ToastMock>{SHARE_ROLL_SUBMIT_ERROR_TOAST}</ToastMock>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                <code className="rounded bg-muted px-1">PATCH</code> +{" "}
                <code className="rounded bg-muted px-1">mode === &quot;upload&quot;</code> — edit roll (
                <code className="rounded bg-muted px-1">image-lightbox.tsx</code>)
              </p>
              <ToastMock>{ROLL_UPDATE_ERROR_TOAST}</ToastMock>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                <code className="rounded bg-muted px-1">mode === &quot;review&quot;</code> — text review POST or PATCH (
                <code className="rounded bg-muted px-1">reviews-tab-content.tsx</code>)
              </p>
              <ToastMock>{REVIEW_POST_ERROR_TOAST}</ToastMock>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-medium text-foreground">Response interpretation (gallery / uploads)</p>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                HTTP 200 but <code className="rounded bg-muted px-1">uploaded === 0</code> while scans were expected —{" "}
                <code className="rounded bg-muted px-1">interpretReviewsPostResult</code> (same line as share-a-roll HTTP
                errors)
              </p>
              <ToastMock>{SHARE_ROLL_SUBMIT_ERROR_TOAST}</ToastMock>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Partial gallery save — same string as in section 6; server returned success with some gallery rows
              missing.
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-medium text-foreground">
              <code className="rounded bg-muted px-1">POST /api/user/reviews</code> — typical JSON errors
            </p>
            <When>
              The modal does not surface raw API <code className="rounded bg-muted px-1">error</code> strings for
              submit failures — users only see the mode-specific lines above. Below are example JSON bodies the server
              may still return (for debugging / logs).
            </When>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Example: 401 — user sees one of three lines by <code className="rounded bg-muted px-1">mode</code> +{" "}
                <code className="rounded bg-muted px-1">POST</code>/<code className="rounded bg-muted px-1">PATCH</code>
              </p>
              <ToastMock>{SHARE_ROLL_SUBMIT_ERROR_TOAST}</ToastMock>
              <p className="mt-2 text-[11px] text-muted-foreground">
                <code className="rounded bg-muted px-1">PATCH</code> + upload →{" "}
                <span className="text-foreground">{ROLL_UPDATE_ERROR_TOAST}</span>
                <br />
                <code className="rounded bg-muted px-1">review</code> mode →{" "}
                <span className="text-foreground">{REVIEW_POST_ERROR_TOAST}</span>
              </p>
            </div>
            <div className="space-y-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
              <InlineError>{`400 — { "error": "Upload too large. Try fewer or smaller images." }`}</InlineError>
              <InlineError>{`400 — { "error": "Invalid form data" }`}</InlineError>
              <InlineError>{`400 — { "error": "film_stock_slug required" }`}</InlineError>
              <InlineError>{`400 — { "error": "Invalid client_stored_images JSON." }`}</InlineError>
              <InlineError>{`400 — { "error": "No stored images provided." }`}</InlineError>
              <InlineError>{`400 — { "error": "Too many images (max 10)." }`}</InlineError>
              <InlineError>{`400 — { "error": "Server misconfiguration (Supabase URL)." }`}</InlineError>
              <InlineError>{`400 — { "error": "Invalid Supabase URL." }`}</InlineError>
              <InlineError>{`400 — { "error": "Invalid stored image entry." }`}</InlineError>
              <InlineError>{`400 — { "error": "Invalid image URL." }`}</InlineError>
              <InlineError>{`400 — { "error": "Image URL does not match this app." }`}</InlineError>
              <InlineError>{`400 — { "error": "Image path is not allowed for this roll." }`}</InlineError>
              <InlineError>{`400 — { "error": "Duplicate image URL." }`}</InlineError>
              <InlineError>{`401 — { "error": "Unauthorized" }`}</InlineError>
              <InlineError>{`500 — { "error": "Image upload failed.", "detail": "…" }`}</InlineError>
              <InlineError>{`500 — { "error": "Could not save your review.", "detail": "…" }`}</InlineError>
              <InlineError>
                {`500 — { "error": "Images uploaded, but they could not be saved to your gallery.", "detail": "…" }`}
              </InlineError>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                <code className="rounded bg-muted px-1">apiErrorMessageForToast</code> (used outside this modal path)
              </p>
              <ToastMock>{apiErrorMessageForToast({})}</ToastMock>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Empty body → “Something went wrong…” — not used for add-review modal submit.
              </p>
            </div>
          </div>

          <div className="rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
            “Please sign in and try again.” can still surface from{" "}
            <code className="rounded bg-muted px-1">uploadPreparedShareRollScanToStorage</code> if the session expires
            between opening the modal and finishing a step-2 upload — not when a signed-out user hits an entry point
            (they are redirected to sign-in first).
          </div>
        </section>
      </div>
    </div>
  );
}
