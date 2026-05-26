import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { palette, chartPalette } from '@theme/colors';
import { fmtCompact } from '@utils/format';
import type { MonthlySeriesPoint } from '@/types/reports';

interface Props {
  data: MonthlySeriesPoint[];
}

export const MonthlyBarChart: React.FC<Props> = ({ data }) => {
  if (!data?.length) return null;

  const barData = data.flatMap((d, idx) => [
    {
      value: d.ventas ?? 0,
      label: d.month,
      labelTextStyle: { color: palette.dark.textMuted, fontSize: 10, fontWeight: '500' as const },
      frontColor: chartPalette[0],
      spacing: 2,
    },
    {
      value: (d.gastos ?? 0) + (d.compras ?? 0),
      frontColor: chartPalette[1],
      spacing: idx === data.length - 1 ? 0 : 18,
    },
  ]);

  const maxValue = Math.max(...data.map((d) => Math.max(d.ventas ?? 0, (d.gastos ?? 0) + (d.compras ?? 0))));

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 16, marginBottom: 14 }}>
        <Legend color={chartPalette[0]} label="Ventas" />
        <Legend color={chartPalette[1]} label="Costos + Gastos" />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <BarChart
          data={barData}
          barWidth={14}
          barBorderRadius={5}
          height={200}
          maxValue={maxValue * 1.15}
          noOfSections={4}
          yAxisColor={palette.dark.border}
          xAxisColor={palette.dark.border}
          yAxisTextStyle={{ color: palette.dark.textMuted, fontSize: 9 }}
          formatYLabel={(v) => fmtCompact(v)}
          rulesType="solid"
          rulesColor={palette.dark.border}
          initialSpacing={12}
          endSpacing={12}
          isAnimated
          animationDuration={600}
        />
      </ScrollView>
    </View>
  );
};

const Legend = ({ color, label }: { color: string; label: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
    <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: color }} />
    <Text style={{ color: palette.dark.textDim, fontSize: 11, fontWeight: '500' }}>{label}</Text>
  </View>
);
