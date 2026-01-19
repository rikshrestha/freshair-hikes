import { useEffect, useState } from "react";
import OnboardingScreen from "../../src/screens/OnboardingScreen";
import TodayPlanScreen from "../../src/screens/TodayPlanScreen";
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

  return <TodayPlanScreen />;
}
