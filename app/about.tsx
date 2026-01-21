import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SideDrawer, { DrawerTrigger } from "../src/components/SideDrawer";

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: insets.top + 16, paddingBottom: 32 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
          <DrawerTrigger onPress={() => setMenuOpen(true)} />
          <Text style={{ fontSize: 26, fontWeight: "700", marginLeft: 6 }}>About FreshAir Hikes</Text>
        </View>
      <Text style={{ marginTop: 6, opacity: 0.8 }}>
        FreshAir Hikes helps you ease into hiking with personalized recommendations, simple tracking, and quick reflections.
      </Text>
      <View style={{ marginTop: 16 }}>
        <Text style={{ fontWeight: "600" }}>Why</Text>
        <Text style={{ marginTop: 6, opacity: 0.8 }}>
          We focus on beginner-friendly pacing, safety tips, and keeping your hikes enjoyable—without the clutter of heavy apps.
        </Text>
      </View>
      </ScrollView>
      <SideDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}
