import React from 'react';
import { View, Text } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { palette, chartPalette } from '@theme/colors';
import { fmtCurrency, fmtPct } from '@utils/format';
import type { ExpenseBreakdownItem } from '@/types/reports';

interface Props {
  data: ExpenseBreakdownItem[];
  total: number;
}

export const ExpenseDonut: React.FC<Props> = ({ data, total }) => {
  if (!data?.length) return null;

  const top = data.slice(0, 6);
  const pieData = top.map((item, idx) => ({
    value: item.total,
    color: chartPalette[idx % chartPalette.length],
    text: '',
  }));

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <PieChart
          data={pieData}
          donut
          radius={68}
          innerRadius={50}
          innerCircleColor={palette.dark.surface}
          centerLabelComponent={() => (
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: palette.dark.textMuted, fontSize: 9, fontWeight: '600', letterSpacing: 1 }}>
                TOTAL
              </Text>
              <Text style={{ color: palette.dark.text, fontSize: 14, fontWeight: '700', marginTop: 2, letterSpacing: -0.3 }}>
                {fmtCurrency(total)}
              </Text>
            </View>
          )}
          isAnimated
          animationDuration={600}
        />
      </View>

      <View style={{ flex: 1, gap: 8 }}>
        {top.map((item, idx) => {
          const pct = total > 0 ? (item.total / total) * 100 : 0;
          return (
            <View key={`eb-${idx}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 3,
                  backgroundColor: chartPalette[idx % chartPalette.length],
                }}
              />
              <Text
                style={{ color: palette.dark.text, fontSize: 12, fontWeight: '500', flex: 1 }}
                numberOfLines={1}
              >
                {item.category || 'Sin categoría'}
              </Text>
              <Text style={{ color: palette.dark.textDim, fontSize: 11, fontWeight: '600' }}>
                {fmtPct(pct, 0)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};
