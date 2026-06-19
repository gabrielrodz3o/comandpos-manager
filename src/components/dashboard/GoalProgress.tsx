import React from 'react';
import { View, Text } from 'react-native';
import { palette } from '@theme/colors';
import { fmtCurrency, fmtPct } from '@utils/format';

interface BarProps {
  label: string;
  actual: number;
  target: number;
  /** Si es true, pasarse del objetivo es malo (gastos); si no, es bueno (ventas). */
  overIsBad?: boolean;
}

const ProgressBar: React.FC<BarProps> = ({ label, actual, target, overIsBad }) => {
  const pct = target > 0 ? (actual / target) * 100 : 0;
  const clamped = Math.min(pct, 100);
  const over = pct > 100;

  const color = overIsBad
    ? over
      ? palette.dark.danger
      : palette.dark.primary
    : over
    ? palette.dark.success
    : palette.dark.primary;

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Text style={{ color: palette.dark.textDim, fontSize: 12, fontWeight: '600' }}>{label}</Text>
        <Text style={{ color: palette.dark.textMuted, fontSize: 11, fontWeight: '600' }}>
          {fmtCurrency(actual)} / {fmtCurrency(target)}
        </Text>
      </View>
      <View
        style={{
          height: 10,
          borderRadius: 999,
          backgroundColor: palette.dark.soft,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: '100%',
            width: `${clamped}%`,
            borderRadius: 999,
            backgroundColor: color,
          }}
        />
      </View>
      <Text style={{ color, fontSize: 11, fontWeight: '700' }}>
        {fmtPct(pct)} {overIsBad ? (over ? '· sobre presupuesto' : 'del presupuesto') : 'de la meta'}
      </Text>
    </View>
  );
};

interface Props {
  salesActual: number;
  salesGoal: number;
  expenseActual: number;
  expenseBudget: number;
}

export const GoalProgress: React.FC<Props> = ({
  salesActual,
  salesGoal,
  expenseActual,
  expenseBudget,
}) => (
  <View style={{ gap: 18 }}>
    {salesGoal > 0 ? (
      <ProgressBar label="Ventas" actual={salesActual} target={salesGoal} />
    ) : null}
    {expenseBudget > 0 ? (
      <ProgressBar label="Gastos" actual={expenseActual} target={expenseBudget} overIsBad />
    ) : null}
  </View>
);
