import React from 'react';
import { View, Text } from 'react-native';
import { Card } from '@components/ui';
import { palette } from '@theme/colors';

interface Props {
  title: string;
  subtitle?: string;
  emoji?: string;
  children: React.ReactNode;
}

export const SectionCard: React.FC<Props> = ({ title, subtitle, emoji, children }) => (
  <Card variant="default">
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 }}>
      {emoji ? (
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
