import React from 'react';
import { View, Text } from 'react-native';
import { Card } from '@components/ui';
import { palette } from '@theme/colors';

interface Props {
  title: string;
  subtitle?: string;
  /** @deprecated usa `icon` (SVG). Se ignora si `icon` está presente. */
  emoji?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const SectionCard: React.FC<Props> = ({ title, subtitle, emoji, icon, children }) => (
  <Card variant="default">
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 }}>
      {icon ? (
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            backgroundColor: palette.dark.primaryDim,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </View>
      ) : emoji ? (
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            backgroundColor: palette.dark.soft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 16 }}>{emoji}</Text>
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={{ color: palette.dark.text, fontSize: 15, fontWeight: '700', letterSpacing: -0.3 }}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ color: palette.dark.textDim, fontSize: 11, fontWeight: '500', marginTop: 1 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
    {children}
  </Card>
);
