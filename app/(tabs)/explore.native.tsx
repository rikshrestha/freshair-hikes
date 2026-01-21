import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  PanResponder,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  Animated,
  useWindowDimensions,
  View,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Divider } from "@/components/ui/divider";
import { EmptyState } from "@/components/ui/empty-state";
import { IconButton } from "@/components/ui/icon-button";
import { ListRow } from "@/components/ui/list-row";
import { SectionHeader } from "@/components/ui/section-header";
import SideDrawer, { DrawerTrigger } from "@/src/components/SideDrawer";
import { useAppTheme } from "@/hooks/use-app-theme";
import { getTrails } from "@/src/data/trailStore";
import { getRegionConfig, listRegions, RegionId } from "@/src/data/regions";
import { Trail } from "@/src/logic/recommend";
import { haversineMiles, LatLng, polylineMiles } from "@/src/utils/geo";
import { NavigationSession, setNavigationSession } from "@/src/state/navigationSession";
import { loadFavorites } from "@/src/storage/favorites";
import { getRegion, setRegion as persistRegion } from "@/src/storage/region";
import { logEvent } from "@/src/utils/logger";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

type TrailWithDistance = Trail & { distanceFromUser?: number };

export default function ExploreScreen() {
  const router = useRouter();
  const { colors, spacing, radii, typography, shadows } = useAppTheme();
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const regions = useMemo(() => listRegions(), []);
  const [regionId, setRegionId] = useState<RegionId>("dfw");
  const [trails, setTrails] = useState<TrailWithDistance[]>([]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [region, setRegion] = useState<Region | undefined>();
  const [userCoords, setUserCoords] = useState<LatLng | null>(null);
  const [difficulty, setDifficulty] = useState<"all" | Trail["difficulty"]>("all");
  const [distance, setDistance] = useState<"any" | "short" | "medium" | "long">("any");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showSaved, setShowSaved] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [locStatus, setLocStatus] = useState<string | null>(null);
  const [locBusy, setLocBusy] = useState(false);
  const [limit, setLimit] = useState(20);
  const listRef = useRef<FlatList<TrailWithDistance>>(null);
  const mapRef = useRef<MapView | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const collapsedHeight = Math.min(screenHeight * 0.19, 220);
  const expandedHeight = Math.min(screenHeight * 0.75, 620);
  const sheetHeight = useRef(new Animated.Value(collapsedHeight)).current;
  const sheetHeightValue = useRef(collapsedHeight);
  const sheetStartValue = useRef(collapsedHeight);
  const collapsedFlag = useRef(true);

  useEffect(() => {
    const id = sheetHeight.addListener(({ value }) => {
      sheetHeightValue.current = value;
      const nextCollapsed = value <= collapsedHeight + 12;
      if (nextCollapsed !== collapsedFlag.current) {
        collapsedFlag.current = nextCollapsed;
        setIsCollapsed(nextCollapsed);
      }
    });
    return () => sheetHeight.removeListener(id);
  }, [collapsedHeight, sheetHeight]);

  const animateSheet = (toValue: number) => {
    Animated.spring(sheetHeight, {
      toValue,
      useNativeDriver: false,
      damping: 22,
      stiffness: 260,
    }).start();
  };

  const toggleSheet = () => {
    const target = sheetHeightValue.current > (collapsedHeight + expandedHeight) / 2 ? collapsedHeight : expandedHeight;
    animateSheet(target);
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 6,
      onPanResponderGrant: () => {
        sheetStartValue.current = sheetHeightValue.current;
      },
      onPanResponderMove: (_, gesture) => {
        const next = sheetStartValue.current - gesture.dy;
        const clamped = Math.max(collapsedHeight, Math.min(expandedHeight, next));
        sheetHeight.setValue(clamped);
      },
      onPanResponderRelease: (_, gesture) => {
        const shouldExpand =
          gesture.vy < -0.5 || sheetHeightValue.current > (collapsedHeight + expandedHeight) / 2;
        animateSheet(shouldExpand ? expandedHeight : collapsedHeight);
      },
    })
  ).current;

  useEffect(() => {
    (async () => {
      const savedRegion = await getRegion();
      setRegionId(savedRegion);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const list = await getTrails(regionId);
      setTrails(list);
      setFavorites(await loadFavorites());
      const center = getRegionConfig(regionId).center;
      setRegion({
        latitude: center.lat,
        longitude: center.lng,
        latitudeDelta: 0.2,
        longitudeDelta: 0.2,
      });
      await persistRegion(regionId);
    })();
  }, [regionId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return trails
      .filter((t) => {
        if (q && !t.name.toLowerCase().includes(q)) return false;
        if (difficulty !== "all" && t.difficulty !== difficulty) return false;
        if (distance === "short" && t.distanceMi > 3) return false;
        if (distance === "medium" && (t.distanceMi < 3 || t.distanceMi > 6)) return false;
        if (distance === "long" && t.distanceMi <= 6) return false;
        if (showSaved && !favorites.has(t.id)) return false;
        return true;
      })
      .map((t) =>
        userCoords && t.lat !== undefined && t.lng !== undefined
          ? {
              ...t,
              distanceFromUser: haversineMiles(userCoords, { lat: t.lat, lng: t.lng }),
            }
          : t
      )
      .sort((a, b) => (a.distanceFromUser ?? Number.MAX_VALUE) - (b.distanceFromUser ?? Number.MAX_VALUE));
  }, [difficulty, distance, favorites, query, showSaved, trails, userCoords]);

  useEffect(() => {
    setLimit(20);
  }, [difficulty, distance, query, showSaved, favorites]);

  const visibleTrails = useMemo(() => filtered.slice(0, limit), [filtered, limit]);

  const recenterToUser = useCallback(async () => {
    if (!userCoords) {
      setLocBusy(true);
      setLocStatus("Requesting location...");
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocStatus("Location permission denied. Sorting without location.");
        setLocBusy(false);
        await logEvent("Explore recenter denied");
        return;
      }
      try {
        const pos = await Location.getCurrentPositionAsync({});
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        setLocStatus("Using your location.");
        mapRef.current?.animateToRegion(
          {
            latitude: coords.lat,
            longitude: coords.lng,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
          },
          250
        );
      } catch (err) {
        setLocStatus("Could not get location. Try again.");
        await logEvent(`Explore recenter failed: ${String(err)}`);
      } finally {
        setLocBusy(false);
      }
      return;
    }

    mapRef.current?.animateToRegion(
      {
        latitude: userCoords.lat,
        longitude: userCoords.lng,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      },
      250
    );
  }, [userCoords]);

  const mapRegion: Region =
    region ??
    ({
      latitude: 37.7749,
      longitude: -122.4194,
      latitudeDelta: 0.3,
      longitudeDelta: 0.3,
    } satisfies Region);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {MapView ? (
        <MapView
          ref={(ref) => (mapRef.current = ref)}
          style={{ flex: 1 }}
          initialRegion={mapRegion}
          onRegionChangeComplete={(r: Region) => setRegion(r)}
          showsUserLocation
          showsMyLocationButton={false}
        >
          {visibleTrails.map((t, index) =>
            t.lat !== undefined && t.lng !== undefined ? (
              <Marker
                key={t.id}
                coordinate={{ latitude: t.lat, longitude: t.lng }}
                title={t.name}
                pinColor={t.id === selectedId ? colors.primary : undefined}
                onPress={() => {
                  setSelectedId(t.id);
                  try {
                    listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.3 });
                  } catch {
                    // ignore if list not measured yet
                  }
                }}
              />
            ) : null
          )}
        </MapView>
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg }}>
          <Text style={[typography.body, { color: colors.text }]}>
            Map preview is not available on this platform. Use the list below.
          </Text>
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
        <Pressable
          onPress={() => setMenuOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
          hitSlop={12}
        >
          <DrawerTrigger onPress={() => setMenuOpen(true)} />
        </Pressable>
      </View>

      <Animated.View
        style={[
          styles.sheet,
          {
            height: sheetHeight,
            backgroundColor: colors.surface,
            borderTopLeftRadius: radii.xl,
            borderTopRightRadius: radii.xl,
            padding: spacing.lg,
            shadowColor: shadows.card.shadowColor,
            shadowOpacity: shadows.card.shadowOpacity,
            shadowRadius: shadows.card.shadowRadius,
            shadowOffset: shadows.card.shadowOffset,
            elevation: shadows.card.elevation,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Toggle trail list panel"
          onPress={toggleSheet}
          style={{
            width: 48,
            height: 12,
            borderRadius: 999,
            alignSelf: "center",
            backgroundColor: colors.border,
            marginBottom: spacing.md,
          }}
        />
        <SectionHeader title="Explore trails" subtitle="Map-first discovery with search" />
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: spacing.md, marginBottom: spacing.sm }}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search trails"
            placeholderTextColor={colors.textMuted}
            style={{
              flex: 1,
              backgroundColor: colors.surfaceMuted,
              borderRadius: radii.lg,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.border,
              color: colors.text,
            }}
          />
          <IconButton
            accessibilityLabel="Clear search"
            variant="ghost"
            size="md"
            onPress={() => setQuery("")}
            style={{ marginLeft: spacing.sm }}
            icon={<Text style={[typography.bodyStrong, { color: colors.text }]}>✕</Text>}
          />
          <Button
            title={showFilters ? "Hide filters" : "Filters"}
            size="md"
            variant="secondary"
            onPress={() => setShowFilters((v) => !v)}
            style={{ marginLeft: spacing.sm }}
          />
        </View>

        <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm }}>
          {regions.map((r) => (
            <Chip
              key={r.id}
              label={r.label}
              selected={regionId === r.id}
              onPress={() => setRegionId(r.id)}
            />
          ))}
        </View>

        {showFilters ? (
          <>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.sm }}>
              <Chip label="All" selected={difficulty === "all"} onPress={() => setDifficulty("all")} />
              <Chip label="Easy" selected={difficulty === "Easy"} onPress={() => setDifficulty("Easy")} />
              <Chip
                label="Moderate"
                selected={difficulty === "Moderate"}
                onPress={() => setDifficulty("Moderate")}
              />
              <Chip
                label="Strenuous"
                selected={difficulty === "Strenuous"}
                onPress={() => setDifficulty("Strenuous")}
              />
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.sm }}>
              <Chip label="Any distance" selected={distance === "any"} onPress={() => setDistance("any")} />
              <Chip label="Short (<3 mi)" selected={distance === "short"} onPress={() => setDistance("short")} />
              <Chip
                label="Medium (3-6 mi)"
                selected={distance === "medium"}
                onPress={() => setDistance("medium")}
              />
              <Chip label="Long (>6 mi)" selected={distance === "long"} onPress={() => setDistance("long")} />
              <Chip
                label="Saved"
                selected={showSaved}
                onPress={() => setShowSaved((v) => !v)}
                trailing={<Text style={[typography.caption, { color: colors.textMuted }]}>{favorites.size}</Text>}
              />
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm }}>
              <Button
                title={locBusy ? "Locating..." : "Use my location"}
                variant="secondary"
                size="md"
                disabled={locBusy}
                onPress={async () => {
                  setLocBusy(true);
                  setLocStatus("Requesting location...");
                  const { status } = await Location.requestForegroundPermissionsAsync();
                  if (status !== "granted") {
                    setLocStatus("Location permission denied. Sorting without location.");
                    setLocBusy(false);
                    await logEvent("Explore location denied");
                    return;
                  }
                  try {
                    const pos = await Location.getCurrentPositionAsync({});
                    setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setLocStatus("Sorting by nearest trails.");
                  } catch (err) {
                    setLocStatus("Could not get location. Try again.");
                    await logEvent(`Explore location failed: ${String(err)}`);
                  } finally {
                    setLocBusy(false);
                  }
                }}
              />
              <Button
                title="Clear filters"
                variant="ghost"
                size="md"
                onPress={() => {
                  setDifficulty("all");
                  setDistance("any");
                  setShowSaved(false);
                  setQuery("");
                }}
              />
            </View>
            {locStatus ? (
              <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.sm }]}>
                {locStatus}
              </Text>
            ) : null}
          </>
        ) : null}

        <Divider style={{ marginBottom: spacing.md }} />

        {!isCollapsed ? (
          <>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm }}>
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                Showing {visibleTrails.length} of {filtered.length} trails
              </Text>
              {visibleTrails.length < filtered.length ? (
                <Button title="Show more" variant="ghost" onPress={() => setLimit((v) => v + 20)} />
              ) : null}
            </View>

            {visibleTrails.length === 0 ? (
              <EmptyState
                title="No trails match"
                description="Try adjusting search or filters."
                primaryAction={{ label: "Clear filters", onPress: () => setQuery("") }}
              />
            ) : (
              <FlatList
                ref={listRef}
                data={visibleTrails}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <ListRow
                    title={item.name}
                    subtitle={`${item.difficulty} • ${item.distanceMi} mi • ~${item.estTimeMin} min`}
                    meta={item.distanceFromUser ? `${item.distanceFromUser.toFixed(1)} mi` : undefined}
                    onPress={() => {
                      setSelectedId(item.id);
                      if (item.lat && item.lng) {
                        setRegion({
                          latitude: item.lat,
                          longitude: item.lng,
                          latitudeDelta: 0.08,
                          longitudeDelta: 0.08,
                        });
                      }
                    }}
                    rightAccessory={
                      <View style={{ flexDirection: "row", gap: spacing.sm }}>
                        <Button
                          title="Details"
                          size="md"
                          variant="secondary"
                          onPress={() => router.push(`/trail/${item.id}`)}
                        />
                        {item.path && item.path.length > 1 ? (
                          <Button
                            title="Start"
                            size="md"
                            onPress={() => {
                              const distanceMi = item.path ? polylineMiles(item.path) : item.distanceMi;
                              const session: NavigationSession = {
                                mode: "path",
                                trail: item,
                                start: item.path[0],
                                destination: item.path[item.path.length - 1],
                                routeCoords: item.path,
                                totalDistanceMeters: distanceMi * 1609.34,
                                totalDurationSec: item.estTimeMin * 60,
                                steps: [],
                              };
                              setNavigationSession(session);
                              router.push("/navigation");
                            }}
                          />
                        ) : null}
                      </View>
                    }
                  />
                )}
                ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
                contentContainerStyle={{ paddingBottom: spacing.lg }}
                getItemLayout={(_, index) => ({ length: 84, offset: 84 * index, index })}
              />
            )}
          </>
        ) : null}
      </Animated.View>
      <Pressable
        onPress={recenterToUser}
        accessibilityRole="button"
        accessibilityLabel="Recenter to my location"
        disabled={locBusy}
        style={{
          position: "absolute",
          top: Math.max(insets.top + 12, 60),
          right: 12,
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: "rgba(255,255,255,0.7)",
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9,
          opacity: locBusy ? 0.6 : 1,
          shadowColor: shadows.card.shadowColor,
          shadowOpacity: shadows.card.shadowOpacity,
          shadowRadius: shadows.card.shadowRadius,
          shadowOffset: shadows.card.shadowOffset,
          elevation: shadows.card.elevation,
        }}
      >
        <Text style={[typography.bodyStrong, { color: colors.text }]}>◎</Text>
      </Pressable>
      <SideDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
});
