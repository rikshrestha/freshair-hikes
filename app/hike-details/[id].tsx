import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { HikeSession, loadHikes } from "../../src/storage/hikes";

function formatDate(ms: number) {
  return new Date(ms).toLocaleString();
}

export default function HikeDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [hike, setHike] = useState<HikeSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const list = await loadHikes();
      const match = list.find((item) => item.id === id) ?? null;
      setHike(match);
      setLoading(false);
    })();
  }, [id]);

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 32 }}>
      <Text style={{ fontSize: 26, fontWeight: "700" }}>Hike Details</Text>

      {loading ? (
        <Text style={{ marginTop: 12 }}>Loading...</Text>
      ) : !hike ? (
        <Text style={{ marginTop: 12, opacity: 0.8 }}>
          Hike not found. It may have been cleared.
        </Text>
      ) : (
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: "600" }}>
            {hike.trailName ?? "Hike session"}
          </Text>
          <Text style={{ marginTop: 8, opacity: 0.8 }}>
            Started: {formatDate(hike.startedAt)}
          </Text>
          <Text style={{ marginTop: 4, opacity: 0.8 }}>
            Ended: {formatDate(hike.endedAt)}
          </Text>
          <Text style={{ marginTop: 4, opacity: 0.8 }}>
            Duration: {hike.durationMin} min
          </Text>
          {hike.distanceMi ? (
            <Text style={{ marginTop: 4, opacity: 0.8 }}>
              Distance: {hike.distanceMi} mi
            </Text>
          ) : null}
          {hike.trailId ? (
            <Text style={{ marginTop: 4, opacity: 0.8 }}>
              Trail ID: {hike.trailId}
            </Text>
          ) : null}
          <View style={{ marginTop: 16 }}>
            <Text style={{ fontWeight: "600" }}>Reflection</Text>
            {hike.effort || hike.enjoyment || (hike.tags && hike.tags.length) || hike.notes ? (
              <>
                {hike.effort ? (
                  <Text style={{ marginTop: 6, opacity: 0.8 }}>
                    Effort: {hike.effort}/10
                  </Text>
                ) : null}
                {hike.enjoyment ? (
                  <Text style={{ marginTop: 4, opacity: 0.8 }}>
                    Enjoyment: {hike.enjoyment}/10
                  </Text>
                ) : null}
                {hike.tags && hike.tags.length ? (
                  <Text style={{ marginTop: 4, opacity: 0.8 }}>
                    Tags: {hike.tags.join(", ")}
                  </Text>
                ) : null}
                {hike.notes ? (
                  <Text style={{ marginTop: 4, opacity: 0.8 }}>
                    Notes: {hike.notes}
                  </Text>
                ) : null}
              </>
            ) : (
              <Text style={{ marginTop: 6, opacity: 0.8 }}>
                No reflection saved yet.
              </Text>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}
