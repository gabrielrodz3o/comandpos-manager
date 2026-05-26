import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card, LoadingState, InlineFetchingBar } from '@components/ui';
import { palette } from '@theme/colors';
import { fmtInt } from '@utils/format';
import { useShiftCalendar } from '@hooks/useOperations';
import { isoDate } from '@utils/dates';
import type { ShiftEmployee } from '@services/operations';

const DAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const startOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date: Date, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const fmtDay = (d: Date): string =>
  d.toLocaleDateString('es-DO', { day: '2-digit', month: 'short' });

const initials = (name: string): string =>
  (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '?';

export default function ShiftsScreen() {
  const router = useRouter();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const { data, isLoading, isFetching, isRefetching, refetch, error } = useShiftCalendar(
    isoDate(weekStart),
    isoDate(weekEnd),
  );

  const employees = data?.employees ?? [];

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
              Calendario de turnos
            </Text>
            <Text style={{ color: palette.dark.textDim, fontSize: 12, fontWeight: '500' }}>
              {fmtDay(weekStart)} → {fmtDay(weekEnd)} · {fmtInt(employees.length)} empleados
            </Text>
          </View>
        </View>

        {/* Navegación de semana */}
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: 16,
            marginBottom: 12,
            gap: 8,
          }}
        >
          <Pressable
            onPress={() => setWeekStart((d) => addDays(d, -7))}
            style={({ pressed }) => ({
              flex: 1,
              height: 38,
              borderRadius: 10,
              backgroundColor: palette.dark.surface,
              borderWidth: 1,
              borderColor: palette.dark.border,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ color: palette.dark.text, fontSize: 12, fontWeight: '600' }}>
              ← Anterior
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setWeekStart(startOfWeek(new Date()))}
            style={({ pressed }) => ({
              flex: 1,
              height: 38,
              borderRadius: 10,
              backgroundColor: palette.dark.text,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>Hoy</Text>
          </Pressable>
          <Pressable
            onPress={() => setWeekStart((d) => addDays(d, 7))}
            style={({ pressed }) => ({
              flex: 1,
              height: 38,
              borderRadius: 10,
              backgroundColor: palette.dark.surface,
              borderWidth: 1,
              borderColor: palette.dark.border,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ color: palette.dark.text, fontSize: 12, fontWeight: '600' }}>
              Siguiente →
            </Text>
          </Pressable>
        </View>

        <InlineFetchingBar visible={isFetching && !isLoading} />

        <View style={{ paddingHorizontal: 16 }}>
          {isLoading ? (
            <LoadingState label="Cargando turnos…" hint="Trayendo asignaciones de la semana." />
          ) : error ? (
            <Card>
              <Text style={{ color: palette.dark.danger, fontSize: 14, fontWeight: '700' }}>Error</Text>
              <Text style={{ color: palette.dark.textDim, fontSize: 12, marginTop: 4 }}>
                {(error as Error)?.message ?? 'No se pudo cargar el calendario.'}
              </Text>
            </Card>
          ) : employees.length === 0 ? (
            <Card>
              <Text style={{ color: palette.dark.textDim, fontSize: 13, textAlign: 'center' }}>
                Sin empleados en esta semana.
              </Text>
            </Card>
          ) : (
            <>
              {/* Header de días */}
              <View
                style={{
                  flexDirection: 'row',
                  paddingHorizontal: 8,
                  paddingVertical: 8,
                  backgroundColor: palette.dark.soft,
                  borderRadius: 10,
                  marginBottom: 6,
                }}
              >
                <View style={{ width: 100 }} />
                {DAYS.map((d, idx) => (
                  <View
                    key={d}
                    style={{ flex: 1, alignItems: 'center' }}
                  >
                    <Text style={{ color: palette.dark.textMuted, fontSize: 10, fontWeight: '700' }}>
                      {d}
                    </Text>
                    <Text style={{ color: palette.dark.textDim, fontSize: 9, marginTop: 1 }}>
                      {days[idx].getDate()}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Filas por empleado */}
              <Card variant="default" padded={false}>
                {employees.slice(0, 30).map((emp: ShiftEmployee, idx: number) => (
                  <View
                    key={`emp-${emp.employee_id}`}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 8,
                      paddingVertical: 10,
                      borderTopWidth: idx > 0 ? 0.5 : 0,
                      borderTopColor: palette.dark.border,
                    }}
                  >
                    <View
                      style={{
                        width: 100,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <View
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          backgroundColor: palette.dark.primaryDim,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ color: palette.dark.success, fontSize: 9, fontWeight: '800' }}>
                          {initials(emp.employee_name)}
                        </Text>
                      </View>
                      <Text
                        style={{ color: palette.dark.text, fontSize: 10, fontWeight: '600', flex: 1 }}
                        numberOfLines={2}
                      >
                        {emp.employee_name.split(' ')[0]}
                      </Text>
                    </View>
                    {days.map((d, dayIdx) => {
                      // Default shift cells
                      const hasShift = !!emp.default_shift_id;
                      return (
                        <View
                          key={`cell-${dayIdx}`}
                          style={{
                            flex: 1,
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingVertical: 4,
                          }}
                        >
                          {hasShift ? (
                            <View
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: 6,
                                backgroundColor: emp.default_is_night
                                  ? '#312E81'
                                  : palette.dark.primary,
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '800' }}>
                                {emp.default_is_night ? '🌙' : '☀️'}
                              </Text>
                            </View>
                          ) : (
                            <Text style={{ color: palette.dark.textMuted, fontSize: 14 }}>·</Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                ))}
              </Card>

              {/* Leyenda */}
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 14, justifyContent: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 4,
                      backgroundColor: palette.dark.primary,
                    }}
                  />
                  <Text style={{ color: palette.dark.textDim, fontSize: 11 }}>Turno diurno</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 4,
                      backgroundColor: '#312E81',
                    }}
                  />
                  <Text style={{ color: palette.dark.textDim, fontSize: 11 }}>Turno nocturno</Text>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
