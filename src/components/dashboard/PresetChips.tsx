import React from 'react';
import { ScrollView, Pressable, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useFiltersStore } from '@store/useFiltersStore';
import { datePresets } from '@utils/dates';
import { palette } from '@theme/colors';

interface PresetChipsProps {
  onChange?: () => void;
}

export const PresetChips: React.FC<PresetChipsProps> = ({ onChange }) => {
  const active = useFiltersStore((s) => s.activePresetDays);
  const apply = useFiltersStore((s) => s.applyPreset);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
    >
      {datePresets.map((p) => {
        const isActive = active === p.days;
        return (
          <Pressable
            key={p.key}
            onPress={() => {
              Haptics.selectionAsync();
              apply(p.days);
              onChange?.();
            }}
            style={({ pressed }) => ({
              backgroundColor: isActive ? palette.dark.text : palette.dark.surface,
              borderWidth: 1,
              borderColor: isActive ? palette.dark.text : palette.dark.border,
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 999,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text
              style={{
                color: isActive ? '#FFFFFF' : palette.dark.text,
                fontSize: 13,
                fontWeight: '600',
                letterSpacing: -0.1,
              }}
            >
              {p.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};
