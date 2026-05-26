import React from 'react';
import { View, Text } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { palette, chartPalette } from '@theme/colors';
import { fmtCompact } from '@utils/format';
import type { DailyTrendPoint } from '@/types/reports';

interface Props {
  current: DailyTrendPoint[];
  previous?: DailyTrendPoint[];
  field?: keyof DailyTrendPoint;
}

const dayLabel = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  } catch {
    return dateStr.slice(-5);
  }
};

export const DailyTrendLine: React.FC<Props> = ({ current, previous, field = 'total_sales' }) => {
  if (!current?.length) return null;

  const labelEvery = Math.max(1, Math.floor(current.length / 6));

  const data1 = current.map((d, i) => ({
    value: Number(d[field] ?? 0),
    label: i % labelEvery === 0 ? dayLabel(d.date) : '',
    labelTextStyle: { color: palette.dark.textMuted, fontSize: 9 },
  }));

  const data2 = (previous ?? []).map((d) => ({ value: Number(d[field] ?? 0) }));

  const maxVal = Math.max(
    ...current.map((d) => Number(d[field] ?? 0)),
    ...(previous ?? []).map((d) => Number(d[field] ?? 0)),
  );

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 16, marginBottom: 14 }}>
        <Legend color={chartPalette[0]} label="Período actual" />
        {data2.length ? <Legend color={chartPalette[1]} label="Período anterior" dashed /> : null}
      </View>
      <LineChart
        data={data1}
        data2={data2.length ? data2 : undefined}
        height={180}
        thickness={2.5}
        color1={chartPalette[0]}
        color2={chartPalette[1]}
        areaChart
        startFillColor1={chartPalette[0]}
        endFillColor1={chartPalette[0]}
        startOpacity1={0.25}
        endOpacity1={0.01}
        startFillColor2={chartPalette[1]}
        endFillColor2={chartPalette[1]}
        startOpacity2={0.12}
        endOpacity2={0.0}
        maxValue={maxVal * 1.15}
        noOfSections={4}
        yAxisColor={palette.dark.border}
        xAxisColor={palette.dark.border}
        yAxisTextStyle={{ color: palette.dark.textMuted, fontSize: 9 }}
        formatYLabel={(v) => fmtCompact(v)}
        rulesType="solid"
        rulesColor={palette.dark.border}
        initialSpacing={10}
        endSpacing={10}
        hideDataPoints
        curved
        isAnimated
        animationDuration={800}
      />
    </View>
  );
};

const Legend: React.FC<{ color: string; label: string; dashed?: boolean }> = ({ color, label, dashed }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
    <View
      style={{
        width: 14,
        height: 3,
        backgroundColor: color,
        opacity: dashed ? 0.6 : 1,
      }}
    />
    <Text style={{ color: palette.dark.textDim, fontSize: 11, fontWeight: '500' }}>{label}</Text>
  </View>
);
