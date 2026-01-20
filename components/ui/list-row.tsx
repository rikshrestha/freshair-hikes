import React from 'react';
import {
  Pressable,
  type PressableProps,
  StyleSheet,
  Text,
  View,
  type ViewProps,
} from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

type ListRowProps = {
  title: string;
  subtitle?: string;
  meta?: string | React.ReactNode;
  leftAdornment?: React.ReactNode;
  rightAccessory?: React.ReactNode;
  showChevron?: boolean;
} & (PressableProps | ViewProps);

export function ListRow({
  title,
  subtitle,
  meta,
  leftAdornment,
  rightAccessory,
  showChevron = true,
  ...rest
}: ListRowProps) {
  const { colors, spacing, radii, typography } = useAppTheme();

  const content = (
    <View style={[styles.textContainer, { marginLeft: leftAdornment ? spacing.md : 0 }]}>
      <Text style={[typography.bodyStrong, { color: colors.text }]} numberOfLines={1}>
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={[typography.body, { color: colors.textMuted, marginTop: 2 }]}
          numberOfLines={2}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );

  const metaContent =
    typeof meta === 'string' ? (
      <Text style={[typography.caption, { color: colors.textMuted }]}>{meta}</Text>
    ) : (
      meta
    );

  const body = (
    <View
      style={[
        styles.row,
        {
          borderRadius: radii.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        },
      ]}>
      {leftAdornment ? <View style={{ marginRight: spacing.sm }}>{leftAdornment}</View> : null}
      {content}
      <View style={{ marginLeft: spacing.sm, alignItems: 'flex-end' }}>
        {metaContent}
        <View style={styles.right}>
          {rightAccessory}
          {showChevron ? (
            <Text style={[typography.caption, { color: colors.textMuted, marginLeft: spacing.xs }]}>
              ›
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );

  const isPressable = 'onPress' in rest && typeof rest.onPress === 'function';

  if (isPressable) {
    const pressableProps = rest as PressableProps;
    return (
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.pressable,
          { backgroundColor: colors.surface },
          pressed && { opacity: 0.9 },
        ]}
        {...pressableProps}>
        {body}
      </Pressable>
    );
  }

  return <View style={[styles.pressable, { backgroundColor: colors.surface }]}>{body}</View>;
}

const styles = StyleSheet.create({
  pressable: {
    minHeight: 64,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
