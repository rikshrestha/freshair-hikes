import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onPressAction?: () => void;
  actionSlot?: React.ReactNode;
};

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onPressAction,
  actionSlot,
}: SectionHeaderProps) {
  const { colors, spacing, typography } = useAppTheme();

  return (
    <View style={[styles.container, { marginBottom: spacing.sm }]}>
      <View>
        <Text style={[typography.headline, { color: colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[typography.body, { color: colors.textMuted, marginTop: 2 }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {actionSlot ? (
        <View>{actionSlot}</View>
      ) : actionLabel && onPressAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onPressAction}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
          <Text style={[typography.bodyStrong, { color: colors.primary }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
