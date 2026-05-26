import React, { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { palette } from '@theme/colors';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  radius = 10,
  style,
}) => {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: width as ViewStyle['width'],
          height,
          borderRadius: radius,
          backgroundColor: palette.dark.soft,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

export const SkeletonRow: React.FC<{ count?: number; gap?: number }> = ({ count = 3, gap = 8 }) => (
  <View style={{ gap }}>
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} height={14} width={`${90 - i * 15}%`} />
    ))}
  </View>
);
