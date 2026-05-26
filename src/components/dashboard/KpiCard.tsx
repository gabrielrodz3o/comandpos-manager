import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, shadow } from '@theme/colors';

interface KpiCardProps {
  label: string;
  value: string;
  emoji?: string;
  delta?: number;
  hint?: string;
  accent?: string;
  variant?: 'default' | 'hero';
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  emoji,
  delta,
  hint,
  accent,
  variant = 'default',
}) => {
  const c = palette.dark;
  const isHero = variant === 'hero';
  const showDelta = typeof delta === 'number' && Number.isFinite(delta);
  const positive = (delta ?? 0) >= 0;

  const heroGradient: [string, string] = [accent ?? '#0A0A0B', '#1F1F23'];

  if (isHero) {
    return (
      <LinearGradient
        colors={heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 22,
          padding: 22,
          minHeight: 138,
          ...shadow.lg,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text
            style={{
              color: 'rgba(255,255,255,0.72)',
              fontSize: 11,
              fontWeight: '600',
              letterSpacing: 1.4,
              textTransform: 'uppercase',
            }}
          >
            {label}
          </Text>
          {emoji ? <Text style={{ fontSize: 20 }}>{emoji}</Text> : null}
        </View>

        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 32,
            fontWeight: '800',
            letterSpacing: -1,
            marginTop: 10,
          }}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {value}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 }}>
          {showDelta ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.14)',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
                gap: 3,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>
                {positive ? '↑' : '↓'} {Math.abs(delta!).toFixed(1)}%
              </Text>
            </View>
          ) : null}
          {hint ? (
            <Text
              style={{ color: 'rgba(255,255,255,0.72)', fontSize: 11.5, fontWeight: '500', flex: 1 }}
              numberOfLines={1}
            >
              {hint}
            </Text>
          ) : null}
        </View>
      </LinearGradient>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.surface,
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: c.border,
        minHeight: 110,
        ...shadow.sm,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text
          style={{
            color: c.textDim,
            fontSize: 10.5,
            fontWeight: '600',
            letterSpacing: 1.2,
            textTransform: 'uppercase',
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
        {emoji ? <Text style={{ fontSize: 16 }}>{emoji}</Text> : null}
      </View>

      <Text
        style={{
          color: c.text,
          fontSize: 20,
          fontWeight: '700',
          letterSpacing: -0.5,
          marginTop: 8,
        }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 }}>
        {showDelta ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: positive ? '#ECFDF5' : '#FEF2F2',
              paddingHorizontal: 7,
              paddingVertical: 2,
              borderRadius: 6,
            }}
          >
            <Text
              style={{
                color: positive ? c.success : c.danger,
                fontSize: 10.5,
                fontWeight: '700',
              }}
            >
              {positive ? '↑' : '↓'} {Math.abs(delta!).toFixed(1)}%
            </Text>
          </View>
        ) : null}
        {hint ? (
          <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: '500', flex: 1 }} numberOfLines={1}>
            {hint}
          </Text>
        ) : null}
      </View>
    </View>
  );
};
