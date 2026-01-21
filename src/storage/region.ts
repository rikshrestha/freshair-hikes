import AsyncStorage from "@react-native-async-storage/async-storage";
import { RegionId } from "../data/regions";

const REGION_KEY = "region/current";

export async function getRegion(): Promise<RegionId> {
  try {
    const saved = await AsyncStorage.getItem(REGION_KEY);
    if (saved === "dfw" || saved === "kathmandu") {
      return saved;
    }
  } catch {
    // ignore
  }
  return "dfw";
}

export async function setRegion(region: RegionId) {
  try {
    await AsyncStorage.setItem(REGION_KEY, region);
  } catch {
    // ignore
  }
}
