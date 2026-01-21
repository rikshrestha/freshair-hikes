import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, Text, Pressable, View } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { loadProfile } from "../storage/profile";
import { maxDifficultyAllowed, rankTrails, readinessScore, Trail } from "../logic/recommend";
import { loadActiveHike, startHike, endHike, newId, ActiveHike, loadHikes } from "../storage/hikes";
import { getTrails } from "../data/trailStore";
import { loadFavorites, toggleFavorite } from "../storage/favorites";
import TrailCard from "../components/TrailCard";
import SideDrawer, { DrawerTrigger } from "../components/SideDrawer";

let ALL_TRAILS: Trail[] = [];

export default function TodayPlanScreen() {
  const insets = useSafeAreaInsets();
  const [trails, setTrails] = useState<Trail[]>([]);
  const [otherTrails, setOtherTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeHike, setActiveHike] = useState<ActiveHike | null>(null);
  const [now, setNow] = useState(Date.now());
  const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null);
  const [readiness, setReadiness] = useState<number | null>(null);
  const [maxDiff, setMaxDiff] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [otherLimit, setOtherLimit] = useState(20);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [nudge, setNudge] = useState<string | null>(null);
  const router = useRouter();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (ALL_TRAILS.length === 0) {
        ALL_TRAILS = await getTrails();
      }
      const p = await loadProfile();
      const history = await loadHikes();
      const active = await loadActiveHike();
      setFavorites(await loadFavorites());
      setActiveHike(active);
      if (p) {
        const r = readinessScore(p, history);
        setReadiness(r);
        setMaxDiff(maxDifficultyAllowed(r));
        const ranked = rankTrails(p, history, ALL_TRAILS);
        setTrails(ranked.slice(0, 3));
        setOtherTrails(ranked.slice(3));
        setOtherLimit(20);
        if (history.length > 0) {
          const last = history[0].startedAt;
          const days = Math.floor((Date.now() - last) / (1000 * 60 * 60 * 24));
          if (days >= 10) {
            setNudge(`It's been ${days} days since your last hike. Ready to get back out?`);
          } else {
            setNudge(null);
          }
        } else {
          setNudge("No hikes yet—start one to kick off your streak.");
        }
      } else {
        setReadiness(null);
        setMaxDiff(null);
        setTrails([]);
        setOtherTrails([]);
        setNudge(null);
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
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: insets.top + 16, paddingBottom: 32 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
        <DrawerTrigger onPress={() => setMenuOpen(true)} />
        <Text style={{ fontSize: 26, fontWeight: "700", marginLeft: 6 }}>Today Plan</Text>
      </View>
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
      {nudge ? (
        <Text style={{ marginTop: 6, opacity: 0.8, color: "#a15c00" }}>
          {nudge}
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
                accessibilityRole="button"
                accessibilityLabel="End hike"
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
              accessibilityRole="button"
              accessibilityLabel="Start hike"
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
              <TrailCard
                key={`rec-${t.id}`}
                trail={t}
                disabled={!!activeHike}
                selected={selectedTrail?.id === t.id}
                onSelect={() => setSelectedTrail(t)}
                onLongPress={() => router.push(`/trail/${t.id}`)}
                showSource={false}
                showWhy={false}
                showLongPressHint
                isFavorite={favorites.has(t.id)}
                onToggleFavorite={async () => {
                  const next = await toggleFavorite(t.id);
                  setFavorites(next);
                }}
              />
            ))}

            {otherTrails.length > 0 ? (
              <>
                <Text style={{ fontSize: 18, fontWeight: "700", marginVertical: 8 }}>
                  Other Options
                </Text>
                {otherTrails.slice(0, otherLimit).map((t) => (
                  <TrailCard
                    key={`other-${t.id}`}
                    trail={t}
                    disabled={!!activeHike}
                    selected={selectedTrail?.id === t.id}
                    onSelect={() => setSelectedTrail(t)}
                    onLongPress={() => router.push(`/trail/${t.id}`)}
                    showSource={false}
                    showWhy={false}
                    showLongPressHint
                    isFavorite={favorites.has(t.id)}
                    onToggleFavorite={async () => {
                      const next = await toggleFavorite(t.id);
                      setFavorites(next);
                    }}
                  />
                ))}
                {otherTrails.length > otherLimit ? (
                  <Pressable
                    onPress={() => setOtherLimit((prev) => prev + 20)}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      borderRadius: 10,
                      borderWidth: 1,
                      alignSelf: "flex-start",
                      marginTop: 6,
                    }}
                  >
                    <Text style={{ fontWeight: "600" }}>Show more</Text>
                  </Pressable>
                ) : null}
              </>
            ) : null}
          </>
        )}
      </ScrollView>
      <SideDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}
