import React from 'react';
import { View, Text, Modal, Pressable, ScrollView } from 'react-native';
import { palette } from '@theme/colors';
import { fmtCurrency, fmtInt } from '@utils/format';

export interface DataPointDetail {
  label: string;
  /** Etiqueta del eje X (fecha, categoría, etc.) */
  category?: string;
  series: Array<{
    label: string;
    value: number;
    color: string;
    formatter?: (v: number) => string;
  }>;
}

interface Props {
  visible: boolean;
  detail: DataPointDetail | null;
  onClose: () => void;
}

export const ChartDetailModal: React.FC<Props> = ({ visible, detail, onClose }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable
      onPress={onClose}
      style={{ flex: 1, backgroundColor: palette.dark.overlay, justifyContent: 'flex-end' }}
    >
      <Pressable
        onPress={(e) => e.stopPropagation()}
        style={{
          backgroundColor: palette.dark.surface,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingTop: 14,
          paddingBottom: 36,
          maxHeight: '75%',
        }}
      >
        <View
          style={{
            width: 40,
            height: 5,
            borderRadius: 3,
            backgroundColor: palette.dark.borderHi,
            alignSelf: 'center',
            marginBottom: 16,
          }}
        />
        {detail ? (
          <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 12 }}>
            <Text style={{ color: palette.dark.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
              {detail.category?.toUpperCase() ?? 'DETALLE'}
            </Text>
            <Text style={{ color: palette.dark.text, fontSize: 22, fontWeight: '800', marginTop: 4, letterSpacing: -0.5 }}>
              {detail.label}
            </Text>

            <View style={{ marginTop: 18, gap: 12 }}>
              {detail.series.map((s, idx) => (
                <View
                  key={`series-${idx}`}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 10,
                    borderBottomWidth: idx < detail.series.length - 1 ? 0.5 : 0,
                    borderBottomColor: palette.dark.border,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <View
                      style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: s.color }}
                    />
                    <Text style={{ color: palette.dark.text, fontSize: 14, fontWeight: '600', flex: 1 }}>
                      {s.label}
                    </Text>
                  </View>
                  <Text
                    style={{ color: palette.dark.text, fontSize: 16, fontWeight: '800', letterSpacing: -0.3 }}
                  >
                    {s.formatter ? s.formatter(s.value) : fmtCurrency(s.value)}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        ) : null}
      </Pressable>
    </Pressable>
  </Modal>
);

export { fmtCurrency, fmtInt };
