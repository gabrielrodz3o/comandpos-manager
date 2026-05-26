import React from 'react';
import { View, Text } from 'react-native';
import { palette } from '@theme/colors';
import { fmtCurrency, fmtInt, fmtPct } from '@utils/format';
import type { ComparativeChange } from '@/types/reports';

interface Props {
  title: string;
  data?: ComparativeChange;
}

const MetricRow: React.FC<{
  label: string;
  changeValue?: number;
  changePct?: number;
  isMoney?: boolean;
}> = ({ label, changeValue, changePct, isMoney = true }) => {
  const v = Number(changeValue ?? 0);
  const p = Number(changePct ?? 0);
  const isUp = v >= 0;
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 0.5,
        borderBottomColor: palette.dark.border,
      }}
    >
      <Text style={{ color: palette.dark.textDim, fontSize: 12, fontWeight: '600' }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text
          style={{
            color: isUp ? palette.dark.success : palette.dark.danger,
            fontSize: 13,
            fontWeight: '700',
          }}
        >
          {isUp ? '+' : ''}
          {isMoney ? fmtCurrency(v) : fmtInt(v)}
        </Text>
        <View
          style={{
            backgroundColor: isUp ? '#ECFDF5' : '#FEF2F2',
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 6,
            minWidth: 56,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              color: isUp ? palette.dark.success : palette.dark.danger,
              fontSize: 10,
              fontWeight: '800',
            }}
          >
            {isUp ? '↑' : '↓'} {fmtPct(Math.abs(p), 1)}
          </Text>
        </View>
      </View>
    </View>
  );
};

export const ComparativesCard: React.FC<Props> = ({ title, data }) => {
  if (!data) return null;
  const hasAny =
    Number(data.sales_change ?? 0) ||
    Number(data.profit_change ?? 0) ||
    Number(data.invoices_change ?? 0);
  if (!hasAny) return null;

  return (
    <View>
      <Text
        style={{
          color: palette.dark.textMuted,
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 1,
          marginBottom: 6,
        }}
      >
        {title.toUpperCase()}
      </Text>
      <MetricRow label="Ventas" changeValue={data.sales_change} changePct={data.sales_change_pct} />
      <MetricRow label="Utilidad" changeValue={data.profit_change} changePct={data.profit_change_pct} />
      <MetricRow
        label="Facturas"
        changeValue={data.invoices_change}
        changePct={data.invoices_change_pct}
        isMoney={false}
      />
      {data.purchases_change != null ? (
        <MetricRow label="Compras" changeValue={data.purchases_change} changePct={data.purchases_change_pct} />
      ) : null}
      {data.tips_change != null ? (
        <MetricRow label="Propinas" changeValue={data.tips_change} changePct={data.tips_change_pct} />
      ) : null}
    </View>
  );
};
