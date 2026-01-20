import { Trail } from "../logic/recommend";
import { LatLng } from "../utils/geo";

export type NavStep = { instruction: string; distanceMeters: number; durationSec: number };

export type NavigationSession = {
  mode: "path" | "directions";
  trail: Trail;
  start: LatLng;
  destination: LatLng;
  routeCoords: LatLng[];
  totalDistanceMeters: number;
  totalDurationSec: number;
  steps: NavStep[];
};

let session: NavigationSession | null = null;

export function setNavigationSession(next: NavigationSession) {
  session = next;
}

export function getNavigationSession() {
  return session;
}

export function clearNavigationSession() {
  session = null;
}
