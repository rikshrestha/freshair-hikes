import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { clearHikes, HikeSession, loadHikes } from "../../src/storage/hikes";
import SideDrawer, { DrawerTrigger } from "../../src/components/SideDrawer";

function formatDate(ms: number) {
  return new Date(ms).toLocaleString();
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [hikes, setHikes] = useState<HikeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const stats = useMemo(() => {
    if (hikes.length === 0) return null;
    const totalMinutes = hikes.reduce((sum, hike) => sum + hike.durationMin, 0);
    const totalMiles = hikes.reduce((sum, hike) => sum + (hike.distanceMi ?? 0), 0);
    const lastHike = hikes[0];
    return { totalMinutes, totalMiles, lastHike };
  }, [hikes]);

  async function refresh() {
    setLoading(true);
    const list = await loadHikes();
    setHikes(list);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [])
  );

  async function handleClear() {
    Alert.alert("Clear history?", "This will remove all past hikes.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          await clearHikes();
          setHikes([]);
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: insets.top + 16, paddingBottom: 32 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <DrawerTrigger onPress={() => setMenuOpen(true)} />
          <Text style={{ fontSize: 26, fontWeight: "700", marginLeft: 6 }}>Hike History</Text>
        </View>
        <View style={{ marginBottom: 16 }}>
          <Text style={{ marginTop: 6, opacity: 0.8 }}>
            {hikes.length} session{hikes.length === 1 ? "" : "s"}
          </Text>
          {stats ? (
            <>
              <Text style={{ marginTop: 6, opacity: 0.8 }}>
                Total time: {stats.totalMinutes} min
              </Text>
              {stats.totalMiles > 0 ? (
                <Text style={{ marginTop: 2, opacity: 0.8 }}>
                  Total miles: {stats.totalMiles.toFixed(2)} mi
                </Text>
              ) : null}
              <Text style={{ marginTop: 2, opacity: 0.8 }}>
                Avg duration: {Math.round(stats.totalMinutes / hikes.length)} min
              </Text>
              <Text style={{ marginTop: 2, opacity: 0.8 }}>
                Last hike: {formatDate(stats.lastHike.startedAt)}
              </Text>
            </>
          ) : null}
          <Pressable
            style={{
              marginTop: 10,
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 10,
              borderWidth: 1,
              alignSelf: "flex-start",
              opacity: hikes.length === 0 ? 0.4 : 1,
            }}
            onPress={handleClear}
            disabled={hikes.length === 0}
          >
            <Text style={{ fontWeight: "600" }}>Clear history</Text>
          </Pressable>
          <Pressable
            style={{
              marginTop: 10,
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 10,
              borderWidth: 1,
              alignSelf: "flex-start",
            }}
            onPress={refresh}
          >
            <Text style={{ fontWeight: "600" }}>Refresh</Text>
          </Pressable>
        </View>

        {loading ? (
          <Text>Loading...</Text>
        ) : hikes.length === 0 ? (
          <Text style={{ opacity: 0.8 }}>No hikes yet. Start one from Today Plan.</Text>
        ) : (
          hikes.map((hike) => (
            <Pressable
              key={hike.id}
              style={{
                borderWidth: 1,
                borderRadius: 12,
                padding: 12,
                marginBottom: 12,
              }}
              onPress={() => router.push(`/hike-details/${hike.id}`)}
            >
              <Text style={{ fontWeight: "600" }}>
                {hike.trailName ?? "Hike session"}
              </Text>
              <Text style={{ marginTop: 4, opacity: 0.8 }}>
                {formatDate(hike.startedAt)}
              </Text>
              <Text style={{ marginTop: 2, opacity: 0.8 }}>
                Duration: {hike.durationMin} min
              </Text>
              {hike.distanceMi ? (
                <Text style={{ marginTop: 2, opacity: 0.8 }}>
                  Distance: {hike.distanceMi.toFixed(2)} mi
                </Text>
              ) : null}
              <Text style={{ marginTop: 2, opacity: 0.8 }}>
                {hike.effort || hike.enjoyment || (hike.tags && hike.tags.length) || hike.notes
                  ? "Reflection complete"
                  : "Reflection pending"}
              </Text>
            </Pressable>
          ))
        )}
      </ScrollView>
      <SideDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}
