# FreshAir Hikes (Expo)

## Quick start
```bash
npm install
npx expo start
```
- Runs on iOS/Android simulators or device via Expo Go/development build.
- App uses Expo Router (file-based routes) under `app/`.

## Docs & Context
- Start at `CONTEXT_INDEX.md` (repo root) to know which docs to read.
- Key docs live in `/docs`: `sprint_status.md`, `architecture.md`, `AGENTS.md`, `decisions/`, `sprint_archive/`.
- For non-repo artifacts (SRS, requirements, sprint packs), see `../project-docs/` outside the repo.

## Stack
- Expo + React Native, TypeScript, React Native Maps, Expo Location, AsyncStorage, Mapbox Directions (public token).

## Scripts
- `npm run lint` (if configured), `npm run test` (if added); otherwise use `npx expo start` for dev.

## Contribution notes
- Keep files ASCII, avoid destructive git commands, and follow `/docs/AGENTS.md` for style/testing guidance.
