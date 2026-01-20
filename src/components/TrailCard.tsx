import { Pressable, Text, View } from "react-native";
import { Trail } from "../logic/recommend";

type Props = {
  trail: Trail & { distanceFromUser?: number };
  onSelect?: () => void;
  onLongPress?: () => void;
  onToggleFavorite?: () => void;
  selected?: boolean;
  disabled?: boolean;
  showSource?: boolean;
  showWhy?: boolean;
  showLongPressHint?: boolean;
  isFavorite?: boolean;
};

export default function TrailCard({
  trail,
  onSelect,
  onLongPress,
  onToggleFavorite,
  selected = false,
  disabled = false,
  showSource = true,
  showWhy = true,
  showLongPressHint = false,
  isFavorite = false,
}: Props) {
  const canNavigate = trail.lat !== undefined && trail.lng !== undefined;

  return (
    <Pressable
      onPress={onSelect}
      onLongPress={onLongPress}
      delayLongPress={300}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${trail.name}, ${trail.difficulty} trail${isFavorite ? ", saved" : ""}`}
      style={{
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        backgroundColor: "#fff",
        opacity: disabled ? 0.6 : 1,
        borderColor: selected ? "#2f5a3b" : "#000",
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 18, fontWeight: "600", flex: 1 }}>{trail.name}</Text>
        {onToggleFavorite ? (
          <Pressable onPress={onToggleFavorite} hitSlop={8} style={{ paddingLeft: 8 }}>
            <Text style={{ fontSize: 18 }}>{isFavorite ? "★" : "☆"}</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={{ marginTop: 4, opacity: 0.8 }}>
        {trail.difficulty} • {trail.distanceMi} mi • ~{trail.estTimeMin} min
      </Text>
      {showSource && trail.source ? (
        <Text style={{ marginTop: 6, opacity: 0.8 }}>Source: {trail.source}</Text>
      ) : null}
      {trail.distanceFromUser !== undefined ? (
        <Text style={{ marginTop: 4, opacity: 0.8 }}>
          ~{trail.distanceFromUser.toFixed(2)} mi from you
        </Text>
      ) : null}
      {showWhy && trail.why ? (
        <Text style={{ marginTop: 6, opacity: 0.8 }}>{trail.why}</Text>
      ) : null}
      {showLongPressHint && onLongPress ? (
        <Text style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
          Long press for details
        </Text>
      ) : null}
    </Pressable>
  );
}
