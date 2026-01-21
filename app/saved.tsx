import { useEffect, useMemo, useState } from "react";
import { FlatList, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import SideDrawer, { DrawerTrigger } from "../src/components/SideDrawer";
import TrailCard from "../src/components/TrailCard";
import { getTrails } from "../src/data/trailStore";
import { loadFavorites, toggleFavorite } from "../src/storage/favorites";
import { Trail } from "../src/logic/recommend";

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const [trails, setTrails] = useState<Trail[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const list = await getTrails();
      const favs = await loadFavorites();
      setFavorites(favs);
      setTrails(list);
    })();
  }, []);

  const saved = useMemo(
    () => trails.filter((t) => favorites.has(t.id)),
    [trails, favorites]
  );

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: insets.top + 16,
          paddingBottom: 12,
        }}
      >
        <DrawerTrigger onPress={() => setMenuOpen(true)} />
        <Text style={{ fontSize: 26, fontWeight: "700", marginLeft: 6 }}>Saved Trails</Text>
      </View>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 20 }}>
        {saved.length === 0 ? (
          <Text style={{ opacity: 0.8 }}>No saved trails yet. Tap the star to save a trail.</Text>
        ) : (
          <FlatList
            data={saved}
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
          />
        )}
      </View>
      <SideDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}
