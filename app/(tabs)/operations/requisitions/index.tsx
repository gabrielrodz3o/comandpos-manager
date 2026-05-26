import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Card, LoadingState, InlineFetchingBar } from '@components/ui';
import { LocationSelector } from '@components/dashboard/LocationSelector';
import { ActiveLocationBanner } from '@components/reports/ActiveLocationBanner';
import { palette } from '@theme/colors';
import { fmtCurrency, fmtInt } from '@utils/format';
import { usePurchaseSuggestions, useApproveSuggestion } from '@hooks/useApprovals';
import type { PurchaseSuggestion, SuggestionStatus } from '@/types/approvals';

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pendiente', color: '#92400E', bg: '#FEF3C7' },
  APPROVED: { label: 'Aprobada', color: '#065F46', bg: '#D1FAE5' },
  REJECTED: { label: 'Rechazada', color: '#9F1239', bg: '#FECDD3' },
  EXPIRED: { label: 'Expirada', color: '#5C5C66', bg: '#F5F5F7' },
};

const URGENCY_STYLE: Record<number, { label: string; color: string; bg: string; emoji: string }> = {
  1: { label: 'Crítica', color: '#FFFFFF', bg: '#EF4444', emoji: '🚨' },
  2: { label: 'Alta', color: '#FFFFFF', bg: '#F97316', emoji: '🔥' },
  3: { label: 'Media', color: '#92400E', bg: '#FEF3C7', emoji: '⚠️' },
  4: { label: 'Baja', color: '#5C5C66', bg: '#F5F5F7', emoji: '' },
  5: { label: 'Sin urgencia', color: '#9B9BA3', bg: '#F5F5F7', emoji: '' },
};

const TABS: { k: SuggestionStatus | 'ALL'; label: string }[] = [
  { k: 'PENDING', label: 'Pendientes' },
  { k: 'APPROVED', label: 'Aprobadas' },
  { k: 'REJECTED', label: 'Rechazadas' },
];

const fmtDateShort = (raw?: string): string => {
  if (!raw) return '—';
  try {
    return new Date(raw).toLocaleDateString('es-DO', {
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return raw;
  }
};

export default function PurchaseSuggestionsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<SuggestionStatus | 'ALL'>('PENDING');
  const { data, isLoading, isFetching, isRefetching, refetch, error, eff } =
    usePurchaseSuggestions(filter);

  const approveMutation = useApproveSuggestion();
  const [processingId, setProcessingId] = useState<number | null>(null);

  const suggestions = data ?? [];
  const totalEstimated = suggestions.reduce((s, r) => s + Number(r.estimated_total ?? 0), 0);

  const handleApprove = (sug: PurchaseSuggestion) => {
    Alert.alert(
      'Aprobar sugerencia',
      `Aprobar compra de ${sug.item_name} por ${fmtCurrency(sug.estimated_total)}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprobar',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            setProcessingId(sug.id);
            try {
              await approveMutation.mutateAsync({ suggestion_id: sug.id });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (e) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', (e as Error)?.message ?? 'No se pudo aprobar.');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ],
    );
  };

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
              Sugerencias de compra
            </Text>
            <Text style={{ color: palette.dark.textDim, fontSize: 12, fontWeight: '500' }}>
              {fmtInt(suggestions.length)} · {fmtCurrency(totalEstimated)} estimado
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
          {TABS.map(({ k, label }) => {
            const active = filter === k;
            return (
              <Pressable
                key={k}
                onPress={() => setFilter(k)}
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
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <InlineFetchingBar visible={isFetching && !isLoading} />

        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          <ActiveLocationBanner eff={eff} />

          {eff.needsExplicitSelection ? null : isLoading ? (
            <LoadingState label="Cargando sugerencias…" hint="Trayendo recomendaciones del sistema." />
          ) : error ? (
            <Card>
              <Text style={{ color: palette.dark.danger, fontSize: 14, fontWeight: '700' }}>Error</Text>
              <Text style={{ color: palette.dark.textDim, fontSize: 12, marginTop: 4 }}>
                {(error as Error)?.message ?? 'No se pudo cargar.'}
              </Text>
            </Card>
          ) : suggestions.length === 0 ? (
            <Card>
              <Text style={{ color: palette.dark.text, fontSize: 14, fontWeight: '700', textAlign: 'center' }}>
                {filter === 'PENDING' ? '✅ Sin sugerencias pendientes' : 'Sin sugerencias'}
              </Text>
              <Text style={{ color: palette.dark.textDim, fontSize: 12, textAlign: 'center', marginTop: 4 }}>
                {filter === 'PENDING'
                  ? 'El sistema no ha generado nuevas sugerencias.'
                  : 'No hay registros con este filtro.'}
              </Text>
            </Card>
          ) : (
            suggestions.map((s) => {
              const sty = STATUS_STYLE[s.status] ?? STATUS_STYLE.PENDING;
              const urg = URGENCY_STYLE[s.urgency_level] ?? URGENCY_STYLE[3];
              const canApprove = s.status === 'PENDING';
              const isProcessing = processingId === s.id;
              return (
                <Card key={s.id} variant="default">
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: urg.bg,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 18 }}>{urg.emoji || '📦'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: palette.dark.text,
                          fontSize: 14,
                          fontWeight: '700',
                          letterSpacing: -0.2,
                        }}
                        numberOfLines={2}
                      >
                        {s.item_name}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                        <View
                          style={{
                            backgroundColor: urg.bg,
                            paddingHorizontal: 7,
                            paddingVertical: 2,
                            borderRadius: 6,
                          }}
                        >
                          <Text style={{ color: urg.color, fontSize: 9, fontWeight: '800', letterSpacing: 0.3 }}>
                            {urg.label.toUpperCase()}
                          </Text>
                        </View>
                        <View
                          style={{
                            backgroundColor: sty.bg,
                            paddingHorizontal: 7,
                            paddingVertical: 2,
                            borderRadius: 6,
                          }}
                        >
                          <Text style={{ color: sty.color, fontSize: 9, fontWeight: '800', letterSpacing: 0.3 }}>
                            {sty.label.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      marginTop: 12,
                      backgroundColor: palette.dark.soft,
                      borderRadius: 10,
                      padding: 10,
                      gap: 12,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: palette.dark.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>
                        STOCK
                      </Text>
                      <Text style={{ color: palette.dark.text, fontSize: 16, fontWeight: '800', marginTop: 2 }}>
                        {fmtInt(s.current_stock)}
                      </Text>
                      {s.min_level != null ? (
                        <Text style={{ color: palette.dark.textMuted, fontSize: 9, marginTop: 1 }}>
                          mín {fmtInt(s.min_level)}
                        </Text>
                      ) : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: palette.dark.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>
                        SUGERIDO
                      </Text>
                      <Text style={{ color: palette.dark.primary, fontSize: 16, fontWeight: '800', marginTop: 2 }}>
                        +{fmtInt(s.suggested_quantity)}
                      </Text>
                      <Text style={{ color: palette.dark.textMuted, fontSize: 9, marginTop: 1 }}>
                        @ {fmtCurrency(s.suggested_price)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: palette.dark.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>
                        TOTAL
                      </Text>
                      <Text style={{ color: palette.dark.text, fontSize: 16, fontWeight: '800', marginTop: 2 }}>
                        {fmtCurrency(s.estimated_total)}
                      </Text>
                    </View>
                  </View>

                  <View style={{ marginTop: 10, gap: 4 }}>
                    {s.suggested_supplier_name ? (
                      <Text style={{ color: palette.dark.textDim, fontSize: 11 }}>
                        🏢 {s.suggested_supplier_name}
                      </Text>
                    ) : null}
                    {s.warehouse_name ? (
                      <Text style={{ color: palette.dark.textDim, fontSize: 11 }}>
                        📍 {s.warehouse_name}
                      </Text>
                    ) : null}
                    {s.estimated_stockout_date ? (
                      <Text style={{ color: palette.dark.warning, fontSize: 11, fontWeight: '600' }}>
                        ⏰ Stock se agota: {fmtDateShort(s.estimated_stockout_date)}
                      </Text>
                    ) : null}
                    {s.reason ? (
                      <Text style={{ color: palette.dark.textMuted, fontSize: 11, fontStyle: 'italic' }} numberOfLines={2}>
                        💡 {s.reason}
                      </Text>
                    ) : null}
                  </View>

                  {canApprove ? (
                    <Pressable
                      onPress={() => handleApprove(s)}
                      disabled={isProcessing}
                      style={({ pressed }) => ({
                        marginTop: 12,
                        backgroundColor: palette.dark.primary,
                        height: 42,
                        borderRadius: 12,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        gap: 8,
                        opacity: isProcessing ? 0.5 : pressed ? 0.85 : 1,
                      })}
                    >
                      {isProcessing ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>
                          ✓ Aprobar compra
                        </Text>
                      )}
                    </Pressable>
                  ) : null}
                </Card>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
