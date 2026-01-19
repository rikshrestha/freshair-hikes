import AsyncStorage from "@react-native-async-storage/async-storage";

export type UserProfile = {
  ageRange: string;       // e.g., "25-34"
  pace: string;           // "slow" | "normal" | "fast"
  distanceBand: string;   // "1-2" | "3-5" | "6-10"
  weeklyActivity: string; // "0-1" | "2-3" | "4+"
};

const KEY = "freshair.profile.v1";

export async function saveProfile(profile: UserProfile) {
  await AsyncStorage.setItem(KEY, JSON.stringify(profile));
}

export async function loadProfile(): Promise<UserProfile | null> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as UserProfile) : null;
}

export async function clearProfile() {
  await AsyncStorage.removeItem(KEY);
}

