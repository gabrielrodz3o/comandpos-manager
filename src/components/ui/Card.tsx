import React from 'react';
import { View, ViewProps } from 'react-native';
import { palette, shadow } from '@theme/colors';

interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'flat';
  padded?: boolean;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padded = true,
  style,
  children,
  ...rest
}) => {
  const c = palette.dark;
  const shadowStyle = variant === 'elevated' ? shadow.md : variant === 'flat' ? shadow.none : shadow.sm;

  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: c.surface,
          borderRadius: 18,
          padding: padded ? 18 : 0,
          borderWidth: variant === 'flat' ? 0 : 1,
          borderColor: c.border,
          ...shadowStyle,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};
