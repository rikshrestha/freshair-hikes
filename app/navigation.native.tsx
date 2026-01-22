import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Platform, Animated } from "react-native";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getNavigationSession, setNavigationSession, clearNavigationSession, NavigationSession } from "../src/state/navigationSession";
import { haversineMiles, nearestPointIndex, polylineMiles } from "../src/utils/geo";
import { getWalkingRoute } from "../src/api/mapboxDirections";
import { logEvent } from "../src/utils/logger";
import { startHike, endHike, newId, clearActiveHike } from "../src/storage/hikes";
import SideDrawer, { DrawerTrigger } from "../src/components/SideDrawer";

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Maps = Platform.OS === "web" ? null : require("react-native-maps");
const MapView = Maps?.default ?? null;
const Marker = Maps?.Marker ?? null;
const Polyline = Maps?.Polyline ?? null;

export default function NavigationScreen() {
  const router = useRouter();
  const [nav, setNav] = useState<NavigationSession | null>(getNavigationSession());
  const [userPos, setUserPos] = useState<{ latitude: number; longitude: number } | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [offRoute, setOffRoute] = useState(false);
  const [paused, setPaused] = useState(false);
  const watchSub = useRef<Location.LocationSubscription | null>(null);
  const lastReroute = useRef<number>(0);
  const mapRef = useRef<MapView | null>(null);
  const [lastRegion, setLastRegion] = useState<Region | undefined>(undefined);
  const [offline, setOffline] = useState(false);
  const [arrived, setArrived] = useState(false);
  const hikeIdRef = useRef<string | null>(null);
  const [lockOnUser, setLockOnUser] = useState(true);
  const [bgEnabled, setBgEnabled] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const muted = "#f4f5f6";
  const border = "#e0e0e0";
  const lockOnUserRef = useRef(lockOnUser);
  const lastDeltaRef = useRef<number | undefined>(lastRegion?.latitudeDelta);
  const [menuOpen, setMenuOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const totalMiles = useMemo(() => {
    if (!nav) return 0;
    if (nav.mode === "path") {
      return polylineMiles(nav.routeCoords);
    }
    return nav.totalDistanceMeters / 1609.34;
  }, [nav]);

  const stepCumulative = useMemo(() => {
    if (!nav) return [];
    let acc = 0;
    return nav.steps.map((s) => {
      acc += s.distanceMeters;
      return acc;
    });
  }, [nav]);

  const traveledMiles = useMemo(() => {
    if (!nav || !userPos) return 0;
    const idx = nearestPointIndex(
      { lat: userPos.latitude, lng: userPos.longitude },
      nav.routeCoords
    );
    if (idx < 1) return 0;
    return polylineMiles(nav.routeCoords.slice(0, idx + 1));
  }, [nav, userPos]);

  const nextStep = useMemo(() => {
    if (!nav) return null;
    if (nav.mode === "path") return null;
    if (!userPos) return nav.steps[0] ?? null;
    const traveledMeters = traveledMiles * 1609.34;
    const idx = stepCumulative.findIndex((d) => d > traveledMeters);
    if (idx === -1) return nav.steps[nav.steps.length - 1] ?? null;
    return nav.steps[idx] ?? null;
  }, [nav, stepCumulative, userPos, traveledMiles]);

  const remainingMiles = useMemo(() => {
    if (!nav) return 0;
    if (!userPos) return totalMiles;
    const idx = nearestPointIndex(
      { lat: userPos.latitude, lng: userPos.longitude },
      nav.routeCoords
    );
    if (idx === -1) return totalMiles;
    const startToHere = polylineMiles(nav.routeCoords.slice(0, Math.max(1, idx + 1)));
    return Math.max(totalMiles - startToHere, 0);
  }, [nav, totalMiles, userPos]);

  useEffect(() => {
    lockOnUserRef.current = lockOnUser;
  }, [lockOnUser]);

  useEffect(() => {
    lastDeltaRef.current = lastRegion?.latitudeDelta;
  }, [lastRegion]);

  useEffect(() => {
    if (!nav) return;
    // Start hike session for history once navigation begins
    (async () => {
      if (hikeIdRef.current) return;
      if (!nav.routeCoords.length || totalMiles <= 0) return;
      const id = `${nav.trail.id || "nav"}-${newId()}`;
      hikeIdRef.current = id;
      startTimeRef.current = Date.now();
      await startHike({
        id,
        startedAt: Date.now(),
        trailId: nav.trail.id,
        trailName: nav.trail.name,
        distanceMi: totalMiles,
      });
    })();
    let cancelled = false;
    (async () => {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== "granted") {
        setStatus("Location permission denied. Use external navigate.");
        return;
      }
      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          distanceInterval: 5,
          timeInterval: 2000,
          mayShowUserSettings: true,
          activityType: Location.ActivityType.Fitness,
        },
        (loc) => {
          if (paused) return;
          const nextPos = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setUserPos(nextPos);
          if (lockOnUserRef.current) {
            const deltaBase = lastDeltaRef.current ?? 0.02;
            const delta = Math.max(0.008, Math.min(deltaBase, 0.025));
            mapRef.current?.animateToRegion(
              {
                latitude: nextPos.latitude,
                longitude: nextPos.longitude,
                latitudeDelta: delta,
                longitudeDelta: delta,
              },
              200
            );
          }
        }
      );
      if (cancelled) {
        sub.remove();
      } else {
        watchSub.current = sub;
      }
    })();
    return () => {
      cancelled = true;
      watchSub.current?.remove();
      watchSub.current = null;
    };
  }, [nav, paused, totalMiles]);

  // When no navigation session, still show user location on map
  useEffect(() => {
    if (nav) return;
    let cancelled = false;
    (async () => {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== "granted") {
        setStatus("Location permission denied.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      if (!cancelled) {
        setUserPos({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [nav]);

  // Optional background updates toggle
  useEffect(() => {
    if (!bgEnabled) return;
    (async () => {
      const { status: fg } = await Location.requestForegroundPermissionsAsync();
      if (fg !== "granted") {
        setStatus("Background updates need location permission.");
        setBgEnabled(false);
        return;
      }
      const { status: bg } = await Location.requestBackgroundPermissionsAsync();
      if (bg !== "granted") {
        setStatus("Background permission denied.");
        setBgEnabled(false);
        return;
      } else {
        setStatus("Background updates enabled (best effort).");
      }
    })();
  }, [bgEnabled]);

  const maybeReroute = useCallback(async () => {
    if (!nav || !userPos) return;
    if (nav.mode === "path") return;
    const now = Date.now();
    if (now - lastReroute.current < 15000) return;
    lastReroute.current = now;
    const token = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      setStatus("Mapbox token missing.");
      return;
    }
    try {
      if (offline) setStatus("Trying to reroute (online required)...");
      setStatus("Rerouting...");
      const route = await getWalkingRoute(
        { lat: userPos.latitude, lng: userPos.longitude },
        nav.destination,
        token
      );
      const coords = route.geometry.coordinates.map((c) => ({ lat: c[1], lng: c[0] }));
      const next: NavigationSession = {
        ...nav,
        start: { lat: userPos.latitude, lng: userPos.longitude },
        routeCoords: coords,
        totalDistanceMeters: route.distanceMeters,
        totalDurationSec: route.durationSec,
        steps: route.steps,
      };
      setNavigationSession(next);
      setNav(next);
      setStatus("Rerouted");
      setOffline(false);
    } catch (err) {
      const msg = String(err);
      const looksOffline =
        msg.includes("Network request failed") ||
        msg.includes("Failed to fetch") ||
        msg.includes("network");
      if (looksOffline) {
        setOffline(true);
        setStatus("Offline mode: reroute unavailable. Follow cached route.");
      } else {
        setStatus("Could not reroute. Stay on trail or open external maps.");
      }
      await logEvent(`Reroute failed: ${String(err)}`);
    }
  }, [nav, offline, userPos]);

  useEffect(() => {
    if (!nav || !userPos) return;
    const idx = nearestPointIndex(
      { lat: userPos.latitude, lng: userPos.longitude },
      nav.routeCoords
    );
    if (idx === -1) return;
    const distOff = haversineMiles(
      { lat: userPos.latitude, lng: userPos.longitude },
      nav.routeCoords[idx]
    );
    if (distOff > 0.05) {
      setOffRoute(true);
      maybeReroute();
    } else {
      setOffRoute(false);
    }
    const dest = nav.routeCoords[nav.routeCoords.length - 1];
    const distToEnd = haversineMiles({ lat: userPos.latitude, lng: userPos.longitude }, dest);
    if (remainingMiles < 0.05 || distToEnd < 0.03) {
      setArrived(true);
      setStatus("Arrived at trail end.");
    } else {
      setArrived(false);
    }
  }, [maybeReroute, nav, remainingMiles, userPos]);

  function endNav() {
    watchSub.current?.remove();
    watchSub.current = null;
    clearNavigationSession();
    setNav(null);
    setStatus(null);
    setArrived(false);
    if (hikeIdRef.current) {
      const now = Date.now();
      const start = startTimeRef.current ?? now;
      const actualTimeMin = Math.max(1, Math.round((now - start) / 60000));
      endHike({
        actualDistanceMi: traveledMiles,
        actualTimeMin,
        distanceMi: totalMiles,
      });
      hikeIdRef.current = null;
    }
    startTimeRef.current = null;
    router.back();
  }

  async function startOver() {
    watchSub.current?.remove();
    watchSub.current = null;
    await clearActiveHike();
    clearNavigationSession();
    setNav(null);
    setUserPos(null);
    setStatus(null);
    setArrived(false);
    setOffline(false);
    setOffRoute(false);
    hikeIdRef.current = null;
    startTimeRef.current = null;
    router.back();
  }

  if (!nav) {
    const region = userPos
      ? {
          latitude: userPos.latitude,
          longitude: userPos.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }
      : undefined;
    return (
      <View style={{ flex: 1 }}>
        {region ? (
          <MapView
            ref={(ref) => (mapRef.current = ref)}
            style={{ flex: 1 }}
            initialRegion={region}
            showsUserLocation
            followsUserLocation
            onRegionChangeComplete={(r) => setLastRegion(r)}
          />
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text>Requesting location…</Text>
          </View>
        )}
      <View
        style={{
          position: "absolute",
          top: insets.top + 12,
          right: 12,
          zIndex: 9,
          alignItems: "flex-end",
          gap: 8,
        }}
      >
        <Pressable
          onPress={recenterOnUser}
          accessibilityRole="button"
          accessibilityLabel="Recenter to my location"
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: "rgba(255,255,255,0.7)",
            borderWidth: 1,
            borderColor: border,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 6,
            elevation: 5,
          }}
        >
          <Text style={{ fontWeight: "700", fontSize: 18 }}>◎</Text>
        </Pressable>
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.75)",
            borderRadius: 12,
            paddingVertical: 4,
            paddingHorizontal: 6,
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 6,
            elevation: 5,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: border,
          }}
        >
          <Pressable
            onPress={() => zoom(0.5)}
            style={{ paddingVertical: 8, paddingHorizontal: 10, alignItems: "center" }}
          >
            <Text style={{ fontWeight: "700", fontSize: 16 }}>+</Text>
          </Pressable>
          <View style={{ height: 1, backgroundColor: "#e0e0e0" }} />
          <Pressable
            onPress={() => zoom(2)}
            style={{ paddingVertical: 8, paddingHorizontal: 10, alignItems: "center" }}
          >
            <Text style={{ fontWeight: "700", fontSize: 16 }}>-</Text>
          </Pressable>
          <View style={{ height: 1, backgroundColor: "#e0e0e0" }} />
          <Pressable
            onPress={recenterOnRoute}
            style={{ paddingVertical: 8, paddingHorizontal: 10, alignItems: "center" }}
          >
            <Text style={{ fontWeight: "600" }}>Route</Text>
          </Pressable>
          {offline ? (
            <>
              <View style={{ height: 1, backgroundColor: "#e0e0e0" }} />
              <Pressable
                onPress={checkOnline}
                style={{ paddingVertical: 8, paddingHorizontal: 10, alignItems: "center" }}
              >
                <Text style={{ fontWeight: "600" }}>Retry online</Text>
              </Pressable>
            </>
          ) : null}
        </View>
      </View>
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "#fff",
            padding: 16,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowOffset: { width: 0, height: -2 },
            shadowRadius: 6,
            elevation: 6,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "700" }}>Navigate</Text>
          <Text style={{ marginTop: 4, opacity: 0.8 }}>
            Get a route from a trail, then tap “Start navigation” to see turn-by-turn here.
          </Text>
          <View style={{ flexDirection: "row", marginTop: 10 }}>
            <Pressable
              onPress={() => router.back()}
              style={{ paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderRadius: 10 }}
            >
              <Text style={{ fontWeight: "600" }}>Back</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  const region = nav.routeCoords.length
    ? {
        latitude: nav.routeCoords[0].lat,
        longitude: nav.routeCoords[0].lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : undefined;

  function animateTo(region: Region) {
    setLastRegion(region);
    mapRef.current?.animateToRegion(region, 300);
  }

  function recenterOnUser() {
    if (!userPos) return;
    const delta = Math.max(0.008, Math.min(lastRegion?.latitudeDelta ?? 0.02, 0.025));
    animateTo({
      latitude: userPos.latitude,
      longitude: userPos.longitude,
      latitudeDelta: delta,
      longitudeDelta: delta,
    });
  }

  function recenterOnRoute() {
    if (nav?.routeCoords?.length) {
      const start = nav.routeCoords[0];
      animateTo({
        latitude: start.lat,
        longitude: start.lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    } else if (region) {
      animateTo(region);
    }
  }

  function zoom(factor: number) {
    const base = lastRegion || region;
    if (!base) return;
    animateTo({
      ...base,
      latitudeDelta: base.latitudeDelta * factor,
      longitudeDelta: base.longitudeDelta * factor,
    });
  }

  async function checkOnline() {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const res = await fetch("https://api.mapbox.com", { method: "HEAD", signal: controller.signal });
      clearTimeout(timer);
      if (res.ok || res.status === 401) {
        setOffline(false);
        setStatus(null);
      }
    } catch {
      // keep offline
    }
  }

  return (
    <View style={{ flex: 1 }}>
      {region && MapView ? (
        <MapView
          ref={(ref) => (mapRef.current = ref)}
          style={{ flex: 1 }}
          initialRegion={region}
          showsUserLocation={true}
          followsUserLocation={true}
          onRegionChangeComplete={(r) => setLastRegion(r)}
        >
          {nav.routeCoords.length >= 2 ? (
            <Polyline
              coordinates={nav.routeCoords.map((c) => ({ latitude: c.lat, longitude: c.lng }))}
              strokeColor="#1e6b3a"
              strokeWidth={4}
            />
          ) : null}
          {nav.destination ? (
            <Marker
              coordinate={{ latitude: nav.destination.lat, longitude: nav.destination.lng }}
              title={nav.trail.name}
            />
          ) : null}
          {nav.start ? (
            <Marker
              coordinate={{ latitude: nav.start.lat, longitude: nav.start.lng }}
              pinColor="green"
              title="Start"
            />
          ) : null}
        </MapView>
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text>Map preview is not available on this platform.</Text>
        </View>
      )}
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: insets.top + 12,
          left: 12,
          zIndex: 10,
        }}
      >
        <View
          pointerEvents="box-only"
        >
          <DrawerTrigger onPress={() => setMenuOpen(true)} />
        </View>
      </View>
      <View
        style={{
          position: "absolute",
          top: insets.top + 12,
          right: 12,
          zIndex: 9,
          alignItems: "flex-end",
          gap: 8,
        }}
      >
        <Pressable
          onPress={recenterOnUser}
          accessibilityRole="button"
          accessibilityLabel="Recenter to my location"
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: "#fff",
            borderWidth: 1,
            borderColor: border,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 6,
            elevation: 5,
          }}
        >
          <Text style={{ fontWeight: "700", fontSize: 18 }}>◎</Text>
        </Pressable>
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            padding: 6,
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 6,
            elevation: 5,
            borderWidth: 1,
            borderColor: border,
          }}
        >
          <Pressable
            onPress={() => zoom(0.5)}
            style={{ paddingVertical: 8, paddingHorizontal: 12, alignItems: "center" }}
          >
            <Text style={{ fontWeight: "700", fontSize: 16 }}>+</Text>
          </Pressable>
          <View style={{ height: 1, backgroundColor: "#e0e0e0" }} />
          <Pressable
            onPress={() => zoom(2)}
            style={{ paddingVertical: 8, paddingHorizontal: 12, alignItems: "center" }}
          >
            <Text style={{ fontWeight: "700", fontSize: 16 }}>-</Text>
          </Pressable>
          <View style={{ height: 1, backgroundColor: "#e0e0e0" }} />
          <Pressable
            onPress={recenterOnRoute}
            style={{ paddingVertical: 8, paddingHorizontal: 12, alignItems: "center" }}
          >
            <Text style={{ fontWeight: "600" }}>Route</Text>
          </Pressable>
          <View style={{ height: 1, backgroundColor: "#e0e0e0" }} />
          <Pressable
            onPress={() => setLockOnUser((v) => !v)}
            style={{ paddingVertical: 8, paddingHorizontal: 12, alignItems: "center" }}
          >
            <Text style={{ fontWeight: "600" }}>{lockOnUser ? "Lock: On" : "Lock: Off"}</Text>
          </Pressable>
          <View style={{ height: 1, backgroundColor: "#e0e0e0" }} />
          <Pressable
            onPress={() => setBgEnabled((v) => !v)}
            style={{ paddingVertical: 8, paddingHorizontal: 12, alignItems: "center" }}
          >
            <Text style={{ fontWeight: "600" }}>{bgEnabled ? "BG: On" : "BG: Off"}</Text>
          </Pressable>
        </View>
      </View>
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#fff",
          padding: 16,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowOffset: { width: 0, height: -2 },
          shadowRadius: 8,
          elevation: 8,
          borderTopWidth: 1,
          borderColor: border,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "700" }}>{nav.trail.name}</Text>
        {nav.routeCoords.length < 2 ? (
          <Text style={{ marginTop: 4, color: "#b00020" }}>
            No trail geometry loaded. Go back and fetch a route again.
          </Text>
        ) : (
          <>
            {/* Progress Bar */}
            <View style={{ marginTop: 8, height: 6, backgroundColor: "#f0f0f0", borderRadius: 3, overflow: "hidden" }}>
              <Animated.View
                style={{
                  height: "100%",
                  width: `${Math.min(100, Math.max(0, (traveledMiles / totalMiles) * 100))}%`,
                  backgroundColor: offRoute ? "#ff6b6b" : "#4CAF50",
                  borderRadius: 3,
                }}
              />
            </View>
            <Text style={{ marginTop: 8, fontSize: 16, fontWeight: "600" }}>
              {Math.round((traveledMiles / totalMiles) * 100)}% Complete
            </Text>

            {/* Distance Info */}
            <Text style={{ marginTop: 4, opacity: 0.8 }}>
              Remaining: ~{remainingMiles.toFixed(2)} mi of ~{totalMiles.toFixed(2)} mi
            </Text>

            {/* Next Step with better formatting */}
            {nextStep ? (
              <>
                <Text style={{ marginTop: 8, fontWeight: "600", color: "#2c3e50" }}>
                  📍 Next Direction:
                </Text>
                <Text style={{ marginTop: 2, fontWeight: "500", backgroundColor: "#f8f9fa", padding: 8, borderRadius: 6 }}>
                  {nextStep.instruction} ({(nextStep.distanceMeters / 1609.34).toFixed(2)} mi)
                </Text>
              </>
            ) : null}

            {/* Detailed Stats */}
            <View style={{ marginTop: 8, flexDirection: "row", justifyContent: "space-between" }}>
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 12, opacity: 0.7 }}>Covered</Text>
                <Text style={{ fontWeight: "600", marginTop: 2 }}>{traveledMiles.toFixed(2)} mi</Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 12, opacity: 0.7 }}>Remaining</Text>
                <Text style={{ fontWeight: "600", marginTop: 2 }}>{remainingMiles.toFixed(2)} mi</Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 12, opacity: 0.7 }}>Total</Text>
                <Text style={{ fontWeight: "600", marginTop: 2 }}>{totalMiles.toFixed(2)} mi</Text>
              </View>
            </View>
          </>
        )}
        {arrived ? <Text style={{ marginTop: 4, fontWeight: "700" }}>You’ve reached the end. Good job!</Text> : null}
        {status ? (
          <Text style={{ marginTop: 4, color: offRoute ? "#b00020" : "#555" }}>{status}</Text>
        ) : null}
        <View style={{ flexDirection: "row", marginTop: 12, flexWrap: "wrap" }}>
          <Pressable
            onPress={() => setPaused((p) => !p)}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              backgroundColor: paused ? "#fff7e6" : muted,
              borderWidth: 1,
              borderColor: border,
              marginRight: 10,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontWeight: "700" }}>{paused ? "Resume" : "Pause"}</Text>
          </Pressable>
          <Pressable
            onPress={endNav}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              backgroundColor: "#ffe8e8",
              borderWidth: 1,
              borderColor: "#f5b0b0",
              marginRight: 10,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontWeight: "700", color: "#b00020" }}>End</Text>
          </Pressable>
          <Pressable
            onPress={maybeReroute}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              backgroundColor: muted,
              borderWidth: 1,
              borderColor: border,
              marginRight: 10,
              marginBottom: 10,
            }}
          >
            <Text style={{ fontWeight: "700" }}>{nav.mode === "path" ? "Reroute (to trailhead)" : "Reroute"}</Text>
          </Pressable>
          <Pressable
            onPress={startOver}
            style={{
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              backgroundColor: "#f0f4ff",
              borderWidth: 1,
              borderColor: "#c8d6ff",
              marginBottom: 10,
            }}
          >
            <Text style={{ fontWeight: "700", color: "#1b4fa0" }}>Start over</Text>
          </Pressable>
        </View>
        {offline ? (
          <Text style={{ marginTop: 6, color: "#b00020" }}>
            Offline: reroute disabled, using cached route. Try again when back online.
          </Text>
        ) : null}
        <ScrollView style={{ maxHeight: 140, marginTop: 6 }}>
          {nav.steps.slice(0, 8).map((s, i) => (
            <Text key={i} style={{ opacity: 0.8, marginTop: 2 }}>
              • {s.instruction} ({(s.distanceMeters / 1609.34).toFixed(2)} mi)
            </Text>
          ))}
        </ScrollView>
      </View>
      <SideDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}
