import { theme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useAppTheme() {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';

  return {
    colorScheme,
    colors: theme[colorScheme].colors,
    shadows: theme[colorScheme].shadows,
    spacing: theme.spacing,
    radii: theme.radii,
    typography: theme.typography,
  };
}
