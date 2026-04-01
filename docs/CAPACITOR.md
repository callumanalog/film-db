# Exposure Club — Capacitor rollout

This repo keeps the **website as the source of truth** and wraps the hosted mobile web experience with Capacitor for Android and iOS shells.

## Readiness threshold

Start store-facing app work only when all of these are true:

- Mobile navigation and page structure are stable
- Sign-in, sign-up, password reset, and auth callback flows are stable
- Uploads and any camera/file-adjacent flows work reliably on mobile web
- Core pages look acceptable on desktop so the website remains launchable alongside the app
- A hosted staging deployment mirrors production closely enough for shell testing

If those are still moving targets, keep shipping web work first.

## Environment model

Use the same Next.js deployment model for both web and app:

- `web production` -> `https://exposureclub.com`
- `web staging` -> your staging domain or preview environment
- `app internal` -> points at web staging through `CAPACITOR_SERVER_URL`
- `app production` -> points at web production through `CAPACITOR_SERVER_URL`

Recommended local env values:

```env
NEXT_PUBLIC_APP_URL=https://staging.exposureclub.com
CAPACITOR_SERVER_URL=https://staging.exposureclub.com
CAPACITOR_APP_ID=club.exposure.app
CAPACITOR_APP_NAME=Exposure Club
```

For production app builds, swap both URLs to the production domain.

## Shared styling strategy

The app and website should share the same UI by default.

Use the Capacitor runtime layer only for:

- safe-area insets
- status-bar overlap
- keyboard-related spacing
- bottom-nav spacing
- platform-specific polish that should not affect desktop web

The runtime bridge adds these hooks to the document root:

- `data-app-shell="capacitor"` when running inside Capacitor
- `data-app-platform="ios"` or `data-app-platform="android"`
- CSS classes: `app-shell-capacitor`, `app-platform-ios`, `app-platform-android`

Prefer CSS based on those hooks over component forks.

## Initial native scope

Ship the first shell with only low-risk native work:

- app icons and splash screen
- status bar configuration
- safe-area handling
- Android internal builds
- iOS shell scaffolding for later TestFlight use

Do **not** block the first shell on push notifications, offline sync, or a native-auth rewrite.

## Native feature sequencing

Add features in this order unless product priorities change:

1. Deep links / universal links
2. External link handling and share flows
3. Camera/file picker improvements where mobile web is not enough
4. Push notifications
5. Offline storage / sync
6. Background tasks or in-app purchases

## Android-first workflow

1. Set `CAPACITOR_SERVER_URL` to staging.
2. Run `npm run cap:sync`.
3. Run `npm run cap:open:android`.
4. Build and install on your Android device.
5. Test:
   - auth persistence
   - auth callback redirects
   - uploads and file access
   - bottom-nav + sheet behavior with the software keyboard
   - external links

Use Android internal testing or local installs before touching store review.

## iOS follow-up

Keep the iOS shell in the repo early so the same config can be reused later.

When ready for Apple distribution:

1. Set production-appropriate app metadata and privacy details in Xcode.
2. Confirm associated domains / universal links if deep links are enabled.
3. Archive through Xcode and distribute via TestFlight.

## Commands

```bash
npm run cap:sync
npm run cap:open:android
npm run cap:open:ios
```

## Notes for this repo

- Auth is currently cookie/session based with Supabase, so verify webview session behavior on-device before adding native auth changes.
- Password reset and email verification rely on hosted auth callback URLs, so the staging/prod deployment URLs must be correct before app testing.
