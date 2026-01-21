import { Trail } from "../logic/recommend";
import { LatLng } from "../utils/geo";
import { loadOsmPaths } from "./osmPaths";
import { TRAILS_DFW } from "./trails.dfw";
import { TRAILS_KATHMANDU } from "./trails.kathmandu";

export type RegionId = "dfw" | "kathmandu";

export type RegionConfig = {
  id: RegionId;
  label: string;
  center: LatLng;
  trails: Trail[];
};

const REGIONS: Record<RegionId, RegionConfig> = {
  dfw: {
    id: "dfw",
    label: "Dallas / Fort Worth",
    center: { lat: 32.7767, lng: -96.797 },
    trails: TRAILS_DFW,
  },
  kathmandu: {
    id: "kathmandu",
    label: "Kathmandu",
    center: { lat: 27.7172, lng: 85.324 },
    trails: TRAILS_KATHMANDU,
  },
};

export function listRegions(): RegionConfig[] {
  return Object.values(REGIONS);
}

export function getRegionConfig(id: RegionId): RegionConfig {
  return REGIONS[id] ?? REGIONS.dfw;
}

export function loadRegionOsmPaths(id: RegionId) {
  return loadOsmPaths(id);
}
