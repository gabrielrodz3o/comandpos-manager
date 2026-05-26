import React from 'react';
import { View, Text } from 'react-native';
import { palette } from '@theme/colors';
import { fmtCurrency, fmtPct } from '@utils/format';

interface Props {
  receivable?: Record<string, number>;
  payable?: Record<string, number>;
}

const BUCKETS = ['0-30', '31-60', '61-90', '90+'] as const;

const normalize = (data?: Record<string, number>) => {
  if (!data) return null;
  // Backend keys can vary; normalize common patterns
  const map: Record<string, number> = {
    '0-30': Number(data['0-30'] ?? data.bucket_0_30 ?? data.range_0_30 ?? 0),
    '31-60': Number(data['31-60'] ?? data.bucket_31_60 ?? data.range_31_60 ?? 0),
    '61-90': Number(data['61-90'] ?? data.bucket_61_90 ?? data.range_61_90 ?? 0),
    '90+': Number(data['90+'] ?? data.bucket_90_plus ?? data.range_90_plus ?? 0),
  };
  const total = map['0-30'] + map['31-60'] + map['61-90'] + map['90+'];
  return { map, total };
};

const RISK_COLORS = ['#10B981', '#F59E0B', '#F97316', '#EF4444'];

const AgingBlock: React.FC<{
  title: string;
  data: ReturnType<typeof normalize>;
  emoji: string;
}> = ({ title, data, emoji }) => {
  if (!data || data.total <= 0) return null;
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Text style={{ fontSize: 14 }}>{emoji}</Text>
        <Text style={{ color: palette.dark.text, fontSize: 13, fontWeight: '700' }}>
          {title}
        </Text>
      </View>
      <Text style={{ color: palette.dark.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.5, marginBottom: 12 }}>
        {fmtCurrency(data.total)}
      </Text>

      {/* Stacked bar */}
      <View style={{ flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
        {BUCKETS.map((b, idx) => {
          const value = data.map[b];
          const pct = data.total > 0 ? (value / data.total) * 100 : 0;
          if (pct === 0) return null;
          return <View key={b} style={{ width: `${pct}%`, backgroundColor: RISK_COLORS[idx] }} />;
        })}
      </View>

      <View style={{ gap: 6 }}>
        {BUCKETS.map((b, idx) => {
          const value = data.map[b];
          const pct = data.total > 0 ? (value / data.total) * 100 : 0;
          return (
            <View key={b} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: RISK_COLORS[idx] }} />
              <Text style={{ color: palette.dark.textDim, fontSize: 11, fontWeight: '500', flex: 1 }}>
                {b} días
              </Text>
              <Text style={{ color: palette.dark.text, fontSize: 11, fontWeight: '700' }}>
                {fmtCurrency(value)}
              </Text>
              <Text style={{ color: palette.dark.textMuted, fontSize: 10, fontWeight: '600', width: 36, textAlign: 'right' }}>
                {fmtPct(pct, 0)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export const AgingCards: React.FC<Props> = ({ receivable, payable }) => {
  const cxc = normalize(receivable);
  const cxp = normalize(payable);

  if ((!cxc || cxc.total === 0) && (!cxp || cxp.total === 0)) return null;

  return (
    <View style={{ flexDirection: 'row', gap: 14 }}>
      <AgingBlock title="Por cobrar (CxC)" emoji="💸" data={cxc} />
      <View style={{ width: 1, backgroundColor: palette.dark.border }} />
      <AgingBlock title="Por pagar (CxP)" emoji="📥" data={cxp} />
    </View>
  );
};
