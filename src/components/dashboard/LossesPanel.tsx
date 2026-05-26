import React from 'react';
import { View, Text } from 'react-native';
import { palette } from '@theme/colors';
import { fmtCurrency, fmtInt, fmtPct } from '@utils/format';
import type { LossesResponse, LossReasonRow, LossItemRow } from '@/types/reports';

interface Props {
  data?: LossesResponse;
}

const n = (v: unknown) => Number(v ?? 0);

const RowItem: React.FC<{ label: string; value: string; tint?: 'warning' | 'danger' }> = ({
  label,
  value,
  tint,
}) => (
  <View
    style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 6,
      borderBottomWidth: 0.5,
      borderBottomColor: palette.dark.border,
    }}
  >
    <Text style={{ color: palette.dark.textDim, fontSize: 12, fontWeight: '500', flex: 1 }} numberOfLines={1}>
      {label}
    </Text>
    <Text
      style={{
        color: tint === 'danger' ? palette.dark.danger : tint === 'warning' ? palette.dark.warning : palette.dark.text,
        fontSize: 12,
        fontWeight: '700',
      }}
    >
      {value}
    </Text>
  </View>
);

const LossBlock: React.FC<{
  title: string;
  emoji: string;
  tint: 'warning' | 'danger';
  resumen?: { total_count?: number; total_amount?: number; pct_of_sales?: number };
  reasons: LossReasonRow[];
  items: LossItemRow[];
  reasonLabelKey: 'reason' | 'type';
}> = ({ title, emoji, tint, resumen, reasons, items, reasonLabelKey }) => {
  const totalAmount = n(resumen?.total_amount);
  const totalCount = n(resumen?.total_count);
  if (!totalCount && reasons.length === 0 && items.length === 0) return null;

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <Text style={{ fontSize: 14 }}>{emoji}</Text>
        <Text style={{ color: palette.dark.text, fontSize: 13, fontWeight: '700' }}>{title}</Text>
      </View>
      <Text
        style={{
          color: tint === 'danger' ? palette.dark.danger : palette.dark.warning,
          fontSize: 18,
          fontWeight: '800',
          letterSpacing: -0.5,
          marginBottom: 2,
        }}
      >
        {fmtCurrency(totalAmount)}
      </Text>
      <Text style={{ color: palette.dark.textMuted, fontSize: 11, marginBottom: 12 }}>
        {fmtInt(totalCount)} registros
        {resumen?.pct_of_sales ? ` · ${fmtPct(resumen.pct_of_sales)} de ventas` : ''}
      </Text>

      {reasons.length > 0 ? (
        <View style={{ marginBottom: 10 }}>
          <Text style={{ color: palette.dark.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 4 }}>
            POR {reasonLabelKey === 'reason' ? 'RAZÓN' : 'TIPO'}
          </Text>
          {reasons.slice(0, 4).map((r, idx) => (
            <RowItem
              key={`r-${idx}`}
              label={String(r[reasonLabelKey] ?? '—')}
              value={fmtCurrency(r.total)}
              tint={tint}
            />
          ))}
        </View>
      ) : null}

      {items.length > 0 ? (
        <View>
          <Text style={{ color: palette.dark.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 4 }}>
            TOP ITEMS
          </Text>
          {items.slice(0, 4).map((i, idx) => (
            <RowItem
              key={`i-${idx}`}
              label={`${i.item_name} (${fmtInt(i.quantity)})`}
              value={fmtCurrency(i.total)}
              tint={tint}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
};

export const LossesPanel: React.FC<Props> = ({ data }) => {
  if (!data) return null;
  return (
    <View style={{ flexDirection: 'row', gap: 14 }}>
      <LossBlock
        title="Cortesías"
        emoji="🎁"
        tint="warning"
        resumen={data.cortesias?.resumen}
        reasons={data.cortesias?.por_razon ?? []}
        items={data.cortesias?.items_mas_cortesiados ?? []}
        reasonLabelKey="reason"
      />
      <View style={{ width: 1, backgroundColor: palette.dark.border }} />
      <LossBlock
        title="Mermas"
        emoji="🗑️"
        tint="danger"
        resumen={data.mermas?.resumen}
        reasons={data.mermas?.por_tipo ?? []}
        items={data.mermas?.items_mas_desperdiciados ?? []}
        reasonLabelKey="type"
      />
    </View>
  );
};
