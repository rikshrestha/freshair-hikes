import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useFocusEffect } from "expo-router";
import { loadProfile, saveProfile, UserProfile } from "../../src/storage/profile";
import { loadHikes } from "../../src/storage/hikes";

const AGE_RANGES = ["18-24", "25-34", "35-44", "45-54", "55+"];
const PACES = ["slow", "normal", "fast"];
const DISTANCES = ["1-2", "3-5", "6-10"];
const WEEKLY = ["0-1", "2-3", "4+"];
const DEFAULT_PROFILE: UserProfile = {
  ageRange: AGE_RANGES[1],
  pace: PACES[1],
  distanceBand: DISTANCES[0],
  weeklyActivity: WEEKLY[0],
};

function formatDate(ms: number) {
  return new Date(ms).toLocaleString();
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [draft, setDraft] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<{ totalHikes: number; totalMinutes: number; totalMiles: number; lastHike?: number; firstHike?: number } | null>(null);

  const profileReady = useMemo(() => !!draft, [draft]);

  async function refresh() {
    const loaded = await loadProfile();
    setProfile(loaded);
    setDraft(loaded ?? DEFAULT_PROFILE);
    setIsEditing(!loaded);
    const hikes = await loadHikes();
    if (hikes.length === 0) {
      setStats(null);
      return;
    }
    const totalMinutes = hikes.reduce((sum, hike) => sum + hike.durationMin, 0);
    const totalMiles = hikes.reduce((sum, hike) => sum + (hike.distanceMi ?? 0), 0);
    setStats({
      totalHikes: hikes.length,
      totalMinutes,
      totalMiles,
      lastHike: hikes[0]?.startedAt,
      firstHike: hikes[hikes.length - 1]?.startedAt,
    });
  }

  useEffect(() => {
    refresh();
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [])
  );

  async function handleSave() {
    setSaving(true);
    await saveProfile(draft);
    setProfile(draft);
    setIsEditing(false);
    setSaving(false);
  }

  function handleCancel() {
    if (!profile) return;
    setDraft(profile);
    setIsEditing(false);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 32 }}>
      <Text style={{ fontSize: 26, fontWeight: "700" }}>Profile</Text>
      <Text style={{ marginTop: 6, opacity: 0.8 }}>
        Update your preferences and see your hiking stats.
      </Text>

      <View style={{ marginTop: 16 }}>
        {!isEditing && profile ? (
          <View style={{ borderWidth: 1, borderRadius: 12, padding: 14 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontWeight: "600" }}>Your preferences</Text>
              <Pressable onPress={() => setIsEditing(true)}>
                <Text style={{ fontWeight: "600" }}>Edit</Text>
              </Pressable>
            </View>
            <Text style={{ marginTop: 8, opacity: 0.8 }}>Age range: {profile.ageRange}</Text>
            <Text style={{ marginTop: 4, opacity: 0.8 }}>Pace: {profile.pace}</Text>
            <Text style={{ marginTop: 4, opacity: 0.8 }}>Distance: {profile.distanceBand} mi</Text>
            <Text style={{ marginTop: 4, opacity: 0.8 }}>
              Weekly activity: {profile.weeklyActivity}
            </Text>
          </View>
        ) : (
          <>
            <Text style={{ fontWeight: "600" }}>Age range</Text>
            <Picker
              selectedValue={draft.ageRange}
              onValueChange={(value) =>
                setDraft((prev) => ({
                  ...prev,
                  ageRange: value,
                }))
              }
            >
              {AGE_RANGES.map((v) => (
                <Picker.Item key={v} label={v} value={v} />
              ))}
            </Picker>

            <Text style={{ fontWeight: "600" }}>Pace</Text>
            <Picker
              selectedValue={draft.pace}
              onValueChange={(value) =>
                setDraft((prev) => ({
                  ...prev,
                  pace: value,
                }))
              }
            >
              {PACES.map((v) => (
                <Picker.Item key={v} label={v} value={v} />
              ))}
            </Picker>

            <Text style={{ fontWeight: "600" }}>Typical distance (miles)</Text>
            <Picker
              selectedValue={draft.distanceBand}
              onValueChange={(value) =>
                setDraft((prev) => ({
                  ...prev,
                  distanceBand: value,
                }))
              }
            >
              {DISTANCES.map((v) => (
                <Picker.Item key={v} label={v} value={v} />
              ))}
            </Picker>

            <Text style={{ fontWeight: "600" }}>Weekly activity</Text>
            <Picker
              selectedValue={draft.weeklyActivity}
              onValueChange={(value) =>
                setDraft((prev) => ({
                  ...prev,
                  weeklyActivity: value,
                }))
              }
            >
              {WEEKLY.map((v) => (
                <Picker.Item key={v} label={v} value={v} />
              ))}
            </Picker>

            <View style={{ flexDirection: "row", marginTop: 12 }}>
              <Pressable
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 10,
                  borderWidth: 1,
                  alignSelf: "flex-start",
                  opacity: profileReady ? 1 : 0.5,
                  marginRight: 10,
                }}
                onPress={handleSave}
                disabled={!profileReady || saving}
              >
                <Text style={{ fontWeight: "600" }}>{saving ? "Saving..." : "Save changes"}</Text>
              </Pressable>
              {profile ? (
                <Pressable
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    borderRadius: 10,
                    borderWidth: 1,
                    alignSelf: "flex-start",
                  }}
                  onPress={handleCancel}
                  disabled={saving}
                >
                  <Text style={{ fontWeight: "600" }}>Cancel</Text>
                </Pressable>
              ) : null}
            </View>
          </>
        )}
      </View>

      <View style={{ marginTop: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>Your stats</Text>
        {stats ? (
          <>
            <Text style={{ marginTop: 6, opacity: 0.8 }}>
              Total hikes: {stats.totalHikes}
            </Text>
            <Text style={{ marginTop: 4, opacity: 0.8 }}>
              Total time: {stats.totalMinutes} min
            </Text>
            {stats.totalMiles > 0 ? (
              <Text style={{ marginTop: 4, opacity: 0.8 }}>
                Total miles: {stats.totalMiles.toFixed(1)} mi
              </Text>
            ) : null}
            {stats.firstHike ? (
              <Text style={{ marginTop: 4, opacity: 0.8 }}>
                First hike: {formatDate(stats.firstHike)}
              </Text>
            ) : null}
            {stats.lastHike ? (
              <Text style={{ marginTop: 4, opacity: 0.8 }}>
                Last hike: {formatDate(stats.lastHike)}
              </Text>
            ) : null}
          </>
        ) : (
          <Text style={{ marginTop: 6, opacity: 0.8 }}>
            No hikes yet. Start one from Today Plan.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
