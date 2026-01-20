import { useEffect, useState } from "react";
import { ScrollView, Text, View, Pressable, Linking, TextInput } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Location from "expo-location";
import { Trail } from "../../src/logic/recommend";
import { getTrails } from "../../src/data/trailStore";
import { addCondition, loadConditions, TrailCondition } from "../../src/storage/trailConditions";
import { loadFavorites, toggleFavorite } from "../../src/storage/favorites";
import { getWalkingRoute } from "../../src/api/mapboxDirections";
import { logEvent } from "../../src/utils/logger";
import { haversineMiles, polylineMiles } from "../../src/utils/geo";
import { NavigationSession, setNavigationSession } from "../../src/state/navigationSession";

export default function TrailDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trail, setTrail] = useState<Trail | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [conditions, setConditions] = useState<TrailCondition[]>([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [routeStatus, setRouteStatus] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distanceMi: number; durationMin: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[] | null>(null);
  const [startCoords, setStartCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeZip, setRouteZip] = useState("");
  const [navSessionDraft, setNavSessionDraft] = useState<NavigationSession | null>(null);

  useEffect(() => {
    (async () => {
      const list = await getTrails();
      const match = list.find((t) => t.id === id) ?? null;
      setTrail(match);
      setConditions(match ? await loadConditions(match.id) : []);
      setFavorites(await loadFavorites());
      setLoading(false);
    })();
  }, [id]);

  // Build a navigation draft from static path if available
  useEffect(() => {
    if (!trail?.path || trail.path.length < 2) return;
    const distanceMi = polylineMiles(trail.path);
    setNavSessionDraft({
      mode: "path",
      trail,
      start: trail.path[0],
      destination: trail.path[trail.path.length - 1],
      routeCoords: trail.path,
      totalDistanceMeters: distanceMi * 1609.34,
      totalDurationSec: trail.estTimeMin * 60,
      steps: [],
    });
  }, [trail]);

  const mapsUrl =
    trail?.lat !== undefined && trail?.lng !== undefined
      ? `https://www.google.com/maps/dir/?api=1&destination=${trail.lat},${trail.lng}`
      : undefined;

  async function handleRoute() {
    // If we have a full trail path, prefer on-trail navigation and skip Mapbox directions
    if (trail?.path && trail.path.length > 1) {
      const distanceMi = polylineMiles(trail.path);
      setRouteInfo({ distanceMi: Math.round(distanceMi * 10) / 10, durationMin: trail.estTimeMin });
      setNavSessionDraft({
        mode: "path",
        trail,
        start: trail.path[0],
        destination: trail.path[trail.path.length - 1],
        routeCoords: trail.path,
        totalDistanceMeters: distanceMi * 1609.34,
        totalDurationSec: trail.estTimeMin * 60,
        steps: [],
      });
      setRouteStatus(`Trail path ready (${trail.path.length} pts). Tap Start navigation to follow the trail.`);
      return;
    }

    if (!trail?.lat || !trail.lng) {
      setRouteStatus("No coordinates for this trail.");
      return;
    }
    const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      setRouteStatus("Mapbox token missing. Set EXPO_PUBLIC_MAPBOX_TOKEN.");
      return;
    }

    const zip = routeZip.trim();
    try {
      let start: { lat: number; lng: number } | null = null;

      if (zip) {
        setRouteStatus("Geocoding ZIP...");
        const geos = await Location.geocodeAsync(zip);
        if (!geos.length) {
          setRouteStatus("Could not geocode that ZIP. Try another or use Navigate.");
          return;
        }
        start = { lat: geos[0].latitude, lng: geos[0].longitude };
      } else {
        setRouteStatus("Requesting location...");
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setRouteStatus("Permission denied. Enter ZIP or use external Navigate.");
          return;
        }
        const pos = await Location.getCurrentPositionAsync({});
        start = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      }

      const distanceToTrail = haversineMiles(start, { lat: trail.lat, lng: trail.lng });
      if (distanceToTrail > 300) {
        setRouteStatus("Trail is very far away. Use external Navigate.");
        return;
      }

      setRouteStatus("Requesting route...");
      const route = await getWalkingRoute(
        start,
        { lat: trail.lat, lng: trail.lng },
        token
      );
      setStartCoords({ latitude: start.lat, longitude: start.lng });
      if (route.geometry?.coordinates?.length) {
        const pts = route.geometry.coordinates.map((c) => ({
          latitude: c[1],
          longitude: c[0],
        }));
        setRouteCoords(pts);
      } else {
        setRouteCoords(null);
      }
      const distanceMi = route.distanceMeters / 1609.34;
      const durationMin = route.durationSec / 60;
      setRouteInfo({
        distanceMi: Math.round(distanceMi * 10) / 10,
        durationMin: Math.round(durationMin),
      });
      setNavSessionDraft({
        mode: "directions",
        trail,
        start,
        destination: { lat: trail.lat, lng: trail.lng },
        routeCoords: route.geometry.coordinates.map((c) => ({ lat: c[1], lng: c[0] })),
        totalDistanceMeters: route.distanceMeters,
        totalDurationSec: route.durationSec,
        steps: route.steps,
      });
      setRouteStatus(zip ? "Route fetched from ZIP start." : "Route fetched from your location.");
    } catch (err) {
      const msg = String(err);
      if (msg.includes("distance limitation")) {
        setRouteStatus("Route too long for Mapbox. Use external Navigate.");
      } else {
        setRouteStatus("Could not fetch route. Falling back to Navigate.");
      }
      await logEvent(`Route fetch failed: ${msg}`);
      console.log("Route fetch failed", msg);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 32 }}>
      {loading ? (
        <Text>Loading...</Text>
      ) : !trail ? (
        <Text style={{ opacity: 0.8 }}>Trail not found.</Text>
      ) : (
        <View>
          <View
            style={{
              height: 180,
              width: "100%",
              borderRadius: 12,
              marginBottom: 12,
              overflow: "hidden",
            }}
          >
            {trail.lat && trail.lng ? (
              <MapView
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: trail.lat,
                  longitude: trail.lng,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                pointerEvents="none"
              >
                <Marker coordinate={{ latitude: trail.lat, longitude: trail.lng }} />
                {startCoords ? <Marker coordinate={startCoords} pinColor="green" /> : null}
                {routeCoords ? (
                  <Polyline
                    coordinates={routeCoords}
                    strokeColor="#2f5a3b"
                    strokeWidth={3}
                  />
                ) : null}
              </MapView>
            ) : (
              <View style={{ flex: 1, backgroundColor: "#e9ecef", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#666" }}>Trail preview</Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: 26, fontWeight: "700" }}>{trail.name}</Text>
          <Text style={{ marginTop: 6, opacity: 0.8 }}>
            {trail.difficulty} • {trail.distanceMi} mi • ~{trail.estTimeMin} min
          </Text>
          {trail.source ? (
            <Text style={{ marginTop: 4, opacity: 0.8 }}>Source: {trail.source}</Text>
          ) : null}
          {trail.lat !== undefined && trail.lng !== undefined ? (
            <Text style={{ marginTop: 4, opacity: 0.8 }}>
              Trailhead: {trail.lat}, {trail.lng}
            </Text>
          ) : null}
          {routeInfo ? (
            <Text style={{ marginTop: 4, opacity: 0.8 }}>
              Route: ~{routeInfo.distanceMi} mi, ~{routeInfo.durationMin} min
            </Text>
          ) : null}
          {routeStatus ? (
            <Text style={{ marginTop: 4, opacity: 0.8 }}>{routeStatus}</Text>
          ) : null}
          {/* ZIP entry retained in case path is missing and user wants a custom start, but hidden when path is available */}
          {(!trail.path || trail.path.length < 2) ? (
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontWeight: "700" }}>Start location</Text>
              <Text style={{ marginTop: 4, opacity: 0.8 }}>Use your location or enter a ZIP.</Text>
              <TextInput
                value={routeZip}
                onChangeText={setRouteZip}
                placeholder="ZIP for routing (optional)"
                keyboardType="number-pad"
                style={{
                  marginTop: 8,
                  borderWidth: 1,
                  borderRadius: 10,
                  padding: 10,
                }}
              />
            </View>
          ) : null}
          <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
            <Pressable
              onPress={async () => {
                if (!trail) return;
                const next = await toggleFavorite(trail.id);
                setFavorites(next);
              }}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 10,
                borderWidth: 1,
                marginRight: 10,
                marginBottom: 8,
              }}
            >
              <Text style={{ fontWeight: "600" }}>
                {favorites.has(trail.id) ? "★ Saved" : "☆ Save"}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleRoute}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 10,
                borderWidth: 1,
                marginRight: 10,
                marginBottom: 8,
              }}
            >
              <Text style={{ fontWeight: "600" }}>Get route</Text>
            </Pressable>
            {navSessionDraft ? (
              <Pressable
                onPress={() => {
                  setNavigationSession(navSessionDraft);
                  router.push("/navigation");
                }}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  borderWidth: 1,
                  marginRight: 10,
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontWeight: "600" }}>Start navigation</Text>
              </Pressable>
            ) : null}
            {mapsUrl ? (
              <Pressable
                onPress={async () => {
                  if (!mapsUrl) return;
                  const can = await Linking.canOpenURL(mapsUrl);
                if (!can) {
                  setRouteStatus("Cannot open map link on this device.");
                  await logEvent(`Navigate failed: cannot open ${mapsUrl}`);
                  return;
                }
                try {
                  await Linking.openURL(mapsUrl);
                } catch (err) {
                  setRouteStatus("Failed to open maps.");
                  await logEvent(`Navigate failed: ${String(err)}`);
                }
              }}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 10,
                borderWidth: 1,
                  marginRight: 10,
                }}
              >
                <Text style={{ fontWeight: "600" }}>Navigate</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => router.back()}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 10,
                borderWidth: 1,
              }}
            >
              <Text style={{ fontWeight: "600" }}>Back</Text>
            </Pressable>
          </View>
          <View style={{ marginTop: 16 }}>
            <Text style={{ fontWeight: "700" }}>Conditions / Notes</Text>
            <Text style={{ marginTop: 6, opacity: 0.8 }}>
              Share quick notes (e.g., muddy, crowded, great views).
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Add a note"
              multiline
              style={{
                marginTop: 8,
                borderWidth: 1,
                borderRadius: 10,
                padding: 12,
                minHeight: 80,
                textAlignVertical: "top",
              }}
            />
            <Pressable
              onPress={async () => {
                if (!trail || !note.trim()) return;
                setSaving(true);
                const list = await addCondition(trail.id, note);
                setConditions(list);
                setNote("");
                setSaving(false);
              }}
              style={{
                marginTop: 10,
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 10,
                borderWidth: 1,
                alignSelf: "flex-start",
                opacity: saving ? 0.5 : 1,
              }}
              disabled={saving}
            >
              <Text style={{ fontWeight: "600" }}>{saving ? "Saving..." : "Add note"}</Text>
            </Pressable>
            <View style={{ marginTop: 12 }}>
              {conditions.length === 0 ? (
                <Text style={{ opacity: 0.8 }}>No notes yet.</Text>
              ) : (
                conditions.slice(0, 5).map((c) => (
                  <View
                    key={c.id}
                    style={{
                      borderWidth: 1,
                      borderRadius: 10,
                      padding: 10,
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ opacity: 0.8 }}>{c.note}</Text>
                    <Text style={{ marginTop: 4, fontSize: 12, opacity: 0.6 }}>
                      {new Date(c.createdAt).toLocaleString()}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
