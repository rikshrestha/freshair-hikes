import React from 'react';
import { StyleSheet, Text, View, type ViewProps } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger';

type BadgeProps = ViewProps & {
  label: string;
  tone?: BadgeTone;
};

export function Badge({ label, tone = 'neutral', style, ...viewProps }: BadgeProps) {
  const { colors, spacing, radii, typography } = useAppTheme();

  const toneStyles: Record<BadgeTone, { backgroundColor: string; color: string }> = {
    neutral: { backgroundColor: colors.subtle, color: colors.text },
    success: { backgroundColor: `${colors.success}1A`, color: colors.success },
    warning: { backgroundColor: `${colors.warning}1A`, color: colors.warning },
    danger: { backgroundColor: `${colors.danger}1A`, color: colors.danger },
  };

  const { backgroundColor, color } = toneStyles[tone];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderRadius: radii.pill,
        },
        style,
      ]}
      {...viewProps}>
      <Text style={[typography.caption, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
});
