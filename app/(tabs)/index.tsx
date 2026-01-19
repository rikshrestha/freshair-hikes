import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import OnboardingScreen from "../../src/screens/OnboardingScreen";
import { loadProfile } from "../../src/storage/profile";

export default function HomeScreen() {
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    (async () => {
      const profile = await loadProfile();
      setOnboarded(!!profile);
      setReady(true);
    })();
  }, []);

  if (!ready) return null;

  if (!onboarded) {
    return <OnboardingScreen onDone={() => setOnboarded(true)} />;
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 22 }}>Today Plan (next)</Text>
    </View>
  );
}

