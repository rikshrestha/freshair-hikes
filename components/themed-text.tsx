import { Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { useAppTheme } from '@/hooks/use-app-theme';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const { typography, colors } = useAppTheme();
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  const typeStyle =
    type === 'title'
      ? typography.title
      : type === 'defaultSemiBold'
      ? typography.bodyStrong
      : type === 'subtitle'
      ? typography.subhead
      : type === 'link'
      ? typography.body
      : typography.body;

  return (
    <Text
      style={[
        { color },
        typeStyle,
        type === 'link' && { color: colors.primary, textDecorationLine: 'underline' },
        style,
      ]}
      {...rest}
    />
  );
}
