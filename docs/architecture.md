# Architecture (snapshot)
- Navigation: path-based (OSM-derived) routes with Mapbox fallback for directions; history logging persists to AsyncStorage. Explore and Navigate expose GPS recenter and map controls.
- Data: trails enriched from OSM geojson; favorites, conditions, hikes stored locally. Region scaffolding added (DFW + placeholder Kathmandu) with region persistence.
- UI shells: Expo Router tabs + side drawer; React Native Maps for previews/navigation on native; web uses list/fallback to avoid native map imports.

Update this section when schemas, APIs, or flow contracts change.
