import { ScrollView, Text, View } from "react-native";

const tips = [
  { title: "Safety basics", body: "Tell someone your route, check weather, carry a charged phone and a map." },
  { title: "Water", body: "Aim for ~0.5 liters per hour in cool weather, more in heat. Bring a filter for longer hikes." },
  { title: "Layers", body: "Wear moisture-wicking base layers, an insulating mid-layer, and a wind/rain shell." },
  { title: "Footwear", body: "Choose trail shoes or boots with grip. Pack blister care (tape, bandages)." },
  { title: "Sun & bugs", body: "Sunscreen, hat, sunglasses. Carry repellent where bugs are active." },
  { title: "Trail etiquette", body: "Yield to uphill hikers, stay on trail, pack out trash, keep dogs leashed where required." },
  { title: "Pacing", body: "Start easy for 10–15 minutes, then settle into a steady pace. Snack every 45–60 minutes." },
  { title: "Navigation", body: "Download offline maps, know key trail junctions, and keep a small paper map as backup." },
];

export default function GuideScreen() {
  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 32 }}>
      <Text style={{ fontSize: 26, fontWeight: "700" }}>Trail Guide</Text>
      <Text style={{ marginTop: 6, marginBottom: 12, opacity: 0.8 }}>
        Quick tips for safer, smoother hikes.
      </Text>
      {tips.map((tip) => (
        <View
          key={tip.title}
          style={{
            borderWidth: 1,
            borderRadius: 12,
            padding: 14,
            marginBottom: 12,
            backgroundColor: "#f8fbf8",
          }}
        >
          <Text style={{ fontWeight: "700", fontSize: 16 }}>{tip.title}</Text>
          <Text style={{ marginTop: 6, opacity: 0.85 }}>{tip.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
