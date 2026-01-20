import AsyncStorage from "@react-native-async-storage/async-storage";

export type TrailCondition = {
  id: string;
  trailId: string;
  note: string;
  createdAt: number;
};

const KEY = "freshair.trailConditions.v1";

export async function loadConditions(trailId: string): Promise<TrailCondition[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const all = raw ? (JSON.parse(raw) as TrailCondition[]) : [];
    return all.filter((c) => c.trailId === trailId).sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export async function addCondition(trailId: string, note: string): Promise<TrailCondition[]> {
  const trimmed = note.trim();
  if (!trimmed) return await loadConditions(trailId);
  const entry: TrailCondition = {
    id: `${trailId}-${Date.now()}`,
    trailId,
    note: trimmed,
    createdAt: Date.now(),
  };
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const all = raw ? (JSON.parse(raw) as TrailCondition[]) : [];
    all.unshift(entry);
    await AsyncStorage.setItem(KEY, JSON.stringify(all));
    return all.filter((c) => c.trailId === trailId).sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [entry];
  }
}
