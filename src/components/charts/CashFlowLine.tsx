import React from 'react';
import { View, Text } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { palette, chartPalette } from '@theme/colors';
import { fmtCompact } from '@utils/format';
import type { CashFlowPoint } from '@/types/reports';

interface Props {
  data: CashFlowPoint[];
}

const n = (v: unknown): number => Number(v ?? 0);

// Acepta tanto el formato nuevo (entradas/salidas) como antiguo (in/out)
const pointIn = (p: CashFlowPoint): number => n(p.entradas ?? p.in);
const pointOut = (p: CashFlowPoint): number => n(p.salidas ?? p.out);
const pointLabel = (p: CashFlowPoint): string =>
  p.label ?? p.day ?? p.bucket ?? '';

export const CashFlowLine: React.FC<Props> = ({ data }) => {
  if (!data?.length) {
    return (
      <Text style={{ color: palette.dark.textMuted, fontSize: 12, fontStyle: 'italic' }}>
        Sin movimientos en este período.
      </Text>
    );
  }

  const inSeries = data.map((d) => ({ value: pointIn(d) }));
  const outSeries = data.map((d, idx) => ({
    value: pointOut(d),
    label: idx % Math.max(1, Math.floor(data.length / 5)) === 0 ? pointLabel(d) : '',
    labelTextStyle: { color: palette.dark.textMuted, fontSize: 9 },
  }));

  const maxValue = Math.max(
    ...data.map((d) => Math.max(pointIn(d), pointOut(d))),
    1, // evitar 0 → infinity
  );

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 16, marginBottom: 14 }}>
        <Legend color={chartPalette[0]} label="Entradas" />
        <Legend color={chartPalette[2]} label="Salidas" />
      </View>
      <LineChart
        data={outSeries}
        data2={inSeries}
        height={180}
        thickness={2.5}
        color1={chartPalette[2]}
        color2={chartPalette[0]}
        areaChart
        startFillColor1={chartPalette[2]}
        endFillColor1={chartPalette[2]}
        startOpacity1={0.22}
        endOpacity1={0.01}
        startFillColor2={chartPalette[0]}
        endFillColor2={chartPalette[0]}
        startOpacity2={0.26}
        endOpacity2={0.01}
        maxValue={maxValue * 1.15}
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

const Legend = ({ color, label }: { color: string; label: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
    <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: color }} />
    <Text style={{ color: palette.dark.textDim, fontSize: 11, fontWeight: '500' }}>{label}</Text>
  </View>
);
