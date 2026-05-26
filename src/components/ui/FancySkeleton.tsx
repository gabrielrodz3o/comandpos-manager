import React from 'react';
import { View } from 'react-native';
import { palette } from '@theme/colors';
import { Skeleton } from './Skeleton';

/**
 * Skeleton "realista" — imita la estructura de un KPI card o lista para que
 * el usuario perciba el contenido antes de cargar.
 */
export const KpiCardSkeleton: React.FC = () => (
  <View
    style={{
      flex: 1,
      backgroundColor: palette.dark.surface,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: palette.dark.border,
      minHeight: 110,
    }}
  >
    <Skeleton height={10} width="50%" radius={3} />
    <View style={{ marginTop: 12 }}>
      <Skeleton height={22} width="70%" radius={4} />
    </View>
    <View style={{ marginTop: 8 }}>
      <Skeleton height={10} width="40%" radius={3} />
    </View>
  </View>
);

export const KpiGridSkeleton: React.FC<{ rows?: number }> = ({ rows = 2 }) => (
  <View style={{ gap: 10 }}>
    {Array.from({ length: rows }).map((_, i) => (
      <View key={`row-${i}`} style={{ flexDirection: 'row', gap: 10 }}>
        <KpiCardSkeleton />
        <KpiCardSkeleton />
      </View>
    ))}
  </View>
);

export const HeroSkeleton: React.FC = () => (
  <View
    style={{
      borderRadius: 22,
      padding: 22,
      minHeight: 138,
      backgroundColor: palette.dark.elevated,
      borderWidth: 1,
      borderColor: palette.dark.border,
    }}
  >
    <Skeleton height={10} width="40%" radius={3} />
    <View style={{ marginTop: 12 }}>
      <Skeleton height={34} width="65%" radius={6} />
    </View>
    <View style={{ marginTop: 12 }}>
      <Skeleton height={12} width="50%" radius={3} />
    </View>
  </View>
);

export const ListItemSkeleton: React.FC = () => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
    }}
  >
    <Skeleton width={40} height={40} radius={10} />
    <View style={{ flex: 1, gap: 6 }}>
      <Skeleton height={14} width="65%" radius={4} />
      <Skeleton height={11} width="40%" radius={3} />
    </View>
    <Skeleton width={60} height={18} radius={4} />
  </View>
);

export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 200 }) => (
  <View
    style={{
      backgroundColor: palette.dark.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: palette.dark.border,
      padding: 18,
    }}
  >
    <Skeleton height={14} width="40%" radius={4} />
    <View style={{ marginTop: 8 }}>
      <Skeleton height={11} width="30%" radius={3} />
    </View>
    <View style={{ flexDirection: 'row', gap: 16, marginTop: 14 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <View key={`bar-${i}`} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
          <Skeleton
            height={height * (0.3 + Math.random() * 0.6)}
            width={'100%' as unknown as number}
            radius={6}
          />
          <Skeleton height={8} width={'70%' as unknown as number} radius={2} />
        </View>
      ))}
    </View>
  </View>
);
