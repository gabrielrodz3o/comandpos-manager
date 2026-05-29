import React from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, IconCalendar, IconCart, IconBox, IconUsers, IconCard, IconMoon, IconBot } from '@components/ui';
import { palette } from '@theme/colors';
import { fmtInt } from '@utils/format';
import { useInventory, useEmployees } from '@hooks/useOperations';
import { useVacations, usePurchaseSuggestions } from '@hooks/useApprovals';

interface OpItem {
  key: string;
  href: Href;
  title: string;
  description: string;
  icon: React.ReactNode;
  tint: string;
  badge?: { label: string; color: string; bg: string };
}

export default function OperationsIndex() {
  const router = useRouter();

  const invQ = useInventory(null);
  const empQ = useEmployees();
  const vacQ = useVacations('PENDIENTE');
  const reqQ = usePurchaseSuggestions('PENDING');

  const items = invQ.items ?? [];
  const lowStockCount = items.filter(
    (i) => i.stock_status === 'CRITICAL' || i.stock_status === 'SIN_STOCK' || i.stock_status === 'LOW',
  ).length;

  const totalEmps = empQ.data?.length ?? 0;
  const pendingVacations = vacQ.data?.length ?? 0;
  const pendingReqs = reqQ.data?.length ?? 0;
  const totalApprovals = pendingVacations + pendingReqs;

  const approvals: OpItem[] = [
    {
      key: 'vacations',
      href: '/(tabs)/operations/vacations',
      title: 'Vacaciones',
      description: 'Solicitudes de empleados',
      icon: <IconCalendar color="#10B981" size={22} />,
      tint: '#ECFDF5',
      badge:
        pendingVacations > 0
          ? { label: `${pendingVacations} pendientes`, color: '#92400E', bg: '#FEF3C7' }
          : undefined,
    },
    {
      key: 'requisitions',
      href: '/(tabs)/operations/requisitions',
      title: 'Sugerencias de Compra',
      description: 'Recomendaciones automáticas del sistema',
      icon: <IconCart color="#EA580C" size={22} />,
      tint: '#FFF7ED',
      badge:
        pendingReqs > 0
          ? { label: `${pendingReqs} pendientes`, color: '#92400E', bg: '#FEF3C7' }
          : undefined,
    },
  ];

  const operations: OpItem[] = [
    {
      key: 'inventory',
      href: '/(tabs)/operations/inventory',
      title: 'Inventario',
      description: 'Stock por almacén con alertas',
      icon: <IconBox color="#D97706" size={22} />,
      tint: '#FFFBEB',
      badge:
        lowStockCount > 0
          ? { label: `${lowStockCount} bajos`, color: '#92400E', bg: '#FEF3C7' }
          : undefined,
    },
    {
      key: 'employees',
      href: '/(tabs)/operations/employees',
      title: 'Empleados',
      description: 'Lista de empleados activos',
      icon: <IconUsers color="#2563EB" size={22} />,
      tint: '#EFF6FF',
      badge:
        totalEmps > 0
          ? { label: `${totalEmps}`, color: '#1D4ED8', bg: '#DBEAFE' }
          : undefined,
    },
    {
      key: 'receivables',
      href: '/(tabs)/operations/receivables',
      title: 'Cuentas por Cobrar',
      description: 'Clientes con saldo pendiente',
      icon: <IconCard color="#DB2777" size={22} />,
      tint: '#FDF2F8',
    },
    {
      key: 'shifts',
      href: '/(tabs)/operations/shifts',
      title: 'Calendario de turnos',
      description: 'Vista semanal del equipo',
      icon: <IconCalendar color="#2563EB" size={22} />,
      tint: '#EFF6FF',
    },
    {
      key: 'day-closure',
      href: '/(tabs)/operations/day-closure',
      title: 'Cierre del día',
      description: 'Wizard guiado de cierre operativo',
      icon: <IconMoon color="#0284C7" size={22} />,
      tint: '#F0F9FF',
    },
    {
      key: 'ai',
      href: '/(tabs)/operations/ai-assistant',
      title: 'Asistente IA',
      description: 'Pregunta en lenguaje natural sobre tu negocio',
      icon: <IconBot color="#7C3AED" size={22} />,
      tint: '#F5F3FF',
      badge: { label: 'BETA', color: '#5B21B6', bg: '#EDE9FE' },
    },
  ];

  const onRefresh = () => {
    invQ.refetch();
    empQ.refetch();
    vacQ.refetch();
    reqQ.refetch();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.dark.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
        refreshControl={
          <RefreshControl
            refreshing={invQ.isRefetching || empQ.isRefetching || vacQ.isRefetching || reqQ.isRefetching}
            onRefresh={onRefresh}
          />
        }
      >
        <Text style={{ color: palette.dark.text, fontSize: 28, fontWeight: '700', marginBottom: 4, letterSpacing: -0.7 }}>
          Operaciones
        </Text>
        <Text style={{ color: palette.dark.textDim, fontSize: 13, marginBottom: 22 }}>
          Control operativo en tiempo real
        </Text>

        {/* Approvals section */}
        <View style={{ marginBottom: 22 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text
              style={{
                color: palette.dark.textMuted,
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 1,
              }}
            >
              APROBACIONES
            </Text>
            {totalApprovals > 0 ? (
              <View
                style={{
                  backgroundColor: '#FEF3C7',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: '#92400E', fontSize: 10, fontWeight: '800' }}>
                  {totalApprovals} esperando tu decisión
                </Text>
              </View>
            ) : null}
          </View>

          <View style={{ gap: 10 }}>
            {approvals.map((r) => (
              <OpCard key={r.key} item={r} onPress={() => router.push(r.href)} />
            ))}
          </View>
        </View>

        {/* Operations section */}
        <View>
          <Text
            style={{
              color: palette.dark.textMuted,
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 1,
              marginBottom: 10,
            }}
          >
            INFORMACIÓN
          </Text>
          <View style={{ gap: 10 }}>
            {operations.map((r) => (
              <OpCard key={r.key} item={r} onPress={() => router.push(r.href)} />
            ))}
          </View>
        </View>

        {/* Stats */}
        {items.length > 0 || totalEmps > 0 || totalApprovals > 0 ? (
          <View style={{ marginTop: 24 }}>
            <Text style={{ color: palette.dark.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10 }}>
              ESTADO ACTUAL
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Stat label="A APROBAR" value={fmtInt(totalApprovals)} color={totalApprovals > 0 ? palette.dark.warning : palette.dark.text} hint="pendientes" />
              <Stat label="STOCK BAJO" value={fmtInt(lowStockCount)} color={lowStockCount > 0 ? palette.dark.warning : palette.dark.text} hint={`de ${fmtInt(items.length)}`} />
              <Stat label="EMPLEADOS" value={fmtInt(totalEmps)} color={palette.dark.success} hint="activos" />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const Stat: React.FC<{ label: string; value: string; color: string; hint: string }> = ({
  label,
  value,
  color,
  hint,
}) => (
  <View
    style={{
      flex: 1,
      backgroundColor: palette.dark.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: palette.dark.border,
      padding: 12,
    }}
  >
    <Text style={{ color: palette.dark.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>
      {label}
    </Text>
    <Text style={{ color, fontSize: 18, fontWeight: '800', marginTop: 4 }}>{value}</Text>
    <Text style={{ color: palette.dark.textMuted, fontSize: 10, marginTop: 2 }}>{hint}</Text>
  </View>
);

const OpCard: React.FC<{ item: OpItem; onPress: () => void }> = ({ item: r, onPress }) => (
  <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: palette.dark.text, fontSize: 15, fontWeight: '600', letterSpacing: -0.3 }}>
              {r.title}
            </Text>
            {r.badge ? (
              <View
                style={{
                  backgroundColor: r.badge.bg,
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: 6,
                }}
              >
                <Text style={{ color: r.badge.color, fontSize: 10, fontWeight: '800' }}>
                  {r.badge.label}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={{ color: palette.dark.textDim, fontSize: 12, marginTop: 2 }}>
            {r.description}
          </Text>
        </View>
        <Text style={{ color: palette.dark.textMuted, fontSize: 22 }}>›</Text>
      </View>
    </Card>
  </Pressable>
);
