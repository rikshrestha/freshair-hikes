import React from 'react';
import { Pressable, type PressableProps, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

type ChipProps = PressableProps & {
  label: string;
  selected?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
};

export function Chip({
  label,
  selected = false,
  leading,
  trailing,
  style,
  ...pressableProps
}: ChipProps) {
  const { colors, spacing, radii, typography } = useAppTheme();

  const containerStyle = [
    styles.base,
    {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radii.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: selected ? colors.primary : colors.border,
      backgroundColor: selected ? colors.subtle : colors.surface,
    },
    style,
  ];

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [containerStyle, pressed && { opacity: 0.85 }]}
      {...pressableProps}>
      {leading ? <View style={{ marginRight: spacing.xs }}>{leading}</View> : null}
      <Text
        style={[
          typography.bodyStrong,
          { color: selected ? colors.primaryStrong : colors.text },
        ]}>
        {label}
      </Text>
      {trailing ? <View style={{ marginLeft: spacing.xs }}>{trailing}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
  },
});
