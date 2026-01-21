import React, { useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Divider } from "@/components/ui/divider";
import { EmptyState } from "@/components/ui/empty-state";
import { IconButton } from "@/components/ui/icon-button";
import { ListRow } from "@/components/ui/list-row";
import SideDrawer, { DrawerTrigger } from "@/src/components/SideDrawer";
import { useAppTheme } from "@/hooks/use-app-theme";
import { getTrails } from "@/src/data/trailStore";
import { listRegions, RegionId } from "@/src/data/regions";
import { Trail } from "@/src/logic/recommend";
import { NavigationSession, setNavigationSession } from "@/src/state/navigationSession";
import { loadFavorites } from "@/src/storage/favorites";
import { getRegion, setRegion as persistRegion } from "@/src/storage/region";
import { polylineMiles } from "@/src/utils/geo";
import { useRouter } from "expo-router";

type TrailWithDistance = Trail & { distanceFromUser?: number };

export default function ExploreWeb() {
  const { colors, spacing, typography } = useAppTheme();
  const router = useRouter();
  const regions = useMemo(() => listRegions(), []);
  const [regionId, setRegionId] = useState<RegionId>("dfw");
  const [trails, setTrails] = useState<TrailWithDistance[]>([]);
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<"all" | Trail["difficulty"]>("all");
  const [distance, setDistance] = useState<"any" | "short" | "medium" | "long">("any");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showSaved, setShowSaved] = useState(false);
  const [limit, setLimit] = useState(20);
  const [menuOpen, setMenuOpen] = useState(false);

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
      await persistRegion(regionId);
    })();
  }, [regionId]);

  useEffect(() => {
    setLimit(20);
  }, [difficulty, distance, query, showSaved, favorites]);

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
      .slice(0, limit);
  }, [difficulty, distance, favorites, limit, query, showSaved, trails]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.lg, paddingTop: spacing.xl }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.sm }}>
          <DrawerTrigger onPress={() => setMenuOpen(true)} />
          <Text style={[typography.headline, { marginLeft: spacing.xs }]}>Explore trails</Text>
        </View>
        <Text style={[typography.body, { color: colors.textMuted }]}>
          Map preview not available on web; browse trails below.
        </Text>
      </View>

      <View style={{ paddingHorizontal: spacing.lg }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.sm }}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search trails"
            placeholderTextColor={colors.textMuted}
            style={styles.search}
          />
          <IconButton
            accessibilityLabel="Clear search"
            variant="ghost"
            size="md"
            onPress={() => setQuery("")}
            style={{ marginLeft: spacing.sm }}
            icon={<Text style={[typography.bodyStrong, { color: colors.text }]}>✕</Text>}
          />
        </View>

        <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm }}>
          {regions.map((r) => (
            <Chip key={r.id} label={r.label} selected={regionId === r.id} onPress={() => setRegionId(r.id)} />
          ))}
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.sm }}>
          <Chip label="All" selected={difficulty === "all"} onPress={() => setDifficulty("all")} />
          <Chip label="Easy" selected={difficulty === "Easy"} onPress={() => setDifficulty("Easy")} />
          <Chip label="Moderate" selected={difficulty === "Moderate"} onPress={() => setDifficulty("Moderate")} />
          <Chip label="Strenuous" selected={difficulty === "Strenuous"} onPress={() => setDifficulty("Strenuous")} />
          <Chip label="Any distance" selected={distance === "any"} onPress={() => setDistance("any")} />
          <Chip label="Short (<3 mi)" selected={distance === "short"} onPress={() => setDistance("short")} />
          <Chip label="Medium (3-6 mi)" selected={distance === "medium"} onPress={() => setDistance("medium")} />
          <Chip label="Long (>6 mi)" selected={distance === "long"} onPress={() => setDistance("long")} />
          <Chip
            label="Saved"
            selected={showSaved}
            onPress={() => setShowSaved((v) => !v)}
            trailing={<Text style={[typography.caption, { color: colors.textMuted }]}>{favorites.size}</Text>}
          />
        </View>

        <Divider style={{ marginBottom: spacing.md }} />
      </View>

        <View style={{ flex: 1, paddingHorizontal: spacing.lg }}>
          {filtered.length === 0 ? (
            <EmptyState
              title="No trails match"
              description="Try adjusting search or filters."
              primaryAction={{ label: "Clear filters", onPress: () => setQuery("") }}
            />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ListRow
                  title={item.name}
                  subtitle={`${item.difficulty} • ${item.distanceMi} mi • ~${item.estTimeMin} min`}
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
                          onPress={() => setNavigationSession(buildSession(item))}
                        />
                      ) : null}
                    </View>
                  }
                />
              )}
              ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
            contentContainerStyle={{ paddingBottom: spacing.lg }}
          />
        )}
      </View>
      <SideDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );

  function buildSession(item: Trail): NavigationSession {
    const distanceMi = item.path ? polylineMiles(item.path) : item.distanceMi;
    return {
      mode: item.path && item.path.length > 1 ? "path" : "directions",
      trail: item,
      start: item.path?.[0] ?? { lat: item.lat ?? 0, lng: item.lng ?? 0 },
      destination: item.path?.[item.path.length - 1] ?? { lat: item.lat ?? 0, lng: item.lng ?? 0 },
      routeCoords: item.path ?? [],
      totalDistanceMeters: distanceMi * 1609.34,
      totalDurationSec: item.estTimeMin * 60,
      steps: [],
    };
  }
}

const styles = StyleSheet.create({
  search: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
