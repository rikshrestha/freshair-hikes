import { Text, View } from "react-native";

export default function NavigationWeb() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>Navigation</Text>
      <Text style={{ opacity: 0.8, textAlign: "center" }}>
        Map-based navigation is not available on web. Please use the iOS/Android app to start navigation.
      </Text>
    </View>
  );
}
