import { LatLng } from "../utils/geo";

type MapboxStep = {
  distance: number; // meters
  duration: number; // seconds
  name?: string;
  maneuver?: { instruction?: string };
};

type MapboxRoute = {
  geometry: {
    type: string;
    coordinates: [number, number][];
  };
  distance: number; // meters
  duration: number; // seconds
  legs?: { steps?: MapboxStep[] }[];
};

export async function getWalkingRoute(
  start: LatLng,
  end: LatLng,
  token: string
): Promise<{
  distanceMeters: number;
  durationSec: number;
  geometry: MapboxRoute["geometry"];
  steps: { instruction: string; distanceMeters: number; durationSec: number }[];
}> {
  if (!token) {
    throw new Error("Mapbox token missing");
  }
  const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${start.lng},${start.lat};${end.lng},${end.lat}?alternatives=false&geometries=geojson&overview=full&steps=true&access_token=${token}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Mapbox error ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  const route: MapboxRoute | undefined = data?.routes?.[0];
  if (!route) {
    throw new Error("No route found");
  }
  return {
    distanceMeters: route.distance,
    durationSec: route.duration,
    geometry: route.geometry,
    steps:
      route.legs?.[0]?.steps?.map((s) => ({
        instruction: s.maneuver?.instruction || s.name || "Continue",
        distanceMeters: s.distance,
        durationSec: s.duration,
      })) ?? [],
  };
}
