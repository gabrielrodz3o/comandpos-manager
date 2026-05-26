import React, { useState } from 'react';
import { Pressable, Text, ActivityIndicator, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { palette } from '@theme/colors';
import { exportAndSharePdf, type PdfSection } from '@utils/exportPdf';

interface Props {
  title: string;
  subtitle?: string;
  businessName?: string;
  locationName?: string;
  dateRange?: string;
  sections: PdfSection[];
}

export const ExportButton: React.FC<Props> = (props) => {
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (loading) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await exportAndSharePdf(props);
    } catch (e) {
      Alert.alert('Error', 'No se pudo generar el PDF.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      onPress={handle}
      disabled={loading}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 7,
        paddingHorizontal: 12,
        borderRadius: 999,
        backgroundColor: pressed ? palette.dark.soft : palette.dark.surface,
        borderWidth: 1,
        borderColor: palette.dark.border,
        opacity: loading ? 0.6 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.dark.text} />
      ) : (
        <Text style={{ fontSize: 13 }}>📄</Text>
      )}
      <Text style={{ color: palette.dark.text, fontSize: 11, fontWeight: '700' }}>
        {loading ? 'Generando…' : 'Exportar'}
      </Text>
    </Pressable>
  );
};
