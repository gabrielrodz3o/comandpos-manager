import React from 'react';
import { View, Text } from 'react-native';
import { palette } from '@theme/colors';
import type { Insight, InsightSeverity } from '@utils/insights';

interface Props {
  insights: Insight[];
}

const SEVERITY_COLORS: Record<
  InsightSeverity,
  { bg: string; border: string; title: string; body: string }
> = {
  positive: { bg: '#ECFDF5', border: '#A7F3D0', title: '#065F46', body: '#047857' },
  warning: { bg: '#FFFBEB', border: '#FDE68A', title: '#92400E', body: '#B45309' },
  critical: { bg: '#FEF2F2', border: '#FECACA', title: '#991B1B', body: '#B91C1C' },
  info: { bg: '#EFF6FF', border: '#BFDBFE', title: '#1E3A8A', body: '#1D4ED8' },
};

export const InsightsPanel: React.FC<Props> = ({ insights }) => {
  if (insights.length === 0) return null;

  return (
    <View style={{ gap: 10 }}>
      {insights.map((i) => {
        const c = SEVERITY_COLORS[i.severity];
        return (
          <View
            key={i.id}
            style={{
              backgroundColor: c.bg,
              borderWidth: 1,
              borderColor: c.border,
              borderRadius: 14,
              padding: 14,
              flexDirection: 'row',
              gap: 12,
            }}
          >
            <Text style={{ fontSize: 22 }}>{i.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: c.title,
                  fontSize: 13,
                  fontWeight: '800',
                  letterSpacing: -0.2,
                }}
              >
                {i.title}
              </Text>
              <Text
                style={{
                  color: c.body,
                  fontSize: 12,
                  marginTop: 3,
                  lineHeight: 17,
                }}
              >
                {i.description}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};
