import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Card, LoadingState, InlineFetchingBar, RangePickerSheet, fmtTime12 } from '@components/ui';
import type { RangeSelection } from '@components/ui';
import { LocationSelector } from '@components/dashboard/LocationSelector';
import { ActiveLocationBanner } from '@components/reports/ActiveLocationBanner';
import { palette, shadow } from '@theme/colors';
import { fmtCurrency, fmtInt } from '@utils/format';
import { useInvoicesSearchInfinite } from '@hooks/useManagement';
import { isoDate } from '@utils/dates';
import type { InvoiceSearchResult } from '@/types/management';

interface RangePreset {
  key: string;
  label: string;
  days: number;
}

const PRESETS: RangePreset[] = [
  { key: 'today', label: 'Hoy', days: 0 },
  { key: '7d', label: '7 días', days: 6 },
  { key: 'month', label: 'Mes', days: -1 },
  { key: '30d', label: '30 días', days: 29 },
  { key: '90d', label: '90 días', days: 89 },
];

const computeRange = (preset: RangePreset): { start: string; end: string } => {
  const end = new Date();
  let start = new Date();
  if (preset.days === -1) {
    start = new Date(end.getFullYear(), end.getMonth(), 1);
  } else if (preset.days === -2) {
    start = new Date(end.getFullYear(), 0, 1);
  } else {
    start.setDate(end.getDate() - preset.days);
  }
  return { start: isoDate(start), end: isoDate(end) };
};

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

const fmtDateTime = (raw?: string): string => {
  if (!raw) return '—';
  try {
    return new Date(raw).toLocaleString('es-DO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return raw;
  }
};

export default function InvoicesScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activePresetKey, setActivePresetKey] = useState<string>('7d');
  const [custom, setCustom] = useState<RangeSelection | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const activePreset = useMemo(
    () => PRESETS.find((p) => p.key === activePresetKey) ?? PRESETS[1],
    [activePresetKey],
  );
  // Rango efectivo: personalizado (con hora opcional) o el del preset.
  const range = useMemo(
    () =>
      custom
        ? { start: custom.start, end: custom.end }
        : computeRange(activePreset),
    [custom, activePreset],
  );
  const startTime = custom?.startTime ?? null;
  const endTime = custom?.endTime ?? null;

  // El backend de búsqueda compara timestamps directos: mandamos el día
  // completo (o la franja horaria elegida) para no excluir las facturas de hoy.
  const queryStart = `${range.start} ${startTime ? `${startTime}:00` : '00:00:00'}`;
  const queryEnd = `${range.end} ${endTime ? `${endTime}:59` : '23:59:59'}`;

  const {
    invoices,
    total,
    isLoading,
    isFetching,
    isRefetching,
    refetch,
    error,
    eff,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInvoicesSearchInfinite({
    search: search.trim() || undefined,
    start_date: queryStart,
    end_date: queryEnd,
  });

  const totalAmount = invoices.reduce(
    (s: number, i: InvoiceSearchResult) => s + Number(i.total_amount ?? 0),
    0,
  );

  const handlePresetChange = (key: string) => {
    Haptics.selectionAsync();
    setCustom(null);
    setActivePresetKey(key);
  };

  const handleScroll = ({
    nativeEvent,
  }: {
    nativeEvent: {
      layoutMeasurement: { height: number };
      contentOffset: { y: number };
      contentSize: { height: number };
    };
  }) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    const nearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 120;
    if (nearBottom && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.dark.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        onScroll={handleScroll}
        scrollEventThrottle={250}
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
              Facturas
            </Text>
            <Text style={{ color: palette.dark.textDim, fontSize: 12, fontWeight: '500' }}>
              {fmtDateShort(range.start)} → {fmtDateShort(range.end)}
              {startTime && endTime ? ` · ${fmtTime12(startTime)}–${fmtTime12(endTime)}` : ''} ·{' '}
              {fmtInt(total)} · {fmtCurrency(totalAmount)}
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <LocationSelector />
        </View>

        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <ActiveLocationBanner eff={eff} />
        </View>

        {/* Range presets */}
        {!eff.needsExplicitSelection ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8, marginBottom: 12 }}
          >
            {PRESETS.map((p) => {
              const active = activePresetKey === p.key;
              return (
                <Pressable
                  key={p.key}
                  onPress={() => handlePresetChange(p.key)}
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
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
            {/* Chip de rango personalizado */}
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setPickerOpen(true);
              }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: custom ? palette.dark.text : palette.dark.surface,
                borderWidth: 1,
                borderColor: custom ? palette.dark.text : palette.dark.border,
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 999,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ fontSize: 12 }}>📅</Text>
              <Text
                style={{
                  color: custom ? '#FFFFFF' : palette.dark.text,
                  fontSize: 12,
                  fontWeight: '700',
                }}
              >
                {custom ? `${fmtDateShort(custom.start)}–${fmtDateShort(custom.end)}` : 'Personalizado'}
              </Text>
            </Pressable>
          </ScrollView>
        ) : null}

        {/* Search */}
        {!eff.needsExplicitSelection ? (
          <View
            style={{
              marginHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: palette.dark.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: palette.dark.border,
              paddingHorizontal: 14,
              height: 44,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 14, marginRight: 8 }}>🔍</Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar por NCF, número, cliente…"
              placeholderTextColor={palette.dark.textMuted}
              style={{ flex: 1, color: palette.dark.text, fontSize: 13 }}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {search ? (
              <Pressable onPress={() => setSearch('')}>
                <Text style={{ color: palette.dark.textMuted, fontSize: 16 }}>×</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <InlineFetchingBar visible={isFetching && !isLoading && !isFetchingNextPage} />

        <View style={{ paddingHorizontal: 16, gap: 8 }}>
          {eff.needsExplicitSelection ? null : isLoading ? (
            <LoadingState label="Buscando facturas…" />
          ) : error ? (
            <Card>
              <Text style={{ color: palette.dark.danger, fontSize: 14, fontWeight: '700' }}>Error</Text>
              <Text style={{ color: palette.dark.textDim, fontSize: 12, marginTop: 4 }}>
                {(error as Error)?.message ?? 'No se pudo buscar.'}
              </Text>
            </Card>
          ) : invoices.length === 0 ? (
            <Card>
              <Text style={{ color: palette.dark.textDim, fontSize: 13, textAlign: 'center' }}>
                {search ? 'Sin resultados para la búsqueda.' : 'Sin facturas en este rango.'}
              </Text>
            </Card>
          ) : (
            <>
              {invoices.map((inv: InvoiceSearchResult, idx: number) => (
                <Pressable
                  key={`inv-${inv.id ?? inv.invoice_id ?? idx}`}
                  onPress={() =>
                    router.push(`/(tabs)/settings/invoices/${inv.id ?? inv.invoice_id}`)
                  }
                  style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                >
                  <Card variant="default">
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <Text
                          style={{
                            color: palette.dark.text,
                            fontSize: 14,
                            fontWeight: '700',
                            letterSpacing: -0.2,
                          }}
                          numberOfLines={1}
                        >
                          {inv.invoice_ncf ?? inv.invoice_number ?? '—'}
                        </Text>
                        <Text
                          style={{ color: palette.dark.textDim, fontSize: 12, marginTop: 2 }}
                          numberOfLines={1}
                        >
                          {inv.client_name ?? inv.customer_name ?? 'Sin cliente'}
                        </Text>
                        <Text style={{ color: palette.dark.textMuted, fontSize: 10, marginTop: 2 }}>
                          {fmtDateTime(inv.emission_date)}
                          {inv.payment_type ? ` · ${inv.payment_type}` : ''}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: palette.dark.text, fontSize: 16, fontWeight: '800' }}>
                          {fmtCurrency(inv.total_amount)}
                        </Text>
                        {inv.currency_code && inv.currency_code !== 'DOP' ? (
                          <View
                            style={{
                              marginTop: 3,
                              paddingHorizontal: 7,
                              paddingVertical: 2,
                              borderRadius: 999,
                              backgroundColor: palette.dark.primaryDim,
                            }}
                          >
                            <Text style={{ color: palette.dark.primary, fontSize: 9.5, fontWeight: '800', letterSpacing: 0.3 }}>
                              {inv.currency_code}
                              {typeof inv.original_amount === 'number'
                                ? ` ${inv.original_amount.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : ''}
                              {inv.currency_rate ? ` · ${inv.currency_rate}` : ''}
                            </Text>
                          </View>
                        ) : null}
                        {inv.status_name ? (
                          <Text style={{ color: palette.dark.textMuted, fontSize: 10, marginTop: 2 }}>
                            {inv.status_name}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </Card>
                </Pressable>
              ))}

              {/* Pagination footer */}
              {hasNextPage ? (
                <View style={{ paddingVertical: 18, alignItems: 'center' }}>
                  {isFetchingNextPage ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color={palette.dark.textMuted} />
                      <Text style={{ color: palette.dark.textMuted, fontSize: 12, fontWeight: '600' }}>
                        Cargando más…
                      </Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => fetchNextPage()}
                      style={({ pressed }) => ({
                        paddingHorizontal: 20,
                        paddingVertical: 10,
                        borderRadius: 999,
                        backgroundColor: palette.dark.surface,
                        borderWidth: 1,
                        borderColor: palette.dark.border,
                        opacity: pressed ? 0.7 : 1,
                        ...shadow.sm,
                      })}
                    >
                      <Text style={{ color: palette.dark.text, fontSize: 12, fontWeight: '700' }}>
                        Cargar más
                      </Text>
                    </Pressable>
                  )}
                </View>
              ) : invoices.length > 0 ? (
                <View style={{ paddingVertical: 18, alignItems: 'center' }}>
                  <Text style={{ color: palette.dark.textMuted, fontSize: 11 }}>
                    Mostrando {fmtInt(invoices.length)} de {fmtInt(total)} facturas
                  </Text>
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>

      <RangePickerSheet
        visible={pickerOpen}
        initial={
          custom ?? {
            start: range.start,
            end: range.end,
            startTime: null,
            endTime: null,
          }
        }
        onClose={() => setPickerOpen(false)}
        onApply={(sel) => {
          setCustom(sel);
          setPickerOpen(false);
        }}
      />
    </SafeAreaView>
  );
}
