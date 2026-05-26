import React from 'react';
import { View, Text } from 'react-native';
import { palette } from '@theme/colors';
import { fmtCurrency, fmtInt, fmtPct } from '@utils/format';
import type { TopProduct } from '@/types/reports';

interface Props {
  data: TopProduct[];
}

const n = (v: unknown): number => Number(v ?? 0);

const productName = (p: TopProduct): string =>
  p.name ?? p.item_name ?? 'Sin nombre';
const productQty = (p: TopProduct): number => n(p.qty ?? p.total_quantity);
const productRevenue = (p: TopProduct): number => n(p.revenue ?? p.total_revenue);

export const TopProductsList: React.FC<Props> = ({ data }) => {
  if (!data?.length) {
    return (
      <Text style={{ color: palette.dark.textMuted, fontSize: 12, fontStyle: 'italic' }}>
        Sin datos en este período.
      </Text>
    );
  }

  const top = data.slice(0, 5);
  const maxRevenue = Math.max(...top.map(productRevenue));

  return (
    <View style={{ gap: 14 }}>
      {top.map((p, idx) => {
        const revenue = productRevenue(p);
        const profit = n(p.profit);
        const margin = n(p.margin_pct);
        const pct = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
        return (
          <View key={`tp-${p.id ?? idx}`} style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    backgroundColor: palette.dark.primaryDim,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: palette.dark.primary, fontSize: 11, fontWeight: '900' }}>
                    {idx + 1}
                  </Text>
                </View>
                <Text
                  style={{ color: palette.dark.text, fontSize: 13, fontWeight: '700', flex: 1 }}
                  numberOfLines={1}
                >
                  {productName(p)}
                </Text>
              </View>
              <Text style={{ color: palette.dark.text, fontSize: 13, fontWeight: '700' }}>
                {fmtCurrency(revenue)}
              </Text>
            </View>
            <View
              style={{
                height: 6,
                backgroundColor: palette.dark.soft,
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  backgroundColor: palette.dark.primary,
                  borderRadius: 3,
                }}
              />
            </View>
            <Text style={{ color: palette.dark.textMuted, fontSize: 11 }}>
              {fmtInt(productQty(p))} unidades
              {profit > 0 ? ` · utilidad ${fmtCurrency(profit)}` : ''}
              {margin > 0 ? ` · ${fmtPct(margin)} margen` : ''}
            </Text>
          </View>
        );
      })}
    </View>
  );
};
