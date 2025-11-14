## Quick context for AI coding agents

This repository is a React + TypeScript frontend (Vite) with Firebase as the backend and optional Cloud Functions in `functions/`. The UI is **mobile-first** and deployed as a **Progressive Web App (PWA)**.

- Frontend: `src/` — React + TypeScript + Vite. Entry: `src/main.tsx`, App in `src/App.tsx`.
- Firebase config: `src/config/firebase.ts` — uses env vars named VITE_FIREBASE_* and connects the Functions emulator at localhost:5001 in dev.
- Serverless functions: `functions/` — TypeScript Cloud Functions (Node 18). Build with `npm run build` from `functions/` or use `npm run serve` to start the emulator.
- Local generated API: `src/dataconnect-generated/` is a local package used via "file:" in `package.json`.
- PWA: Service worker registered in `src/main.tsx` via `src/utils/pwa.ts`; manifest at `public/manifest.json`.

## What to know before making changes

- Project scripts (root `package.json`):
  - `npm run dev` (starts Vite dev server)
  - `npm run build` (runs `tsc -b && vite build`)
  - `npm run preview` (vite preview)
  - `npm run init-test-data` (ts-node script under `src/scripts`)

- Functions scripts (`functions/package.json`): build with `npm run build`; run emulators with `npm run serve` (calls `firebase emulators:start --only functions`).

## Important patterns & conventions (use these, don't reinvent)

- **Mobile-first UI**: Design for mobile screens first. Use responsive breakpoints (Tailwind `sm:`, `md:`, `lg:`) to enhance for larger screens. Touch-friendly targets and spacing.
- Auth & roles: see `src/contexts/AuthContext.tsx`. The app stores the user's role in Firestore and also writes `userRole` to localStorage. Throwing `new Error` is the usual error path.
- Domain contexts: `RoomContext` centralizes Firestore access for rooms/reservations/check-in logic — prefer adding data-access logic there rather than scattering Firestore calls across UI components. See `src/contexts/RoomContext.tsx` for examples (fetchRooms, createReservation, checkInToRoom, etc.).
- Firestore collections used widely: `users`, `rooms`, `reservations`, `checkIns`, `roomSchedules`. Use existing shape conversions (timestamps -> Date) patterns used in `RoomContext`.
- QR / scanner flow: `src/pages/professor/ScannerPage.tsx` processes QR payloads starting with `room-<id>`; validation happens by `validateSchedule` against `roomSchedules`. Use that file for examples of business rules.
- Absolute imports: code uses `@/` alias (e.g., `@/config/firebase`). Respect `tsconfig` path mapping when adding imports.

## Quick examples to reference

- Env keys: see `src/config/firebase.ts` — use `import.meta.env.VITE_FIREBASE_API_KEY` etc.
- Functions region: functions client is created with `getFunctions(app, 'asia-southeast1')` — backend region matters when calling functions.
- PWA hooks: `src/main.tsx` calls `registerServiceWorker()` and `setupInstallPrompt()` from `src/utils/pwa.ts` — keep PWA registration in place when refactoring startup.

## How to run & debug locally

- Frontend: `npm run dev` (from repo root). Open Vite dev server and use browser devtools.
- Emulated functions: cd into `functions/` and use `npm run serve` to start the functions emulator. The frontend `src/config/firebase.ts` connects to localhost:5001 when `import.meta.env.DEV` is true.
- Seed/test data: `npm run init-test-data` runs `src/scripts/initTestData.ts` via `ts-node`.

## Safety & small-footprint edits

- When changing Firestore shapes, update the conversion logic in `RoomContext` (timestamp handling) and any components that read those fields.
- Add new Cloud Functions under `functions/src/` and export them from `functions/src/index.ts`. Follow the existing `tsc` build flow.

If anything here is unclear or you want more details (API shapes, emulator config, CI steps), tell me which area to expand and I will update this file.
