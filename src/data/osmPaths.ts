import geo from "./osm-dfw-trails.json";
import { LatLng } from "../utils/geo";

type Feature = {
  geometry?: { type: string; coordinates: any };
  properties?: Record<string, any>;
};

const coordsToLatLng = (coords: [number, number][]) =>
  coords.map((c) => ({ lng: c[0], lat: c[1] }));

export type OsmPath = { id: string; name?: string; coords: LatLng[]; centroid: LatLng };

export function loadOsmPaths(): OsmPath[] {
  const feats: Feature[] = (geo as any).features || [];
  const paths: OsmPath[] = [];
  feats.forEach((f, idx) => {
    if (!f.geometry || !f.geometry.coordinates) return;
    let coords: [number, number][] = [];
    if (f.geometry.type === "LineString") {
      coords = f.geometry.coordinates;
    } else if (f.geometry.type === "MultiLineString") {
      coords = (f.geometry.coordinates as [number, number][][]).flat();
    }
    if (coords.length >= 2) {
      const latlng = coordsToLatLng(coords);
      const centroid = latlng.reduce(
        (acc, p) => ({ lat: acc.lat + p.lat / latlng.length, lng: acc.lng + p.lng / latlng.length }),
        { lat: 0, lng: 0 }
      );
      const name = typeof f.properties?.name === "string" ? f.properties.name : undefined;
      paths.push({ id: `osm-${idx + 1}`, name, coords: latlng, centroid });
    }
  });
  return paths;
}
