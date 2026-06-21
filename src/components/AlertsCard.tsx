// "Qué necesita atención" — alertas del negocio del vigilante de Comandi.
// On-demand (POST /comandi/watchdog/check). Tap en una alerta → abre el chat de Comandi.
import React from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { palette } from '@/theme/colors';
import { fontSize, fontWeight } from '@/theme/typography';
import { useAlerts } from '@/hooks/useComandi';

const c = palette.dark;
const LOGO = require('../../assets/comandi.png');

export default function AlertsCard() {
  const router = useRouter();
  const { data, isLoading, isError } = useAlerts();
  const alerts = data?.alerts || [];

  if (isError) return null; // si Comandi falla, no metemos ruido en el dashboard

  return (
    <View style={s.card}>
      <View style={s.head}>
        <Image source={LOGO} style={s.logo} resizeMode="contain" />
        <Text style={s.title}>Qué necesita atención</Text>
        {!isLoading && (
          <View style={[s.badge, alerts.length ? s.badgeOn : s.badgeOff]}>
            <Text style={[s.badgeText, alerts.length ? { color: '#fff' } : { color: c.textMuted }]}>{alerts.length}</Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color={c.primary} style={{ paddingVertical: 14 }} />
      ) : alerts.length === 0 ? (
        <View style={s.ok}>
          <Text style={s.okText}>✓ Todo en orden por ahora.</Text>
        </View>
      ) : (
        alerts.map((a, i) => (
          <Pressable key={i} style={s.alert} onPress={() => router.push('/(tabs)/comandi')}>
            <Text style={s.dot}>{a.severity === 'alta' ? '🔴' : '🟠'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.aTitle}>{a.title}</Text>
              <Text style={s.aDetail}>{a.detail}</Text>
            </View>
            <Text style={s.chev}>›</Text>
          </Pressable>
        ))
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: c.surface, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: 14, marginBottom: 14 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  logo: { width: 22, height: 22, borderRadius: 6 },
  title: { flex: 1, fontSize: fontSize.base, fontWeight: fontWeight.bold as any, color: c.text },
  badge: { minWidth: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  badgeOn: { backgroundColor: c.danger },
  badgeOff: { backgroundColor: c.soft },
  badgeText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold as any },
  ok: { paddingVertical: 10 },
  okText: { color: c.textDim, fontSize: fontSize.sm },
  alert: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: c.border },
  dot: { fontSize: 14 },
  aTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold as any, color: c.text },
  aDetail: { fontSize: fontSize.sm, color: c.textDim, marginTop: 1 },
  chev: { fontSize: 22, color: c.textMuted },
});
