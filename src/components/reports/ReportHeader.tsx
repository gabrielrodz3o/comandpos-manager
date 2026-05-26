import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { palette } from '@theme/colors';
import { PresetChips } from '@components/dashboard/PresetChips';
import { LocationSelector } from '@components/dashboard/LocationSelector';

interface Props {
  title: string;
  subtitle?: string;
  showLocation?: boolean;
  actions?: React.ReactNode;
}

export const ReportHeader: React.FC<Props> = ({ title, subtitle, showLocation = true, actions }) => {
  const router = useRouter();

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom: 12,
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: palette.dark.soft,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ color: palette.dark.text, fontSize: 18, fontWeight: '600' }}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: palette.dark.text,
              fontSize: 22,
              fontWeight: '700',
              letterSpacing: -0.6,
            }}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text style={{ color: palette.dark.textDim, fontSize: 12, fontWeight: '500', marginTop: 1 }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {actions ? <View>{actions}</View> : null}
      </View>

      <View style={{ marginBottom: 12 }}>
        <PresetChips />
      </View>

      {showLocation ? (
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <LocationSelector />
        </View>
      ) : null}
    </View>
  );
};
