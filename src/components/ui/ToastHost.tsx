import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '@theme/colors';
import { useToastStore, type Toast, type ToastVariant } from '@store/useToastStore';

const VARIANT_STYLE: Record<ToastVariant, { bg: string; border: string; accent: string }> = {
  error: { bg: '#FEF2F2', border: '#FECACA', accent: palette.dark.danger },
  warning: { bg: '#FFFBEB', border: '#FDE68A', accent: palette.dark.warning },
  success: { bg: palette.dark.primaryDim, border: '#A7F3D0', accent: palette.dark.success },
  info: { bg: '#EFF6FF', border: '#BFDBFE', accent: '#3B82F6' },
};

const ToastIcon: React.FC<{ variant: ToastVariant; color: string }> = ({ variant, color }) => {
  const size = 20;
  if (variant === 'success') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.8} />
        <Path d="M8.5 12.5l2.2 2.2 4.8-5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }
  if (variant === 'info') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.8} />
        <Path d="M12 11v5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        <Circle cx="12" cy="7.6" r="1" fill={color} />
      </Svg>
    );
  }
  // error / warning → triángulo de alerta
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.5L21 19H3L12 3.5z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M12 9.5v4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx="12" cy="16.3" r="1" fill={color} />
    </Svg>
  );
};

const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-16);
  const style = VARIANT_STYLE[toast.variant];

  const close = () => {
    opacity.value = withTiming(0, { duration: 180 });
    translateY.value = withTiming(-16, { duration: 180, easing: Easing.in(Easing.ease) }, (done) => {
      if (done) runOnJS(onDismiss)(toast.id);
    });
  };

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.ease) });
    translateY.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.ease) });
    const timer = setTimeout(close, toast.duration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={close}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: style.bg,
          borderWidth: 1,
          borderColor: style.border,
          borderRadius: 16,
          paddingVertical: 12,
          paddingHorizontal: 14,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        }}
      >
        <ToastIcon variant={toast.variant} color={style.accent} />
        <Text
          style={{
            flex: 1,
            color: palette.dark.text,
            fontSize: 13,
            fontWeight: '600',
            letterSpacing: -0.1,
            lineHeight: 18,
          }}
        >
          {toast.message}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

export const ToastHost: React.FC = () => {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  const insets = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: insets.top + 8,
        left: 12,
        right: 12,
        gap: 8,
        zIndex: 9999,
      }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </View>
  );
};
