import { Text, View } from "react-native";

export default function HistoryWeb() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 8 }}>History</Text>
      <Text style={{ opacity: 0.8, textAlign: "center" }}>
        History is available in the native app. Web view is read-only for now.
      </Text>
    </View>
  );
}
