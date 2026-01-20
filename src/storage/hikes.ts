import AsyncStorage from "@react-native-async-storage/async-storage";

export type HikeSession = {
  id: string;
  startedAt: number;   // epoch ms
  endedAt: number;     // epoch ms
  durationMin: number; // rounded
  trailId?: string;
  trailName?: string;
  distanceMi?: number;
  actualDistanceMi?: number; // future: GPS total distance
  actualTimeMin?: number;    // future: GPS-derived moving time
  elevationGain?: number;    // future: total ascent
  effort?: number;     // 1-10
  enjoyment?: number;  // 1-10
  tags?: string[];
  notes?: string;
};

const KEY = "freshair.hikes.v1";
const ACTIVE_KEY = "freshair.hike.active.v1";

export async function loadHikes(): Promise<HikeSession[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HikeSession[]) : [];
  } catch {
    return [];
  }
}

export async function addHike(hike: HikeSession) {
  const hikes = await loadHikes();
  hikes.unshift(hike); // newest first
  await AsyncStorage.setItem(KEY, JSON.stringify(hikes));
}

export type ActiveHike = {
  id: string;
  startedAt: number;
  trailId?: string;
  trailName?: string;
  distanceMi?: number;
  actualDistanceMi?: number;
  actualTimeMin?: number;
  elevationGain?: number;
};

export async function loadActiveHike(): Promise<ActiveHike | null> {
  try {
    const raw = await AsyncStorage.getItem(ACTIVE_KEY);
    return raw ? (JSON.parse(raw) as ActiveHike) : null;
  } catch {
    return null;
  }
}

export async function startHike(active: ActiveHike) {
  await AsyncStorage.setItem(ACTIVE_KEY, JSON.stringify(active));
}

export async function endHike(overrides?: Partial<HikeSession>) {
  const active = await loadActiveHike();
  if (!active) return null;
  const endedAt = Date.now();
  const durationMin = Math.max(1, Math.round((endedAt - active.startedAt) / 60000));
  const session: HikeSession = {
    id: active.id,
    startedAt: active.startedAt,
    endedAt,
    durationMin,
    trailId: active.trailId,
    trailName: active.trailName,
    distanceMi: active.distanceMi,
    actualDistanceMi: active.actualDistanceMi,
    actualTimeMin: active.actualTimeMin,
    elevationGain: active.elevationGain,
    ...overrides,
  };
  await addHike(session);
  await AsyncStorage.removeItem(ACTIVE_KEY);
  return session;
}

export async function clearActiveHike() {
  await AsyncStorage.removeItem(ACTIVE_KEY);
}

export async function clearHikes() {
  await AsyncStorage.removeItem(KEY);
}

export async function saveHikeReflection(
  hikeId: string,
  reflection: Pick<HikeSession, "effort" | "enjoyment" | "tags" | "notes">
) {
  const hikes = await loadHikes();
  const updated = hikes.map((hike) =>
    hike.id === hikeId ? { ...hike, ...reflection } : hike
  );
  await AsyncStorage.setItem(KEY, JSON.stringify(updated));
}

export function newId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
