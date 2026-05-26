import React from 'react';
import { View, Text } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { palette, chartPalette } from '@theme/colors';
import { fmtCurrency, fmtPct } from '@utils/format';
import type { CategoryRow } from '@/types/reports';

interface Props {
  data: CategoryRow[];
}

export const CategoriesDonut: React.FC<Props> = ({ data }) => {
  if (!data?.length) return null;

  const top = data.slice(0, 8);
  const total = top.reduce((s, c) => s + Number(c.total_sales ?? 0), 0);

  if (total <= 0) return null;

  const pieData = top.map((c, idx) => ({
    value: Number(c.total_sales ?? 0),
    color: chartPalette[idx % chartPalette.length],
  }));

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
      <PieChart
        data={pieData}
        donut
        radius={64}
        innerRadius={46}
        innerCircleColor={palette.dark.surface}
        centerLabelComponent={() => (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: palette.dark.textMuted, fontSize: 9, fontWeight: '600', letterSpacing: 1 }}>
              TOTAL
            </Text>
            <Text style={{ color: palette.dark.text, fontSize: 13, fontWeight: '700' }}>
              {fmtCurrency(total)}
            </Text>
          </View>
        )}
        isAnimated
        animationDuration={600}
      />
      <View style={{ flex: 1, gap: 7 }}>
        {top.map((c, idx) => {
          const pct = total > 0 ? (Number(c.total_sales ?? 0) / total) * 100 : 0;
          return (
            <View key={`cat-${idx}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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
                {c.category_name || 'Sin categoría'}
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
