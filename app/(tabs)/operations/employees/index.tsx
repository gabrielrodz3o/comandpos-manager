import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card, LoadingState, InlineFetchingBar } from '@components/ui';
import { LocationSelector } from '@components/dashboard/LocationSelector';
import { palette } from '@theme/colors';
import { fmtInt } from '@utils/format';
import { useEmployees } from '@hooks/useOperations';
import type { EmployeeBasic } from '@/types/operations';

const initials = (name: string): string =>
  (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '?';

export default function EmployeesScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const { data, isLoading, isFetching, isRefetching, refetch, error } = useEmployees();

  const employees = data ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return employees;
    const q = search.toLowerCase();
    return employees.filter(
      (e) =>
        e.full_name?.toLowerCase().includes(q) ||
        e.employee_code?.toLowerCase().includes(q) ||
        e.department_name?.toLowerCase().includes(q) ||
        e.job_title_name?.toLowerCase().includes(q),
    );
  }, [employees, search]);

  const byDept = useMemo(() => {
    const map = new Map<string, EmployeeBasic[]>();
    filtered.forEach((e) => {
      const k = e.department_name || 'Sin departamento';
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(e);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

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
              Empleados
            </Text>
            <Text style={{ color: palette.dark.textDim, fontSize: 12, fontWeight: '500' }}>
              {fmtInt(filtered.length)} de {fmtInt(employees.length)} activos
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <LocationSelector />
        </View>

        <InlineFetchingBar visible={isFetching && !isLoading} />

        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: palette.dark.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: palette.dark.border,
              paddingHorizontal: 14,
              height: 44,
            }}
          >
            <Text style={{ fontSize: 14, marginRight: 8 }}>🔍</Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar por nombre, código, departamento…"
              placeholderTextColor={palette.dark.textMuted}
              style={{ flex: 1, color: palette.dark.text, fontSize: 13 }}
            />
            {search ? (
              <Pressable onPress={() => setSearch('')}>
                <Text style={{ color: palette.dark.textMuted, fontSize: 16 }}>×</Text>
              </Pressable>
            ) : null}
          </View>

          {isLoading ? (
            <LoadingState
              label="Cargando empleados…"
              hint="Trayendo lista activa de la sucursal."
            />
          ) : error ? (
            <Card>
              <Text style={{ color: palette.dark.danger, fontSize: 14, fontWeight: '700' }}>Error</Text>
              <Text style={{ color: palette.dark.textDim, fontSize: 12, marginTop: 4 }}>
                {(error as Error)?.message ?? 'No se pudieron cargar los empleados.'}
              </Text>
            </Card>
          ) : filtered.length === 0 ? (
            <Card>
              <Text style={{ color: palette.dark.textDim, fontSize: 13, textAlign: 'center' }}>
                {search ? 'Sin resultados para la búsqueda.' : 'Sin empleados activos.'}
              </Text>
            </Card>
          ) : (
            byDept.map(([deptName, list]) => (
              <View key={`dept-${deptName}`}>
                <Text
                  style={{
                    color: palette.dark.textMuted,
                    fontSize: 11,
                    fontWeight: '700',
                    letterSpacing: 1,
                    marginVertical: 6,
                  }}
                >
                  {deptName.toUpperCase()} · {list.length}
                </Text>
                <Card variant="default" padded={false}>
                  {list.map((e, idx) => (
                    <Pressable
                      key={`${e.id}-${idx}`}
                      onPress={() => router.push(`/(tabs)/operations/employees/${e.id}`)}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderTopWidth: idx > 0 ? 0.5 : 0,
                        borderTopColor: palette.dark.border,
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: palette.dark.primaryDim,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ color: palette.dark.success, fontSize: 13, fontWeight: '800' }}>
                          {initials(e.full_name)}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{ color: palette.dark.text, fontSize: 13, fontWeight: '700', letterSpacing: -0.2 }}
                          numberOfLines={1}
                        >
                          {e.full_name}
                        </Text>
                        <Text style={{ color: palette.dark.textMuted, fontSize: 11 }} numberOfLines={1}>
                          {e.employee_code ?? '—'}
                          {e.job_title_name ? ` · ${e.job_title_name}` : ''}
                        </Text>
                      </View>
                      <Text style={{ color: palette.dark.textMuted, fontSize: 18 }}>›</Text>
                    </Pressable>
                  ))}
                </Card>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
