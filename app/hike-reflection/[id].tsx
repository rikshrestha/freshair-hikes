import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, Pressable, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { HikeSession, loadHikes, saveHikeReflection } from "../../src/storage/hikes";
import SideDrawer, { DrawerTrigger } from "../../src/components/SideDrawer";

const TAGS = ["sunset", "kids", "dog", "crowded", "windy", "muddy"];

function NumberRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (next: number) => void;
}) {
  return (
    <View style={{ marginTop: 16 }}>
      <Text style={{ fontWeight: "600" }}>{label}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
          <Pressable
            key={num}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 10,
              borderWidth: 1,
              marginRight: 8,
              marginBottom: 8,
              backgroundColor: value === num ? "#e6f3ea" : "transparent",
            }}
            onPress={() => onChange(num)}
          >
            <Text style={{ fontWeight: value === num ? "600" : "400" }}>{num}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function ReflectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [hike, setHike] = useState<HikeSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [effort, setEffort] = useState<number | null>(null);
  const [enjoyment, setEnjoyment] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const list = await loadHikes();
      const match = list.find((item) => item.id === id) ?? null;
      setHike(match);
      setEffort(match?.effort ?? null);
      setEnjoyment(match?.enjoyment ?? null);
      setTags(match?.tags ?? []);
      setNotes(match?.notes ?? "");
      setLoading(false);
    })();
  }, [id]);

  const canSave = useMemo(() => effort !== null && enjoyment !== null, [effort, enjoyment]);

  async function handleSave() {
    if (!id || !canSave) return;
    setSaving(true);
    await saveHikeReflection(id, {
      effort: effort ?? undefined,
      enjoyment: enjoyment ?? undefined,
      tags,
      notes: notes.trim() || undefined,
    });
    setSaving(false);
    router.back();
  }

  if (loading) {
    return (
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
        <Text>Loading...</Text>
      </ScrollView>
    );
  }

  if (!hike) {
    return (
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
        <Text style={{ opacity: 0.8 }}>Hike not found. It may have been cleared.</Text>
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 32 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
          <DrawerTrigger onPress={() => setMenuOpen(true)} />
          <View>
            <Text style={{ fontSize: 26, fontWeight: "700", marginLeft: 6 }}>Reflection</Text>
            <Text style={{ marginTop: 2, opacity: 0.8 }}>
              {hike.trailName ?? "Hike session"}
            </Text>
          </View>
        </View>

      <NumberRow label="Effort (1-10)" value={effort} onChange={setEffort} />
      <NumberRow label="Enjoyment (1-10)" value={enjoyment} onChange={setEnjoyment} />

      <View style={{ marginTop: 16 }}>
        <Text style={{ fontWeight: "600" }}>Tags (optional)</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
          {TAGS.map((tag) => {
            const selected = tags.includes(tag);
            return (
              <Pressable
                key={tag}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  marginRight: 8,
                  marginBottom: 8,
                  backgroundColor: selected ? "#e6f3ea" : "transparent",
                }}
                onPress={() => {
                  setTags((prev) =>
                    prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                  );
                }}
              >
                <Text style={{ fontWeight: selected ? "600" : "400" }}>{tag}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ marginTop: 16 }}>
        <Text style={{ fontWeight: "600" }}>Notes (optional)</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Anything you want to remember?"
          multiline
          style={{
            marginTop: 8,
            borderWidth: 1,
            borderRadius: 10,
            padding: 12,
            minHeight: 90,
            textAlignVertical: "top",
          }}
        />
      </View>

        <Pressable
          style={{
            marginTop: 20,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 10,
            borderWidth: 1,
            alignSelf: "flex-start",
            opacity: canSave ? 1 : 0.4,
          }}
          onPress={handleSave}
          disabled={!canSave || saving}
        >
          <Text style={{ fontWeight: "600" }}>
            {saving ? "Saving..." : "Save reflection"}
          </Text>
        </Pressable>
      </ScrollView>
      <SideDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}
