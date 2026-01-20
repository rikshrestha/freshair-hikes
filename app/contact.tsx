import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import SideDrawer, { DrawerTrigger } from "../src/components/SideDrawer";

export default function ContactScreen() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 32 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
          <DrawerTrigger onPress={() => setMenuOpen(true)} />
          <Text style={{ fontSize: 26, fontWeight: "700", marginLeft: 6 }}>Contact</Text>
        </View>
      <Text style={{ marginTop: 6, opacity: 0.8 }}>
        Questions, feedback, or ideas? We’d love to hear from you.
      </Text>
      <View style={{ marginTop: 16 }}>
        <Text style={{ fontWeight: "600" }}>Email</Text>
        <Text style={{ marginTop: 6, opacity: 0.8 }}>hello@freshairhikes.app</Text>
      </View>
      </ScrollView>
      <SideDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}
