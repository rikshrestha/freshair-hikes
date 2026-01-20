# Sprint 1 Summary (FreshAir Hikes)

## Overview
- Implemented path-based navigation with offline safety and local persistence for hikes, trails, favorites, and reflections.
- Integrated OSM trail geometry as primary guidance; Mapbox Directions kept as fallback/reroute.
- Polished UI shells (tabs, drawer, trail cards, history, profiles) and built a context structure for future sprints.

## Tech Stack & Key Libraries
- Framework: Expo (React Native) with Expo Router.
- Mapping: react-native-maps (Apple tiles in preview), Mapbox Directions API (public token).
- Location: expo-location (foreground + optional background permissions).
- Storage: @react-native-async-storage/async-storage (hikes, favorites, conditions, profiles).
- Tooling: TypeScript, tsconfig/react-native defaults; no server components in Sprint 1.

## Features Delivered
- Trails: OSM-ingested trail list with search, favorites, distance sorting, and shared TrailCard across Today Plan and Trails screens.
- Navigation: Trail path guidance (start/end markers, polyline), off-route detection, reroute via Mapbox when using directions mode, offline banner, background toggle, map controls (zoom, recenter, lock-to-user), and Start Over reset.
- History & Reflections: Hike sessions logged to history with actual distance/time; reflection editing; conditions/notes per trail.
- UI/UX: Side drawer with tabs (Home/Guide/History/Profile/Navigate), consistent styling, safe external navigation linking.
- Data handling: OSM path matching by name/nearest centroid, duplicate trail logging, trail conditions and favorites persistence.
- Context hygiene: Introduced /docs with sprint status, architecture, agents, ADR template, and root CONTEXT_INDEX.md; archived Sprint 1.

## Problems Encountered & Solutions
- **OSM path mismatch / missing geometry:** Fixed by matching paths by name first, then nearest centroid within a radius; added path guardrails in navigation.
- **Instant “arrived” at trailhead:** Switched to path-based navigation when geometry exists and avoided directions-only flows when starting at the trailhead.
- **External navigate crashes:** Wrapped Linking with canOpenURL and error handling.
- **Offline routing failures (Mapbox 422):** Added offline banner, cached path usage, and reroute throttling; provided external navigate fallback.
- **Duplicate trail IDs:** Deduped during load and logged duplicates.
- **UI tight spacing / overlap:** Refined drawer/menu padding and navigation control styling.
- **Session persistence:** Added active hike tracking; end navigation logs sessions to history with actual distance/time.

## Architecture Snapshot (Sprint 1 end)
- Navigation: Path-first (OSM) → Mapbox Directions for reroute; off-route detection by nearest polyline point.
- Data: Trails (with optional path), favorites, conditions, hikes, profiles stored in AsyncStorage.
- UI shells: Expo Router tabs + custom side drawer; shared TrailCard; Trail detail + Navigation screens; History/Reflection flows.

## Handoff / Next Steps (for Sprint 2)
- Define Sprint 2 scope and success criteria.
- Use `CONTEXT_INDEX.md` to load only relevant docs; baseline is path-based navigation and logging.
- Add ADRs per new decisions in `/docs/decisions/`.
