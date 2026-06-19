import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Card } from '@components/ui';
import { palette } from '@theme/colors';

interface Props {
  title: string;
  subtitle?: string;
  /** @deprecated usa `icon` (SVG). Se ignora si `icon` está presente. */
  emoji?: string;
  icon?: React.ReactNode;
  /** Si se pasa, el encabezado es tocable y muestra "Ver ›" para ir al detalle. */
  onPress?: () => void;
  children: React.ReactNode;
}

export const SectionCard: React.FC<Props> = ({ title, subtitle, emoji, icon, onPress, children }) => (
  <Card variant="default">
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 10,
        opacity: pressed && onPress ? 0.6 : 1,
      })}
    >
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
      {onPress ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Text style={{ color: palette.dark.primary, fontSize: 12, fontWeight: '700' }}>Ver</Text>
          <Text style={{ color: palette.dark.primary, fontSize: 16, fontWeight: '700' }}>›</Text>
        </View>
      ) : null}
    </Pressable>
    {children}
  </Card>
);
