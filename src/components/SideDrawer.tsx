import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";

const MENU_ITEMS = [
  { label: "Home", route: "/(tabs)/index" },
  { label: "Saved", route: "/saved" },
  { label: "Profile", route: "/(tabs)/profile" },
  { label: "About", route: "/about" },
  { label: "Contact", route: "/contact" },
];

export function DrawerTrigger({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Open menu"
      style={{
        padding: 8,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: "700" }}>≡</Text>
    </Pressable>
  );
}

export default function SideDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const menuAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(menuAnim, {
      toValue: open ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [open, menuAnim]);

  const translate = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-260, 0],
  });

  return (
    <View
      pointerEvents={open ? "auto" : "none"}
      style={[StyleSheet.absoluteFillObject, { zIndex: 1000 }]}
    >
      <Animated.View
        style={[styles.overlay, { opacity: menuAnim }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View
        style={[
          styles.drawer,
          { transform: [{ translateX: translate }], opacity: menuAnim },
        ]}
      >
        <SafeAreaView style={styles.safeArea}>
          <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 12, paddingLeft: 8 }}>Menu</Text>
          {MENU_ITEMS.map((item) => (
            <Pressable
              key={item.route}
              onPress={() => {
                onClose();
                router.push(item.route as never);
              }}
              style={styles.menuItem}
            >
              <Text style={{ fontSize: 16 }}>{item.label}</Text>
            </Pressable>
          ))}
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 260,
    backgroundColor: "#fff",
    borderRightWidth: 1,
    borderColor: "#e2e2e2",
    zIndex: 1001,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 32,
    paddingBottom: 28,
  },
  menuItem: {
    paddingVertical: 12,
    paddingLeft: 12,
  },
});
