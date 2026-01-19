import { useEffect, useState } from "react";
import { ScrollView, Text, Pressable } from "react-native";
import { loadProfile } from "../storage/profile";
import { pickTrails, Trail } from "../logic/recommend";

const ALL_TRAILS: Trail[] = [
  { id: "t1", name: "Lake Loop", difficulty: "Easy", distanceMi: 2.2, estTimeMin: 50, why: "Easy start." },
  { id: "t2", name: "Forest Path", difficulty: "Easy", distanceMi: 3.0, estTimeMin: 70, why: "Comfortable distance." },
  { id: "t3", name: "Ridge View", difficulty: "Moderate", distanceMi: 4.1, estTimeMin: 95, why: "Gentle climb." },
  { id: "t4", name: "Summit Push", difficulty: "Strenuous", distanceMi: 7.5, estTimeMin: 180, why: "Big challenge." },
  { id: "t5", name: "Meadow Walk", difficulty: "Easy", distanceMi: 1.8, estTimeMin: 40, why: "Short and scenic." },
  { id: "t6", name: "River Bend", difficulty: "Easy", distanceMi: 2.6, estTimeMin: 60, why: "Flat and relaxing." },
  { id: "t7", name: "Pine Grove", difficulty: "Easy", distanceMi: 3.4, estTimeMin: 80, why: "Shaded woodland." },
  { id: "t8", name: "Canyon Lookout", difficulty: "Moderate", distanceMi: 4.8, estTimeMin: 110, why: "Views and steady climb." },
  { id: "t9", name: "Creek Ridge", difficulty: "Moderate", distanceMi: 5.2, estTimeMin: 120, why: "Rolling elevation." },
  { id: "t10", name: "Granite Pass", difficulty: "Moderate", distanceMi: 6.0, estTimeMin: 140, why: "Longer but manageable." },
  { id: "t11", name: "Maple Hollow", difficulty: "Easy", distanceMi: 2.0, estTimeMin: 45, why: "Gentle with shade." },
  { id: "t12", name: "Sunset Loop", difficulty: "Easy", distanceMi: 2.9, estTimeMin: 65, why: "Great evening stroll." },
  { id: "t13", name: "Boulder Rise", difficulty: "Moderate", distanceMi: 4.6, estTimeMin: 105, why: "Steady incline." },
  { id: "t14", name: "Aspen Traverse", difficulty: "Moderate", distanceMi: 5.5, estTimeMin: 130, why: "Moderate climb, big views." },
];

function Card({ trail }: { trail: Trail }) {
  return (
    <Pressable
      style={{
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 12,
      }}
      onPress={() => {}}
    >
      <Text style={{ fontSize: 18, fontWeight: "600" }}>{trail.name}</Text>
      <Text style={{ marginTop: 4 }}>
        {trail.difficulty} • {trail.distanceMi} mi • ~{trail.estTimeMin} min
      </Text>
      <Text style={{ marginTop: 8, opacity: 0.8 }}>{trail.why}</Text>
    </Pressable>
  );
}

export default function TodayPlanScreen() {
  const [trails, setTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const p = await loadProfile();
      if (p) {
        setTrails(pickTrails(p, ALL_TRAILS));
      }
      setLoading(false);
    })();
  }, []);

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 32 }}>
      <Text style={{ fontSize: 26, fontWeight: "700" }}>Today Plan</Text>
      <Text style={{ marginTop: 6, marginBottom: 16, opacity: 0.8 }}>
        3 hikes picked for your pace and comfort.
      </Text>

      {loading ? (
        <Text>Loading...</Text>
      ) : trails.length === 0 ? (
        <Text style={{ opacity: 0.8 }}>
          No recommendations yet. Complete onboarding first.
        </Text>
      ) : (
        trails.map((t) => <Card key={t.id} trail={t} />)
      )}
    </ScrollView>
  );
}
