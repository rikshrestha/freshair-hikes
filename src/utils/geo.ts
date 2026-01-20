export type LatLng = { lat: number; lng: number };

export function haversineMiles(a: LatLng, b: LatLng) {
  const R = 3958.8; // miles
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function polylineMiles(coords: LatLng[]) {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    total += haversineMiles(coords[i - 1], coords[i]);
  }
  return total;
}

export function nearestPointIndex(point: LatLng, coords: LatLng[]) {
  if (!coords.length) return -1;
  let best = 0;
  let bestDist = haversineMiles(point, coords[0]);
  for (let i = 1; i < coords.length; i++) {
    const d = haversineMiles(point, coords[i]);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}
