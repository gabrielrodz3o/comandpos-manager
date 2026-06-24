import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, IconCart, IconUsers, IconMoney, IconTrend, IconInvoice } from '@components/ui';
import { palette } from '@theme/colors';

interface ReportItem {
  key: string;
  href: Href | null;
  title: string;
  description: string;
  icon: React.ReactNode;
  tint: string;
  comingSoon?: boolean;
}

const REPORTS: ReportItem[] = [
  { key: 'sales',              href: '/(tabs)/reports/sales',          title: 'Ventas',           description: 'Resumen, productos, pagos y caja', icon: <IconCart color="#10B981" size={22} />, tint: '#ECFDF5' },
  { key: 'waiter-sales',       href: '/(tabs)/reports/waiter-sales',   title: 'Por Mesero',       description: 'Performance del equipo de salón',  icon: <IconUsers color="#2563EB" size={22} />, tint: '#EFF6FF' },
  { key: 'tips-analysis',      href: '/(tabs)/reports/tips-analysis',  title: 'Propinas',         description: 'Análisis y distribución',          icon: <IconMoney color="#D97706" size={22} />, tint: '#FFFBEB' },
  { key: 'profit-loss',        href: '/(tabs)/reports/profit-loss',        title: 'Estado de Resultados', description: 'P&L del período',                  icon: <IconTrend color="#7C3AED" size={22} />, tint: '#F5F3FF' },
  { key: 'cost-analysis',      href: '/(tabs)/reports/cost-analysis',      title: 'Análisis de Costos',   description: 'Food cost, margen y rentabilidad', icon: <IconTrend color="#0891B2" size={22} />, tint: '#ECFEFF' },
  { key: 'cash-position',      href: '/(tabs)/reports/cash-position',      title: 'Posición de Efectivo', description: 'Cajas, bóveda y bancos consolidados', icon: <IconMoney color="#059669" size={22} />, tint: '#ECFDF5' },
  { key: 'purchases-expenses', href: '/(tabs)/reports/purchases-expenses', title: 'Compras y Gastos',     description: 'Proveedores y categorías',         icon: <IconInvoice color="#DB2777" size={22} />, tint: '#FDF2F8' },
  { key: 'control',            href: '/(tabs)/reports/control',            title: 'Control / Auditoría',  description: 'Descuentos, cortesías, anulados, precios', icon: <IconInvoice color="#DC2626" size={22} />, tint: '#FEF2F2' },
  { key: 'boxes',              href: '/(tabs)/reports/boxes',              title: 'Cajas',                description: 'Aperturas, cierres y diferencias', icon: <IconMoney color="#0D9488" size={22} />, tint: '#F0FDFA' },
];

export default function ReportsIndex() {
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.dark.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <Text style={{ color: palette.dark.text, fontSize: 28, fontWeight: '700', marginBottom: 4, letterSpacing: -0.7 }}>
          Reportes
        </Text>
        <Text style={{ color: palette.dark.textDim, fontSize: 13, marginBottom: 22, fontWeight: '400' }}>
          Selecciona un reporte para ver el detalle.
        </Text>

        <View style={{ gap: 10 }}>
          {REPORTS.map((r) => (
            <Pressable
              key={r.key}
              onPress={() => {
                if (r.href) router.push(r.href);
              }}
              disabled={!r.href}
              style={({ pressed }) => ({ opacity: pressed && r.href ? 0.85 : r.href ? 1 : 0.55 })}
            >
              <Card variant="default">
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      backgroundColor: r.tint,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {r.icon}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ color: palette.dark.text, fontSize: 15, fontWeight: '600', letterSpacing: -0.3 }}>
                        {r.title}
                      </Text>
                      {r.comingSoon ? (
                        <View
                          style={{
                            backgroundColor: palette.dark.soft,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 6,
                          }}
                        >
                          <Text style={{ color: palette.dark.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>
                            PRONTO
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={{ color: palette.dark.textDim, fontSize: 12, marginTop: 2, fontWeight: '400' }}>
                      {r.description}
                    </Text>
                  </View>
                  <Text style={{ color: palette.dark.textMuted, fontSize: 22 }}>›</Text>
                </View>
              </Card>
            </Pressable>
          ))}
        </View>

        <View style={{ alignItems: 'center', marginTop: 24 }}>
          <Text style={{ color: palette.dark.textMuted, fontSize: 11 }}>
            Pantallas detalladas vienen en FASE 4–5.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
