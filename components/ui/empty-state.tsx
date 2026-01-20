import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

import { Button } from './button';

type Action = {
  label: string;
  onPress: () => void;
};

type EmptyStateProps = {
  title: string;
  description?: string;
  illustration?: React.ReactNode;
  primaryAction?: Action;
  secondaryAction?: Action;
};

export function EmptyState({
  title,
  description,
  illustration,
  primaryAction,
  secondaryAction,
}: EmptyStateProps) {
  const { colors, spacing, radii, typography } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          padding: spacing.lg,
          backgroundColor: colors.surface,
          borderRadius: radii.lg,
        },
      ]}>
      {illustration ? <View style={{ marginBottom: spacing.md }}>{illustration}</View> : null}
      <Text style={[typography.headline, { color: colors.text, textAlign: 'center' }]}>{title}</Text>
      {description ? (
        <Text
          style={[
            typography.body,
            { color: colors.textMuted, marginTop: spacing.sm, textAlign: 'center' },
          ]}>
          {description}
        </Text>
      ) : null}
      <View style={{ marginTop: spacing.lg, gap: spacing.sm, width: '100%' }}>
        {primaryAction ? (
          <Button
            title={primaryAction.label}
            onPress={primaryAction.onPress}
            fullWidth
            accessibilityHint="Primary action"
          />
        ) : null}
        {secondaryAction ? (
          <Button
            title={secondaryAction.label}
            onPress={secondaryAction.onPress}
            variant="secondary"
            fullWidth
            accessibilityHint="Secondary action"
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
});
