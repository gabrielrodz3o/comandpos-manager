import React from 'react';
import { View, Text } from 'react-native';
import { palette, chartPalette } from '@theme/colors';
import { fmtCurrency, fmtInt, fmtPct } from '@utils/format';
import type { TopCustomer } from '@/types/reports';

interface Props {
  data: TopCustomer[];
}

const n = (v: unknown): number => Number(v ?? 0);

const customerName = (c: TopCustomer): string =>
  c.name ?? c.customer_name ?? 'Sin nombre';

const customerSales = (c: TopCustomer): number =>
  n(c.total ?? c.total_sales);

const customerInvoices = (c: TopCustomer): number =>
  n(c.invoice_count ?? c.invoices_count);

export const TopCustomersList: React.FC<Props> = ({ data }) => {
  if (!data?.length) return null;

  const top = data.slice(0, 5);
  const grandTotal = top.reduce((s, c) => s + customerSales(c), 0);
  const maxSales = Math.max(...top.map(customerSales));

  return (
    <View style={{ gap: 14 }}>
      <View
        style={{
          flexDirection: 'row',
          gap: 10,
          backgroundColor: palette.dark.soft,
          padding: 10,
          borderRadius: 10,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: palette.dark.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>
            TOP {top.length}
          </Text>
          <Text style={{ color: palette.dark.text, fontSize: 14, fontWeight: '800', marginTop: 2 }}>
            {fmtCurrency(grandTotal)}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: palette.dark.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>
            FACTURAS
          </Text>
          <Text style={{ color: palette.dark.text, fontSize: 14, fontWeight: '800', marginTop: 2 }}>
            {fmtInt(top.reduce((s, c) => s + customerInvoices(c), 0))}
          </Text>
        </View>
      </View>

      {top.map((c, idx) => {
        const sales = customerSales(c);
        const pct = maxSales > 0 ? (sales / maxSales) * 100 : 0;
        const concentration = grandTotal > 0 ? (sales / grandTotal) * 100 : 0;
        return (
          <View key={`cust-${c.id ?? idx}`} style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 7,
                    backgroundColor: palette.dark.soft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: palette.dark.text, fontSize: 11, fontWeight: '800' }}>
                    {idx + 1}
                  </Text>
                </View>
                <Text
                  style={{ color: palette.dark.text, fontSize: 13, fontWeight: '600', flex: 1, letterSpacing: -0.2 }}
                  numberOfLines={1}
                >
                  {customerName(c)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: palette.dark.text, fontSize: 13, fontWeight: '700' }}>
                  {fmtCurrency(sales)}
                </Text>
                <Text style={{ color: palette.dark.textMuted, fontSize: 10 }}>
                  {fmtInt(customerInvoices(c))} fact. · {fmtPct(concentration, 0)} del top
                </Text>
              </View>
            </View>
            <View
              style={{
                height: 5,
                backgroundColor: palette.dark.soft,
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  backgroundColor: chartPalette[idx % chartPalette.length],
                }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
};
