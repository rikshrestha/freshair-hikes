import React from 'react';
import { Pressable, type PressableProps, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

type IconButtonVariant = 'primary' | 'surface' | 'ghost';
type IconButtonSize = 'md' | 'lg';

type IconButtonProps = PressableProps & {
  icon: React.ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
};

export function IconButton({
  icon,
  variant = 'surface',
  size = 'md',
  style,
  ...pressableProps
}: IconButtonProps) {
  const { colors, radii, spacing } = useAppTheme();

  const dimension = size === 'lg' ? 52 : 44;
  const padding = size === 'lg' ? spacing.md : spacing.sm;

  const containerStyle = [
    styles.base,
    {
      width: dimension,
      height: dimension,
      borderRadius: radii.lg,
      padding,
    },
    variant === 'primary' && { backgroundColor: colors.primary },
    variant === 'surface' && {
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    variant === 'ghost' && { backgroundColor: 'transparent' },
    style,
  ];

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [containerStyle, pressed && { opacity: 0.85 }]}
      {...pressableProps}>
      <View style={styles.icon}>{icon}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
