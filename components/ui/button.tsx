import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'md' | 'lg';

type ButtonProps = PressableProps & {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
};

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  fullWidth,
  disabled,
  style,
  ...pressableProps
}: ButtonProps) {
  const { colors, radii, spacing, typography } = useAppTheme();
  const isDisabled = disabled || loading;

  const containerStyle = [
    styles.base,
    {
      minHeight: size === 'lg' ? 52 : 46,
      paddingHorizontal: size === 'lg' ? spacing.lg : spacing.md,
      borderRadius: radii.md,
    },
    variant === 'primary' && { backgroundColor: colors.primary },
    variant === 'secondary' && {
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    variant === 'ghost' && { backgroundColor: 'transparent' },
    fullWidth && { width: '100%' },
    isDisabled && { opacity: 0.6 },
    style,
  ];

  const textStyle = [
    {
      color:
        variant === 'primary'
          ? '#ffffff'
          : variant === 'secondary'
          ? colors.text
          : colors.text,
      ...typography.bodyStrong,
    },
  ];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [containerStyle, pressed && { opacity: 0.85 }]}
      {...pressableProps}>
      <View style={styles.content}>
        {icon ? <View style={{ marginRight: spacing.sm }}>{icon}</View> : null}
        <Text style={textStyle}>{title}</Text>
        {loading && (
          <ActivityIndicator
            style={{ marginLeft: spacing.sm }}
            size="small"
            color={variant === 'primary' ? '#ffffff' : colors.text}
          />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
