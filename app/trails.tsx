import { useEffect, useMemo, useState } from "react";
import { FlatList, ScrollView, Text, View, Pressable, TextInput } from "react-native";
import * as Location from "expo-location";
import SideDrawer, { DrawerTrigger } from "../src/components/SideDrawer";
import { getTrails } from "../src/data/trailStore";
import { Trail } from "../src/logic/recommend";
import { haversineMiles, LatLng } from "../src/utils/geo";
import { useRouter } from "expo-router";
import TrailCard from "../src/components/TrailCard";
import { loadFavorites, toggleFavorite } from "../src/storage/favorites";
import { logEvent } from "../src/utils/logger";

type DifficultyFilter = "all" | Trail["difficulty"];
type DistanceFilter = "any" | "short" | "medium" | "long";

export default function TrailsScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [distance, setDistance] = useState<DistanceFilter>("any");
  const [allTrails, setAllTrails] = useState<Trail[]>([]);
  const [userCoords, setUserCoords] = useState<LatLng | null>(null);
  const [zip, setZip] = useState("");
  const [locStatus, setLocStatus] = useState<string | null>(null);
  const [locBusy, setLocBusy] = useState(false);
  const router = useRouter();
  const [limit, setLimit] = useState(20);
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const list = await getTrails();
      setAllTrails(list);
      setFavorites(await loadFavorites());
    })();
  }, []);

  useEffect(() => {
    setLimit(20);
  }, [difficulty, distance, showSaved, query]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = allTrails.filter((t) => {
      if (q && !t.name.toLowerCase().includes(q)) return false;
      if (difficulty !== "all" && t.difficulty !== difficulty) return false;
      if (distance === "short" && t.distanceMi > 3) return false;
      if (distance === "medium" && (t.distanceMi < 3 || t.distanceMi > 6)) return false;
      if (distance === "long" && t.distanceMi <= 6) return false;
      if (showSaved && !favorites.has(t.id)) return false;
      return true;
    });
    if (!userCoords) return base;
    return base
      .map((t) => ({
        ...t,
        distanceFromUser:
          t.lat !== undefined && t.lng !== undefined
            ? haversineMiles(userCoords, { lat: t.lat, lng: t.lng })
            : undefined,
      }))
      .sort((a, b) => {
        const da = a.distanceFromUser ?? Number.MAX_VALUE;
        const db = b.distanceFromUser ?? Number.MAX_VALUE;
        return da - db;
      });
  }, [allTrails, difficulty, distance, userCoords, query, favorites, showSaved]);

  function DifficultyChip({ label, value }: { label: string; value: DifficultyFilter }) {
    const active = difficulty === value;
    return (
      <Pressable
        onPress={() => setDifficulty(value)}
        style={{
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 10,
          borderWidth: 1,
          marginRight: 8,
          marginBottom: 8,
          backgroundColor: active ? "#e6f3ea" : "transparent",
        }}
      >
        <Text style={{ fontWeight: active ? "700" : "500" }}>{label}</Text>
      </Pressable>
    );
  }

  function DistanceChip({ label, value }: { label: string; value: DistanceFilter }) {
    const active = distance === value;
    return (
      <Pressable
        onPress={() => setDistance(value)}
        style={{
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 10,
          borderWidth: 1,
          marginRight: 8,
          marginBottom: 8,
          backgroundColor: active ? "#e6f3ea" : "transparent",
        }}
      >
        <Text style={{ fontWeight: active ? "700" : "500" }}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 32 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
          <DrawerTrigger onPress={() => setMenuOpen(true)} />
          <Text style={{ fontSize: 26, fontWeight: "700", marginLeft: 6 }}>Trails</Text>
        </View>
      <Text style={{ marginTop: 6, opacity: 0.8 }}>
        Browse all trails. Use filters to narrow by difficulty and distance.
      </Text>
      <View style={{ marginTop: 10 }}>
        <TextInput
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            setLimit(20);
          }}
          placeholder="Search trails"
          style={{
            borderWidth: 1,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        />
      </View>

      <View style={{ marginTop: 12 }}>
        <Text style={{ fontWeight: "700", marginBottom: 6 }}>Location</Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
          <Pressable
            onPress={async () => {
              setLocBusy(true);
              setLocStatus(null);
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status !== "granted") {
                await logEvent("Location permission denied");
                setLocStatus("Permission denied. Enter ZIP to sort by proximity.");
                setLocBusy(false);
                return;
              }
              try {
                const pos = await Location.getCurrentPositionAsync({});
                setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setLocStatus("Using your location to sort nearest first.");
              } catch (err) {
                await logEvent(`Location fetch failed: ${String(err)}`);
                setLocStatus("Could not get location. Enter ZIP instead.");
              } finally {
                setLocBusy(false);
              }
            }}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 10,
              borderWidth: 1,
              marginRight: 10,
              marginBottom: 8,
              opacity: locBusy ? 0.5 : 1,
            }}
            disabled={locBusy}
          >
            <Text style={{ fontWeight: "600" }}>Use my location</Text>
          </Pressable>
          <TextInput
            value={zip}
            onChangeText={setZip}
            placeholder="ZIP"
            keyboardType="number-pad"
            style={{
              width: 100,
              borderWidth: 1,
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 8,
              marginRight: 8,
              marginBottom: 8,
            }}
          />
          <Pressable
            onPress={async () => {
              if (!zip.trim()) return;
              setLocBusy(true);
              try {
                const results = await Location.geocodeAsync(zip.trim());
                const first = results[0];
                if (first) {
                  setUserCoords({ lat: first.latitude, lng: first.longitude });
                  setLocStatus("Using ZIP to sort nearest first.");
                } else {
                  setLocStatus("Could not geocode ZIP.");
                }
              } catch (err) {
                await logEvent(`Geocode failed: ${String(err)}`);
                setLocStatus("Geocoding failed.");
              } finally {
                setLocBusy(false);
              }
            }}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 10,
              borderWidth: 1,
              marginBottom: 8,
              opacity: locBusy ? 0.5 : 1,
            }}
            disabled={locBusy}
          >
            <Text style={{ fontWeight: "600" }}>Use ZIP</Text>
          </Pressable>
        </View>
        {locStatus ? <Text style={{ opacity: 0.8 }}>{locStatus}</Text> : null}
      </View>

      <View style={{ marginTop: 16 }}>
        <Text style={{ fontWeight: "700", marginBottom: 6 }}>Difficulty</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          <DifficultyChip label="All" value="all" />
          <DifficultyChip label="Easy" value="Easy" />
          <DifficultyChip label="Moderate" value="Moderate" />
          <DifficultyChip label="Strenuous" value="Strenuous" />
        </View>
      </View>

      <View style={{ marginTop: 12 }}>
        <Text style={{ fontWeight: "700", marginBottom: 6 }}>Distance</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          <DistanceChip label="Any" value="any" />
          <DistanceChip label="Short (<3 mi)" value="short" />
          <DistanceChip label="Medium (3-6 mi)" value="medium" />
          <DistanceChip label="Long (>6 mi)" value="long" />
        </View>
      </View>

      <View style={{ marginTop: 12 }}>
        <Text style={{ fontWeight: "700", marginBottom: 6 }}>Saved</Text>
        <Pressable
          onPress={() => setShowSaved((prev) => !prev)}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 10,
            borderWidth: 1,
            backgroundColor: showSaved ? "#e6f3ea" : "transparent",
            alignSelf: "flex-start",
          }}
        >
          <Text style={{ fontWeight: "600" }}>{showSaved ? "Showing saved" : "Show saved"}</Text>
        </Pressable>
      </View>

      <View style={{ marginTop: 16, flex: 1 }}>
        <Text style={{ fontWeight: "700", marginBottom: 8 }}>
          Showing {Math.min(filtered.length, limit)} of {filtered.length} trail{filtered.length === 1 ? "" : "s"}
        </Text>
        {filtered.length === 0 ? (
          <Text style={{ opacity: 0.8 }}>No trails match these filters.</Text>
        ) : (
          <FlatList
            data={filtered.slice(0, limit)}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TrailCard
                trail={item}
                onSelect={() => router.push(`/trail/${item.id}`)}
                showSource={false}
                showWhy={false}
                isFavorite={favorites.has(item.id)}
                onToggleFavorite={async () => {
                  const next = await toggleFavorite(item.id);
                  setFavorites(next);
                }}
              />
            )}
            scrollEnabled={false}
          />
        )}
        {filtered.length > limit ? (
          <Pressable
            onPress={() => setLimit((prev) => prev + 20)}
            style={{
              marginTop: 10,
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 10,
              borderWidth: 1,
              alignSelf: "flex-start",
            }}
          >
            <Text style={{ fontWeight: "600" }}>Show more</Text>
          </Pressable>
        ) : null}
      </View>
      </ScrollView>
      <SideDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}
