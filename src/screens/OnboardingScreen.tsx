import { useMemo, useState } from "react";
import { View, Text, Button, ScrollView } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { saveProfile, UserProfile } from "../storage/profile";

export default function OnboardingScreen({
  onDone,
}: {
  onDone: () => void;
}) {
  const ageRanges = useMemo(() => ["18-24", "25-34", "35-44", "45-54", "55+"], []);
  const paces = useMemo(() => ["slow", "normal", "fast"], []);
  const distances = useMemo(() => ["1-2", "3-5", "6-10"], []);
  const weekly = useMemo(() => ["0-1", "2-3", "4+"], []);

  const [ageRange, setAgeRange] = useState(ageRanges[1]);
  const [pace, setPace] = useState(paces[1]);
  const [distanceBand, setDistanceBand] = useState(distances[0]);
  const [weeklyActivity, setWeeklyActivity] = useState(weekly[0]);
  const [saving, setSaving] = useState(false);

  async function handleContinue() {
    setSaving(true);

    const profile: UserProfile = {
      ageRange,
      pace,
      distanceBand,
      weeklyActivity,
    };

    await saveProfile(profile);
    setSaving(false);
    onDone();
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
    >
      <View style={{ justifyContent: "center" }}>
      <Text style={{ fontSize: 26, marginBottom: 8 }}>FreshAir Hikes</Text>
      <Text style={{ marginBottom: 20 }}>
        Let’s personalize your hiking experience.
      </Text>

      <Text>Age range</Text>
      <Picker selectedValue={ageRange} onValueChange={setAgeRange}>
        {ageRanges.map((v) => (
          <Picker.Item key={v} label={v} value={v} />
        ))}
      </Picker>

      <Text>Pace</Text>
      <Picker selectedValue={pace} onValueChange={setPace}>
        {paces.map((v) => (
          <Picker.Item key={v} label={v} value={v} />
        ))}
      </Picker>

      <Text>Typical distance (miles)</Text>
      <Picker
        selectedValue={distanceBand}
        onValueChange={setDistanceBand}
      >
        {distances.map((v) => (
          <Picker.Item key={v} label={v} value={v} />
        ))}
      </Picker>

      <Text>Weekly activity</Text>
      <Picker
        selectedValue={weeklyActivity}
        onValueChange={setWeeklyActivity}
      >
        {weekly.map((v) => (
          <Picker.Item key={v} label={v} value={v} />
        ))}
      </Picker>

      <View style={{ marginTop: 16 }}>
        <Button
          title={saving ? "Saving..." : "Continue"}
          onPress={handleContinue}
          disabled={saving}
        />
      </View>
      </View>
    </ScrollView>
  );
}
