import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "freshair.favorites.v1";

export async function loadFavorites(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

export async function saveFavorites(ids: Set<string>) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // ignore
  }
}

export async function toggleFavorite(id: string): Promise<Set<string>> {
  const favs = await loadFavorites();
  if (favs.has(id)) {
    favs.delete(id);
  } else {
    favs.add(id);
  }
  await saveFavorites(favs);
  return favs;
}
