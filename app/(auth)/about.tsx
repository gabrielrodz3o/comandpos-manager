import React from 'react';
import { View, Text, ScrollView, Pressable, Linking, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { Card } from '@components/ui';
import { palette, shadow } from '@theme/colors';

const VERSION = Constants.expoConfig?.version ?? '0.1.0';
const rawBuild = Constants.expoConfig?.runtimeVersion;
const BUILD = typeof rawBuild === 'string' ? rawBuild : VERSION;

interface RowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  isLast?: boolean;
}

const Row: React.FC<RowProps> = ({ label, value, onPress, isLast }) => (
  <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed && onPress ? 0.6 : 1 })}>
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: palette.dark.border,
      }}
    >
      <Text style={{ color: palette.dark.textDim, fontSize: 13, fontWeight: '500' }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {value ? (
          <Text style={{ color: palette.dark.text, fontSize: 13, fontWeight: '600' }}>{value}</Text>
        ) : null}
        {onPress ? <Text style={{ color: palette.dark.textMuted, fontSize: 18 }}>›</Text> : null}
      </View>
    </View>
  </Pressable>
);

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.dark.bg }} edges={['top']}>
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
        <Text style={{ color: palette.dark.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.6 }}>
          Acerca de
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 16 }}>
        {/* App brand card */}
        <View
          style={{
            alignItems: 'center',
            paddingVertical: 32,
            backgroundColor: palette.dark.surface,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: palette.dark.border,
            ...shadow.md,
          }}
        >
          <View
            style={{
              width: 84,
              height: 84,
              borderRadius: 22,
              backgroundColor: '#0A0A0B',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
              ...shadow.lg,
            }}
          >
            <Text style={{ fontSize: 38 }}>📊</Text>
          </View>
          <Text style={{ color: palette.dark.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.7 }}>
            ComandPOS
          </Text>
          <Text style={{ color: palette.dark.primary, fontSize: 11, fontWeight: '700', letterSpacing: 3, marginTop: 2 }}>
            MANAGER
          </Text>
          <Text style={{ color: palette.dark.textMuted, fontSize: 12, marginTop: 12 }}>
            v{VERSION} · build {BUILD}
          </Text>
        </View>

        <Card variant="default" padded={false}>
          <View style={{ paddingHorizontal: 18 }}>
            <Row label="Versión" value={VERSION} />
            <Row label="Build" value={BUILD} />
            <Row
              label="Política de Privacidad"
              onPress={() => router.push('/(auth)/privacy')}
            />
            <Row
              label="Términos de Servicio"
              onPress={() => router.push('/(auth)/terms')}
            />
            <Row
              label="Reportar un problema"
              onPress={() => Linking.openURL('mailto:soporte@comandpos.com?subject=Bug%20Report')}
              isLast
            />
          </View>
        </Card>

        <View style={{ alignItems: 'center', marginTop: 16 }}>
          <Text style={{ color: palette.dark.textMuted, fontSize: 11, fontWeight: '500' }}>
            © {new Date().getFullYear()} ComandPOS · Hecho en República Dominicana
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
