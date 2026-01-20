import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, Text, Pressable, View } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { loadProfile } from "../storage/profile";
import { maxDifficultyAllowed, rankTrails, readinessScore, Trail } from "../logic/recommend";
import { loadActiveHike, startHike, endHike, newId, ActiveHike, loadHikes } from "../storage/hikes";

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

function Card({
  trail,
  disabled,
  selected,
  onPress,
}: {
  trail: Trail;
  disabled: boolean;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={{
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: selected ? "#2f5a3b" : "#000",
        marginBottom: 12,
        opacity: disabled ? 0.6 : 1,
      }}
      onPress={onPress}
      disabled={disabled}
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
  const [otherTrails, setOtherTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeHike, setActiveHike] = useState<ActiveHike | null>(null);
  const [now, setNow] = useState(Date.now());
  const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null);
  const [readiness, setReadiness] = useState<number | null>(null);
  const [maxDiff, setMaxDiff] = useState<number | null>(null);
  const router = useRouter();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const p = await loadProfile();
      const history = await loadHikes();
      const active = await loadActiveHike();
      setActiveHike(active);
      if (p) {
        const r = readinessScore(p, history);
        setReadiness(r);
        setMaxDiff(maxDifficultyAllowed(r));
        const ranked = rankTrails(p, history, ALL_TRAILS);
        setTrails(ranked.slice(0, 3));
        setOtherTrails(ranked.slice(3));
      } else {
        setReadiness(null);
        setMaxDiff(null);
        setTrails([]);
        setOtherTrails([]);
      }
      if (active?.trailId) {
        const selected = ALL_TRAILS.find((trail) => trail.id === active.trailId) ?? null;
        setSelectedTrail(selected);
      } else {
        setSelectedTrail(null);
      }
    } catch {
      setTrails([]);
      setOtherTrails([]);
      setReadiness(null);
      setMaxDiff(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    if (!activeHike) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [activeHike]);

  const elapsedMin = useMemo(() => {
    if (!activeHike) return 0;
    return Math.max(1, Math.round((now - activeHike.startedAt) / 60000));
  }, [activeHike, now]);

  async function handleStart() {
    if (activeHike) return;
    if (!selectedTrail) return;
    const next: ActiveHike = {
      id: newId(),
      startedAt: Date.now(),
      trailId: selectedTrail.id,
      trailName: selectedTrail.name,
      distanceMi: selectedTrail.distanceMi,
    };
    await startHike(next);
    setActiveHike(next);
  }

  async function handleEnd() {
    if (!activeHike) return;
    const session = await endHike();
    setActiveHike(null);
    if (session) {
      router.push(`/hike-reflection/${session.id}`);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 32 }}>
      <Text style={{ fontSize: 26, fontWeight: "700" }}>Today Plan</Text>
      <Text style={{ marginTop: 6, opacity: 0.8 }}>
        {loading
          ? "Loading recommendations..."
          : trails.length > 0
          ? `${trails.length} hike${trails.length === 1 ? "" : "s"} fit your preferences today.`
          : "No recommendations yet. Complete onboarding first."}
      </Text>
      {readiness !== null && maxDiff !== null ? (
        <Text style={{ marginTop: 4, opacity: 0.8 }}>
          Readiness {readiness}/4 • Showing {maxDiff === 1 ? "Easy only" : maxDiff === 2 ? "Easy + Moderate" : "all levels"}
        </Text>
      ) : null}
      <View style={{ marginTop: 10, marginBottom: 16 }}>
        {activeHike ? (
          <>
            <Text style={{ opacity: 0.8 }}>
              Hike in progress{activeHike.trailName ? `: ${activeHike.trailName}` : ""}.
            </Text>
            <Text style={{ marginTop: 4, opacity: 0.8 }}>
              Elapsed: {elapsedMin} min
            </Text>
            <Pressable
              style={{
                marginTop: 10,
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 10,
                borderWidth: 1,
                alignSelf: "flex-start",
              }}
              onPress={handleEnd}
            >
              <Text style={{ fontWeight: "600" }}>End hike</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={{ opacity: 0.8 }}>
              Ready to start a hike? Pick a trail, then start.
            </Text>
            <Pressable
              style={{
                marginTop: 10,
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 10,
                borderWidth: 1,
                alignSelf: "flex-start",
                opacity: selectedTrail ? 1 : 0.5,
              }}
              onPress={handleStart}
              disabled={!selectedTrail}
            >
              <Text style={{ fontWeight: "600" }}>Start hike</Text>
            </Pressable>
            {selectedTrail ? (
              <Text style={{ marginTop: 8, opacity: 0.8 }}>
                Selected: {selectedTrail.name}
              </Text>
            ) : null}
          </>
        )}
      </View>

      {loading ? (
        <Text>Loading...</Text>
      ) : trails.length === 0 ? (
        <Text style={{ opacity: 0.8 }}>
          No recommendations yet. Complete onboarding first.
        </Text>
      ) : (
        <>
          <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>
            Recommended Trails
          </Text>
          {trails.map((t) => (
            <Card
              key={t.id}
              trail={t}
              disabled={!!activeHike}
              selected={selectedTrail?.id === t.id}
              onPress={() => setSelectedTrail(t)}
            />
          ))}

          {otherTrails.length > 0 ? (
            <>
              <Text style={{ fontSize: 18, fontWeight: "700", marginVertical: 8 }}>
                Other Options
              </Text>
              {otherTrails.map((t) => (
                <Card
                  key={t.id}
                  trail={t}
                  disabled={!!activeHike}
                  selected={selectedTrail?.id === t.id}
                  onPress={() => setSelectedTrail(t)}
                />
              ))}
            </>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}
