import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card, LoadingState, InlineFetchingBar } from '@components/ui';
import { LocationSelector } from '@components/dashboard/LocationSelector';
import { palette } from '@theme/colors';
import { fmtInt } from '@utils/format';
import { useVacations } from '@hooks/useApprovals';
import type { VacationStatus } from '@/types/approvals';

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  PENDIENTE: { label: 'Pendiente', color: '#92400E', bg: '#FEF3C7' },
  APROBADO: { label: 'Aprobado', color: '#065F46', bg: '#D1FAE5' },
  RECHAZADO: { label: 'Rechazado', color: '#9F1239', bg: '#FECDD3' },
};

const fmtDate = (raw?: string): string => {
  if (!raw) return '—';
  try {
    return new Date(raw).toLocaleDateString('es-DO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return raw;
  }
};

const initials = (name: string): string =>
  (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '?';

const daysBetween = (start: string, end: string): number => {
  try {
    const a = new Date(start).getTime();
    const b = new Date(end).getTime();
    return Math.floor((b - a) / 86_400_000) + 1;
  } catch {
    return 0;
  }
};

export default function VacationsListScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<VacationStatus>('PENDIENTE');
  const { data, isLoading, isFetching, isRefetching, refetch, error } = useVacations(filter);

  const vacations = data ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.dark.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
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
            <Text style={{ color: palette.dark.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.6 }}>
              Vacaciones
            </Text>
            <Text style={{ color: palette.dark.textDim, fontSize: 12, fontWeight: '500' }}>
              {fmtInt(vacations.length)} solicitudes · {STATUS_STYLE[filter]?.label.toLowerCase()}
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <LocationSelector />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 12 }}
        >
          {(['PENDIENTE', 'APROBADO', 'RECHAZADO'] as VacationStatus[]).map((s) => {
            const active = filter === s;
            const sty = STATUS_STYLE[s];
            return (
              <Pressable
                key={s}
                onPress={() => setFilter(s)}
                style={({ pressed }) => ({
                  backgroundColor: active ? palette.dark.text : palette.dark.surface,
                  borderWidth: 1,
                  borderColor: active ? palette.dark.text : palette.dark.border,
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 999,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text
                  style={{
                    color: active ? '#FFFFFF' : palette.dark.text,
                    fontSize: 12,
                    fontWeight: '700',
                  }}
                >
                  {sty?.label ?? s}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <InlineFetchingBar visible={isFetching && !isLoading} />

        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          {isLoading ? (
            <LoadingState label="Cargando solicitudes…" hint="Trayendo vacaciones del equipo." />
          ) : error ? (
            <Card>
              <Text style={{ color: palette.dark.danger, fontSize: 14, fontWeight: '700' }}>Error</Text>
              <Text style={{ color: palette.dark.textDim, fontSize: 12, marginTop: 4 }}>
                {(error as Error)?.message ?? 'No se pudo cargar.'}
              </Text>
            </Card>
          ) : vacations.length === 0 ? (
            <Card>
              <Text style={{ color: palette.dark.text, fontSize: 14, fontWeight: '700', textAlign: 'center' }}>
                {filter === 'PENDIENTE' ? '✅ Sin solicitudes pendientes' : 'Sin solicitudes'}
              </Text>
              <Text style={{ color: palette.dark.textDim, fontSize: 12, textAlign: 'center', marginTop: 4 }}>
                {filter === 'PENDIENTE'
                  ? 'No tienes nada pendiente de aprobar ahora.'
                  : 'No hay registros con este filtro.'}
              </Text>
            </Card>
          ) : (
            vacations.map((v) => {
              const sty = STATUS_STYLE[v.status] ?? STATUS_STYLE.PENDIENTE;
              const days = daysBetween(v.start_date, v.end_date);
              return (
                <Pressable
                  key={v.id}
                  onPress={() => router.push(`/(tabs)/operations/vacations/${v.id}`)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                >
                  <Card variant="default">
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          backgroundColor: palette.dark.primaryDim,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ color: palette.dark.success, fontSize: 14, fontWeight: '800' }}>
                          {initials(v.employee_name)}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text
                            style={{ color: palette.dark.text, fontSize: 14, fontWeight: '700', flex: 1 }}
                            numberOfLines={1}
                          >
                            {v.employee_name}
                          </Text>
                          <View
                            style={{
                              backgroundColor: sty.bg,
                              paddingHorizontal: 7,
                              paddingVertical: 2,
                              borderRadius: 6,
                            }}
                          >
                            <Text
                              style={{
                                color: sty.color,
                                fontSize: 9,
                                fontWeight: '800',
                                letterSpacing: 0.5,
                              }}
                            >
                              {sty.label.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        <Text style={{ color: palette.dark.textMuted, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                          {v.employee_code ?? '—'}
                          {v.department_name ? ` · ${v.department_name}` : ''}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                          <Text style={{ color: palette.dark.text, fontSize: 12, fontWeight: '600' }}>
                            🌴 {fmtDate(v.start_date)} → {fmtDate(v.end_date)}
                          </Text>
                        </View>
                        <Text style={{ color: palette.dark.textDim, fontSize: 11, marginTop: 2 }}>
                          {days} {days === 1 ? 'día' : 'días'}
                          {v.days_balance != null ? ` · saldo ${v.days_balance}d` : ''}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
