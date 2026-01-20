import React from 'react';
import { View, type ViewProps } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

export function Divider(props: ViewProps) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        {
          height: 1,
          backgroundColor: colors.border,
          width: '100%',
        },
        props.style,
      ]}
      {...props}
    />
  );
}
