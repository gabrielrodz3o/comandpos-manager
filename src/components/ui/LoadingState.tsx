import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  withSequence,
} from 'react-native-reanimated';
import { palette } from '@theme/colors';
import { Skeleton } from './Skeleton';

interface Props {
  label?: string;
  hint?: string;
  variant?: 'centered' | 'inline' | 'skeletons';
  skeletonCount?: number;
}

export const LoadingState: React.FC<Props> = ({
  label = 'Cargando reporte…',
  hint = 'Esto puede tomar unos segundos',
  variant = 'centered',
  skeletonCount = 4,
}) => {
  const dotOpacity = useSharedValue(0.3);

  useEffect(() => {
    dotOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [dotOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: dotOpacity.value }));

  if (variant === 'inline') {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingVertical: 12,
          paddingHorizontal: 16,
        }}
      >
        <ActivityIndicator color={palette.dark.primary} size="small" />
        <Animated.Text
          style={[
            { color: palette.dark.textDim, fontSize: 12, fontWeight: '600' },
            animatedStyle,
          ]}
        >
          {label}
        </Animated.Text>
      </View>
    );
  }

  if (variant === 'skeletons') {
    return (
      <View style={{ gap: 14 }}>
        <Skeleton height={138} radius={22} />
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <View key={`sk-${i}`} style={{ flexDirection: 'row', gap: 10 }}>
            <Skeleton height={110} radius={18} style={{ flex: 1 }} />
            <Skeleton height={110} radius={18} style={{ flex: 1 }} />
          </View>
        ))}
        <View style={{ alignItems: 'center', marginTop: 8, flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
          <ActivityIndicator color={palette.dark.primary} size="small" />
          <Animated.Text
            style={[
              { color: palette.dark.textDim, fontSize: 13, fontWeight: '600' },
              animatedStyle,
            ]}
          >
            {label}
          </Animated.Text>
        </View>
      </View>
    );
  }

  // centered
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: 14,
      }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          backgroundColor: palette.dark.soft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={palette.dark.primary} size="large" />
      </View>
      <Animated.View style={animatedStyle}>
        <Text
          style={{
            color: palette.dark.text,
            fontSize: 14,
            fontWeight: '700',
            textAlign: 'center',
            letterSpacing: -0.2,
          }}
        >
          {label}
        </Text>
      </Animated.View>
      {hint ? (
        <Text style={{ color: palette.dark.textMuted, fontSize: 12, textAlign: 'center', maxWidth: 240 }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
};

/**
 * Banner fino superior — se muestra durante refetches sin bloquear el contenido cacheado.
 */
export const InlineFetchingBar: React.FC<{ visible: boolean; label?: string }> = ({
  visible,
  label = 'Actualizando…',
}) => {
  if (!visible) return null;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 6,
        backgroundColor: palette.dark.primaryDim,
        borderRadius: 999,
        marginHorizontal: 16,
        marginBottom: 8,
      }}
    >
      <ActivityIndicator color={palette.dark.success} size="small" />
      <Text style={{ color: palette.dark.success, fontSize: 11, fontWeight: '700', letterSpacing: 0.3 }}>
        {label}
      </Text>
    </View>
  );
};
