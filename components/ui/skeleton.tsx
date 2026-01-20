import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, type ViewProps } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

type SkeletonProps = ViewProps & {
  width?: number | string;
  height?: number;
  borderRadius?: number;
};

export function Skeleton({
  width = '100%',
  height = 14,
  borderRadius,
  style,
  ...viewProps
}: SkeletonProps) {
  const { colors, radii } = useAppTheme();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  return (
    <Animated.View
      style={[
        styles.base,
        {
          width,
          height,
          borderRadius: borderRadius ?? radii.sm,
          backgroundColor: colors.subtle,
          opacity,
        },
        style,
      ]}
      {...viewProps}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
