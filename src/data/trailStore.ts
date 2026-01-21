import { getRegion } from "../storage/region";
import { getRegionConfig, loadRegionOsmPaths, RegionId } from "./regions";
import { Trail } from "../logic/recommend";
import { logEvent } from "../utils/logger";
import { haversineMiles } from "../utils/geo";

export async function getTrails(regionOverride?: RegionId): Promise<Trail[]> {
  const region = regionOverride ?? (await getRegion());
  const { trails } = getRegionConfig(region);
  const seen = new Set<string>();
  const deduped: Trail[] = [];
  const osmPaths = loadRegionOsmPaths(region);

  for (const t of trails) {
    if (seen.has(t.id)) {
      await logEvent(`Duplicate trail id skipped: ${t.id} (${t.name})`);
      continue;
    }
    seen.add(t.id);
    let path: { lat: number; lng: number }[] | undefined;
    // 1) try name match (case-insensitive)
    const nameMatch = osmPaths.find(
      (p) => p.name && p.name.toLowerCase() === t.name.toLowerCase()
    );
    if (nameMatch) {
      path = nameMatch.coords;
    } else if (t.lat !== undefined && t.lng !== undefined) {
      // 2) nearest centroid within 10 miles
      let best: { dist: number; coords: { lat: number; lng: number }[] } | null = null;
      for (const p of osmPaths) {
        const dist = haversineMiles({ lat: t.lat, lng: t.lng }, p.centroid);
        if (dist < 10 && (!best || dist < best.dist)) {
          best = { dist, coords: p.coords };
        }
      }
      if (best) path = best.coords;
    }
    deduped.push(path ? { ...t, path } : t);
  }

  return deduped;
}
