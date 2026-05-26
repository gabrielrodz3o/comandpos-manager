import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Card, LoadingState } from '@components/ui';
import { SectionCard } from '@components/dashboard/SectionCard';
import { palette, shadow } from '@theme/colors';
import { fmtInt } from '@utils/format';
import { useVacations, useApproveVacation } from '@hooks/useApprovals';

const fmtDateLong = (raw?: string): string => {
  if (!raw) return '—';
  try {
    return new Date(raw).toLocaleDateString('es-DO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return raw;
  }
};

const daysBetween = (start: string, end: string): number => {
  try {
    const a = new Date(start).getTime();
    const b = new Date(end).getTime();
    return Math.floor((b - a) / 86_400_000) + 1;
  } catch {
    return 0;
  }
};

const initials = (name: string): string =>
  (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '?';

const KvRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View
    style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 9,
      borderBottomWidth: 0.5,
      borderBottomColor: palette.dark.border,
    }}
  >
    <Text style={{ color: palette.dark.textDim, fontSize: 12, fontWeight: '500' }}>{label}</Text>
    <Text
      style={{ color: palette.dark.text, fontSize: 13, fontWeight: '600', textAlign: 'right', flex: 1 }}
      numberOfLines={2}
    >
      {value}
    </Text>
  </View>
);

export default function VacationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const vacationId = Number(id);

  // Buscamos en la cache (pendientes y aprobadas) para encontrar la solicitud
  const pendingQ = useVacations('PENDIENTE');
  const approvedQ = useVacations('APROBADO');
  const rejectedQ = useVacations('RECHAZADO');

  const all = [
    ...(pendingQ.data ?? []),
    ...(approvedQ.data ?? []),
    ...(rejectedQ.data ?? []),
  ];
  const vacation = all.find((v) => v.id === vacationId);

  const approveMutation = useApproveVacation();
  const [processing, setProcessing] = useState(false);

  const isLoading = pendingQ.isLoading && !vacation;
  const isPending = vacation?.status === 'PENDIENTE';

  const handleAction = (action: 'APROBADO' | 'RECHAZADO') => {
    if (!vacation) return;
    Alert.alert(
      action === 'APROBADO' ? 'Aprobar solicitud' : 'Rechazar solicitud',
      `¿Confirmas ${action.toLowerCase()} las vacaciones de ${vacation.employee_name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: action === 'APROBADO' ? 'Aprobar' : 'Rechazar',
          style: action === 'RECHAZADO' ? 'destructive' : 'default',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            setProcessing(true);
            try {
              await approveMutation.mutateAsync({ id: vacation.id, action });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert(
                'Listo',
                `Solicitud ${action === 'APROBADO' ? 'aprobada' : 'rechazada'} correctamente.`,
                [{ text: 'OK', onPress: () => router.back() }],
              );
            } catch (e) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', (e as Error)?.message ?? 'No se pudo procesar.');
            } finally {
              setProcessing(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.dark.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: isPending ? 200 : 140 }}>
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
          <Text style={{ color: palette.dark.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>
            SOLICITUD DE VACACIONES
          </Text>
        </View>

        {isLoading ? (
          <View style={{ paddingHorizontal: 16 }}>
            <LoadingState label="Cargando solicitud…" />
          </View>
        ) : !vacation ? (
          <View style={{ paddingHorizontal: 16 }}>
            <Card>
              <Text style={{ color: palette.dark.textDim, fontSize: 13, textAlign: 'center' }}>
                Solicitud no encontrada.
              </Text>
            </Card>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, gap: 14 }}>
            {/* Hero */}
            <Card variant="default">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: palette.dark.primaryDim,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: palette.dark.success, fontSize: 18, fontWeight: '800' }}>
                    {initials(vacation.employee_name)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ color: palette.dark.text, fontSize: 16, fontWeight: '700', letterSpacing: -0.3 }}
                    numberOfLines={1}
                  >
                    {vacation.employee_name}
                  </Text>
                  <Text style={{ color: palette.dark.textMuted, fontSize: 12, marginTop: 2 }}>
                    {vacation.employee_code ?? '—'}
                    {vacation.department_name ? ` · ${vacation.department_name}` : ''}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  marginTop: 16,
                  paddingTop: 16,
                  borderTopWidth: 0.5,
                  borderTopColor: palette.dark.border,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: palette.dark.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>
                  DÍAS SOLICITADOS
                </Text>
                <Text
                  style={{
                    color: palette.dark.text,
                    fontSize: 38,
                    fontWeight: '800',
                    marginTop: 4,
                    letterSpacing: -1,
                  }}
                >
                  {daysBetween(vacation.start_date, vacation.end_date)}
                </Text>
                <Text style={{ color: palette.dark.textDim, fontSize: 12, marginTop: 4 }}>
                  {fmtDateLong(vacation.start_date)}
                </Text>
                <Text style={{ color: palette.dark.textMuted, fontSize: 11 }}>al</Text>
                <Text style={{ color: palette.dark.textDim, fontSize: 12 }}>
                  {fmtDateLong(vacation.end_date)}
                </Text>
              </View>
            </Card>

            <SectionCard title="Saldo de vacaciones" emoji="📊">
              <KvRow label="Año" value={String(vacation.period_year ?? '—')} />
              <KvRow label="Días ganados" value={fmtInt(vacation.days_earned)} />
              <KvRow label="Días tomados" value={fmtInt(vacation.days_taken)} />
              <KvRow label="Saldo disponible" value={`${fmtInt(vacation.days_balance)} días`} />
            </SectionCard>

            <SectionCard title="Detalles" emoji="📋">
              <KvRow label="Status" value={vacation.status} />
              <KvRow label="Solicitada" value={fmtDateLong(vacation.created_at)} />
              {vacation.approved_by_name ? (
                <KvRow label="Aprobada por" value={vacation.approved_by_name} />
              ) : null}
              {vacation.notes ? <KvRow label="Notas" value={vacation.notes} /> : null}
            </SectionCard>
          </View>
        )}
      </ScrollView>

      {/* Botones de acción */}
      {isPending && vacation ? (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: palette.dark.surface,
            borderTopWidth: 1,
            borderTopColor: palette.dark.border,
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: 24,
            flexDirection: 'row',
            gap: 10,
            ...shadow.lg,
          }}
        >
          <Pressable
            onPress={() => handleAction('RECHAZADO')}
            disabled={processing}
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: '#FEF2F2',
              borderWidth: 1,
              borderColor: '#FECACA',
              height: 50,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: processing ? 0.5 : pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ color: palette.dark.danger, fontSize: 14, fontWeight: '700' }}>
              ✕ Rechazar
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleAction('APROBADO')}
            disabled={processing}
            style={({ pressed }) => ({
              flex: 2,
              backgroundColor: palette.dark.primary,
              height: 50,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              opacity: processing ? 0.5 : pressed ? 0.85 : 1,
              ...shadow.lg,
            })}
          >
            {processing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>✓ Aprobar</Text>
            )}
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
