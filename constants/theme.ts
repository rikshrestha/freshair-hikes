import { Platform } from 'react-native';

const palette = {
  forest950: '#0B1B14',
  forest900: '#0F241B',
  forest800: '#1B3428',
  forest700: '#234633',
  forest500: '#2F6F4F',
  forest400: '#3D8E64',
  forest200: '#CBE6D6',
  forest100: '#E6F3EC',
  sand100: '#F7F4ED',
  sand50: '#FBFAF6',
  slate900: '#0D1214',
  slate700: '#2F3B41',
  slate500: '#5E6A71',
  slate400: '#7A868E',
  slate200: '#D7DEE3',
  slate100: '#EDF1F4',
  amber500: '#D97706',
  red500: '#DC2626',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  gutter: 24,
};

export const radii = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

export const typography = {
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700' as const,
  },
  headline: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700' as const,
  },
  subhead: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  bodyStrong: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500' as const,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700' as const,
  },
};

const lightColors = {
  text: palette.slate900,
  textMuted: palette.slate500,
  background: palette.sand50,
  surface: '#FFFFFF',
  surfaceMuted: palette.sand100,
  card: '#FFFFFF',
  border: palette.slate200,
  tint: palette.forest500,
  icon: palette.slate700,
  tabIconDefault: palette.slate500,
  tabIconSelected: palette.forest500,
  primary: palette.forest500,
  primaryStrong: palette.forest700,
  subtle: palette.slate100,
  success: palette.forest400,
  warning: palette.amber500,
  danger: palette.red500,
  backdrop: 'rgba(0,0,0,0.14)',
};

const darkColors = {
  text: '#EEF2F3',
  textMuted: '#A6B4BC',
  background: palette.forest950,
  surface: palette.forest900,
  surfaceMuted: palette.forest800,
  card: palette.forest900,
  border: '#1F2A24',
  tint: palette.forest400,
  icon: '#B5C7BE',
  tabIconDefault: '#8EA099',
  tabIconSelected: palette.forest200,
  primary: palette.forest400,
  primaryStrong: '#4DA880',
  subtle: '#1B2621',
  success: '#4DA880',
  warning: '#F5A524',
  danger: '#F87171',
  backdrop: 'rgba(0,0,0,0.42)',
};

export const Colors = {
  light: lightColors,
  dark: darkColors,
};

export const shadows = {
  light: {
    card: {
      shadowColor: palette.forest900,
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 4,
    },
  },
  dark: {
    card: {
      shadowColor: '#000',
      shadowOpacity: 0.4,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
  },
};

export const theme = {
  spacing,
  radii,
  typography,
  light: {
    colors: lightColors,
    shadows: shadows.light,
  },
  dark: {
    colors: darkColors,
    shadows: shadows.dark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
