import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="hike-details/[id]"
          options={{ title: "Hike Details", headerBackTitle: "Back", headerBackTitleVisible: false }}
        />
        <Stack.Screen
          name="hike-reflection/[id]"
          options={{ title: "Reflection", headerBackTitle: "Back", headerBackTitleVisible: false }}
        />
        <Stack.Screen
          name="about"
          options={{ title: "About", headerBackTitle: "Back", headerBackTitleVisible: false }}
        />
        <Stack.Screen
          name="contact"
          options={{ title: "Contact", headerBackTitle: "Back", headerBackTitleVisible: false }}
        />
        <Stack.Screen
          name="trail/[id]"
          options={{ title: "Trail", headerBackTitle: "Back", headerBackTitleVisible: false }}
        />
        <Stack.Screen
          name="saved"
          options={{ title: "Saved Trails", headerBackTitle: "Back", headerBackTitleVisible: false }}
        />
        <Stack.Screen
          name="navigation"
          options={{ title: "Navigation", headerBackTitle: "Back", headerBackTitleVisible: false }}
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
