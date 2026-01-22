# FreshAir Hikes — Knowledge Transfer

_Sprint 1 KT — 2025-02-06_

This guide is a beginner-friendly handoff for working on FreshAir Hikes, including how to use a coding assistant (Cline + Mistral), key repo context, and common workflows.

## Sprint 1 Snapshot (tag: Sprint 1)
- Milestones: path-based navigation (OSM geometry with Mapbox fallback), off-route detection/reroute, history logging with reflections, shared TrailCard and drawer/tabs, local storage for trails/favorites/conditions/hikes, architecture/docs bootstrapped.
- Obstacles & solutions:
  - OSM path mismatches/missing geometry → name/centroid matching, path guardrails, fallback to Mapbox directions.
  - Instant “arrived” at trailhead → switched to path-first navigation; avoided directions-only at start.
  - External navigate crashes → wrapped Linking with canOpenURL + error handling.
  - Offline routing failures (Mapbox 422) → offline banner, cached path usage, reroute throttling, external navigate fallback.
  - Duplicate trail IDs → deduping in trail ingestion.
- Assumptions: local-first storage (AsyncStorage); no auth or backend; Mapbox token available; RN/Expo environment (iOS/Android) primary; web is non-primary.

## Project Overview
- Mobile-first hiking companion built with Expo + React Native + TypeScript.
- Map-first Explore tab with collapsible trail list, search/filters, marker↔list sync, and GPS recenter.
- Navigation uses path-based trails (OSM geometry) with Mapbox fallback; history/reflections stored locally (AsyncStorage).
- Region scaffolding exists (DFW live, Kathmandu placeholder); region selection is persisted.
- Web is non-primary and uses fallback screens to avoid native map imports.

## Quick Start
```bash
npm install
npx expo start
```
- Run on iOS/Android simulators or device via Expo Go/dev build.
- Commands: `npm run lint` for linting. (Tests/CI not yet added.)

## Repo Map
- App routes: `app/(tabs)/explore.native.tsx`, `app/(tabs)/navigation.native.tsx`, `app/(tabs)/history.tsx`, `app/(tabs)/profile.tsx`, `app/saved.tsx`, `app/trail/[id].tsx`.
- Web fallbacks: `app/(tabs)/explore.web.tsx`, `app/navigation.web.tsx`, `app/(tabs)/history.web.tsx`.
- Data: `src/data/regions.ts`, `src/data/trailStore.ts`, `src/data/osmPaths.ts`, `src/data/trails.dfw.ts`, `src/data/trails.kathmandu.ts` (placeholder).
- State/logic: `src/state/navigationSession.ts`, `src/utils/geo.ts`, `src/storage/*`.
- UI tokens/components: `constants/theme.ts`, `hooks/use-app-theme.ts`, `components/ui/*`.
- Docs: `docs/AGENTS.md`, `docs/sprint_status.md`, `docs/architecture.md`, `docs/sprint_archive/*`.

## Current UI/UX Highlights
- Explore: map with markers for visible trails, collapsed sheet (~19% height) showing header/search/filters; expand to list trails, “Details” and “Start” (path-based) buttons; GPS recenter dot (top-right).
- Navigation: GPS dot + lighter control cluster (zoom, route, lock, BG toggle); recenter/route controls safe-area aligned.
- Drawer: slim menu (Home, Saved, Profile, About, Contact); Explore/History accessed via tabs.
- Region selector chips in Explore; region persists locally.

## Web Behavior
- Web is fallback-only (list/message) to avoid react-native-maps import errors; native is primary. Do not rely on web for navigation or maps.

## Using Cline with Mistral (or other models)
1) Install Cline in VS Code (Extensions → “Cline”).
2) Pick a provider:
   - Local (no cost): install Ollama, pull a model (`ollama pull mistral:7b` or `codellama:7b`), set Cline provider to Ollama (`http://localhost:11434`).
   - Cloud: set provider to your API (e.g., Mistral/Anthropic/OpenAI) and add the API key.
3) Keep “ask before running commands” enabled. Review proposed plans and diffs before applying.
4) When asking Cline, be specific and point to files (e.g., “Update `app/(tabs)/explore.native.tsx` filters to add elevation chip”).
5) For RN/Expo tasks, prefer smaller, concrete steps; verify navigation/data flows on a device/simulator.

## Common Tasks
- Run lint: `npm run lint`.
- Start app: `npx expo start` (then choose iOS/Android).
- Adjust theme/tokens: `constants/theme.ts`, `hooks/use-app-theme.ts`.
- Add trails/regions: `src/data/regions.ts`, `src/data/trailStore.ts`, `src/data/trails.<region>.ts`, `assets/data/osm-<region>-trails.json`.
- Navigation logic: `app/(tabs)/navigation.native.tsx`, `src/state/navigationSession.ts`, `src/utils/geo.ts`.
- Explore UI: `app/(tabs)/explore.native.tsx`, `components/ui/*`.

## Open Items / Caveats
- Kathmandu dataset is placeholder; replace with real data before enabling.
- CI/tests/telemetry/analytics not yet implemented (see `docs/sprint_status.md`).
- Web is not a target platform; keep changes mobile-first.
- Auth not added yet (planned later).

## Tips for Beginners
- Read `docs/AGENTS.md` for style/testing guidance.
- Follow existing patterns (tokens, shared components, navigation state).
- Make small, reviewable changes; run lint before commits.
- For UI polish, reuse `components/ui/*` primitives and spacing from `constants/theme.ts`.

## Quick History (recent)
- Explore rebuilt as map-first with collapsible sheet, filters/search, GPS recenter.
- Navigation controls lightened; GPS dot added.
- Region scaffolding added; web fallbacks added to avoid map import errors.
