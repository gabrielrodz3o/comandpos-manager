import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { palette, shadow } from '@theme/colors';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const SIZES: Record<Size, { paddingV: number; paddingH: number; fontSize: number; radius: number; height: number }> = {
  sm: { paddingV: 8,  paddingH: 14, fontSize: 13, radius: 12, height: 38 },
  md: { paddingV: 12, paddingH: 18, fontSize: 14, radius: 14, height: 46 },
  lg: { paddingV: 14, paddingH: 22, fontSize: 15, radius: 16, height: 54 },
};

export const Button: React.FC<ButtonProps> = ({
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
}) => {
  const c = palette.dark;
  const s = SIZES[size];
  const isDisabled = disabled || loading;

  const bg = {
    primary: c.text,           // botón principal negro (estética Apple)
    secondary: c.soft,
    ghost: 'transparent',
    danger: c.danger,
  }[variant];

  const fg = {
    primary: '#FFFFFF',
    secondary: c.text,
    ghost: c.text,
    danger: '#FFFFFF',
  }[variant];

  const borderColor = variant === 'ghost' ? c.border : variant === 'secondary' ? c.border : 'transparent';

  return (
    <Pressable
      onPress={() => {
        if (isDisabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      disabled={isDisabled}
      style={({ pressed }) => ({
        backgroundColor: bg,
        opacity: isDisabled ? 0.4 : pressed ? 0.88 : 1,
        height: s.height,
        paddingHorizontal: s.paddingH,
        borderRadius: s.radius,
        borderWidth: variant === 'ghost' || variant === 'secondary' ? 1 : 0,
        borderColor,
        alignSelf: fullWidth ? 'stretch' : 'auto',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        ...(variant === 'primary' ? shadow.sm : shadow.none),
      })}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <>
          {leftIcon ? <View>{leftIcon}</View> : null}
          <Text style={{ color: fg, fontSize: s.fontSize, fontWeight: '600', letterSpacing: -0.1 }}>
            {children}
          </Text>
          {rightIcon ? <View>{rightIcon}</View> : null}
        </>
      )}
    </Pressable>
  );
};
