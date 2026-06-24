import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card, LoadingState, InlineFetchingBar } from '@components/ui';
import { ActiveLocationBanner } from '@components/reports/ActiveLocationBanner';
import { LocationSelector } from '@components/dashboard/LocationSelector';
import { palette } from '@theme/colors';
import { fmtCurrency, fmtInt } from '@utils/format';
import { isoDate, resolvePreset } from '@utils/dates';
import { useKardex } from '@hooks/useOperations';
import type { KardexRow, KardexSourceType } from '@/types/operations';

type RangeKey = 'today' | '7d' | 'month';
type SourceKey = 'all' | KardexSourceType;

const money = (n: unknown) => fmtCurrency(n, 'DOP', 2);

const fmtQty = (n: unknown): string => {
  const v = Number(n) || 0;
  return new Intl.NumberFormat('es-DO', { maximumFractionDigits: 2 }).format(v);
};

const fmtTime = (raw?: string): string => {
  if (!raw) return '—';
  try {
    return new Date(raw).toLocaleString('es-DO', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return raw;
  }
};

const resolveRange = (key: RangeKey): { start: string; end: string } => {
  if (key === 'today') {
    const t = isoDate(new Date());
    return { start: t, end: t };
  }
  if (key === '7d') return resolvePreset(6);
  return resolvePreset(-1); // mes actual
};

// Origen del movimiento → etiqueta + emoji (entrada/salida lo da el signo).
const SOURCE_META: Record<string, { label: string; emoji: string }> = {
  sale: { label: 'Venta', emoji: '🛒' },
  purchase: { label: 'Compra', emoji: '📥' },
  transfer: { label: 'Transferencia', emoji: '🔁' },
  adjustment: { label: 'Ajuste', emoji: '✏️' },
  waste: { label: 'Merma', emoji: '🗑️' },
  conversion: { label: 'Conversión', emoji: '🔄' },
  production: { label: 'Producción', emoji: '🏭' },
  other: { label: 'Movimiento', emoji: '📦' },
};

const SOURCE_FILTERS: { k: SourceKey; label: string }[] = [
  { k: 'all', label: 'Todos' },
  { k: 'sale', label: 'Ventas' },
  { k: 'purchase', label: 'Compras' },
  { k: 'transfer', label: 'Transfer.' },
  { k: 'adjustment', label: 'Ajustes' },
  { k: 'waste', label: 'Mermas' },
  { k: 'production', label: 'Producción' },
  { k: 'conversion', label: 'Conversión' },
];

const RANGE_LABEL: Record<RangeKey, string> = {
  today: 'Hoy',
  '7d': '7 días',
  month: 'Mes',
};

export default function KardexScreen() {
  const router = useRouter();
  const [range, setRange] = useState<RangeKey>('today');
  const [source, setSource] = useState<SourceKey>('all');
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(50);

  const { start, end } = useMemo(() => resolveRange(range), [range]);

  const { data, isLoading, isFetching, isRefetching, refetch, error, eff } = useKardex({
    start_date: start,
    end_date: end,
    source_type: source === 'all' ? null : source,
    search: search.trim() || null,
    limit,
  });

  const rows = data?.items ?? [];
  const summary = data?.summary;
  const total = data?.total ?? 0;

  const onChangeRange = (k: RangeKey) => {
    setRange(k);
    setLimit(50);
  };
  const onChangeSource = (k: SourceKey) => {
    setSource(k);
    setLimit(50);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.dark.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top bar */}
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
              Movimientos
            </Text>
            <Text style={{ color: palette.dark.textDim, fontSize: 12, fontWeight: '500' }}>
              {RANGE_LABEL[range]} · {fmtInt(total)} transacciones
            </Text>
          </View>
        </View>

        {/* Location selector */}
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <LocationSelector />
        </View>

        <InlineFetchingBar visible={isFetching && !isLoading} />

        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          <ActiveLocationBanner eff={eff} />

          {eff.needsExplicitSelection ? null : (
            <>
              {/* Rango de fechas */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['today', '7d', 'month'] as RangeKey[]).map((k) => {
                  const active = range === k;
                  return (
                    <Pressable
                      key={k}
                      onPress={() => onChangeRange(k)}
                      style={({ pressed }) => ({
                        flex: 1,
                        backgroundColor: active ? palette.dark.text : palette.dark.surface,
                        borderWidth: 1,
                        borderColor: active ? palette.dark.text : palette.dark.border,
                        paddingVertical: 9,
                        borderRadius: 10,
                        alignItems: 'center',
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
                        {RANGE_LABEL[k]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Búsqueda */}
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
                  onChangeText={(t) => {
                    setSearch(t);
                    setLimit(50);
                  }}
                  placeholder="Buscar producto o código…"
                  placeholderTextColor={palette.dark.textMuted}
                  style={{ flex: 1, color: palette.dark.text, fontSize: 13 }}
                />
                {search ? (
                  <Pressable onPress={() => setSearch('')}>
                    <Text style={{ color: palette.dark.textMuted, fontSize: 16 }}>×</Text>
                  </Pressable>
                ) : null}
              </View>

              {/* Filtro por origen */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {SOURCE_FILTERS.map(({ k, label }) => {
                  const active = source === k;
                  return (
                    <Pressable
                      key={k}
                      onPress={() => onChangeSource(k)}
                      style={({ pressed }) => ({
                        backgroundColor: active ? palette.dark.primary : palette.dark.surface,
                        borderWidth: 1,
                        borderColor: active ? palette.dark.primary : palette.dark.border,
                        paddingVertical: 7,
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

              {/* Resumen */}
              {summary && summary.movimientos > 0 ? (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <SummaryPill
                    label="Entradas"
                    value={fmtQty(summary.total_entradas)}
                    color="#065F46"
                    bg="#D1FAE5"
                  />
                  <SummaryPill
                    label="Salidas"
                    value={fmtQty(summary.total_salidas)}
                    color="#991B1B"
                    bg="#FEE2E2"
                  />
                  <SummaryPill
                    label="Valor neto"
                    value={money(summary.valor_neto)}
                    color={palette.dark.text}
                    bg={palette.dark.soft}
                  />
                </View>
              ) : null}

              {/* Lista */}
              {isLoading ? (
                <LoadingState label="Cargando movimientos…" hint="Consultando el kardex del período." />
              ) : error ? (
                <Card>
                  <Text style={{ color: palette.dark.danger, fontSize: 14, fontWeight: '700' }}>Error</Text>
                  <Text style={{ color: palette.dark.textDim, fontSize: 12, marginTop: 4 }}>
                    {(error as Error)?.message ?? 'No se pudieron cargar los movimientos.'}
                  </Text>
                </Card>
              ) : rows.length === 0 ? (
                <Card>
                  <Text style={{ color: palette.dark.text, fontSize: 14, fontWeight: '700', textAlign: 'center' }}>
                    Sin movimientos
                  </Text>
                  <Text style={{ color: palette.dark.textDim, fontSize: 12, textAlign: 'center', marginTop: 4 }}>
                    No hay transacciones de inventario para {RANGE_LABEL[range].toLowerCase()}
                    {source !== 'all' ? ' con este filtro' : ''}.
                  </Text>
                </Card>
              ) : (
                <Card variant="default" padded={false}>
                  {rows.map((r, idx) => (
                    <KardexRowView key={`k-${r.id}-${idx}`} row={r} isFirst={idx === 0} />
                  ))}
                  {rows.length < total ? (
                    <Pressable
                      onPress={() => setLimit((l) => l + 50)}
                      style={({ pressed }) => ({
                        padding: 14,
                        alignItems: 'center',
                        borderTopWidth: 0.5,
                        borderTopColor: palette.dark.border,
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <Text style={{ color: palette.dark.primary, fontSize: 13, fontWeight: '700' }}>
                        Cargar más ({fmtInt(rows.length)} de {fmtInt(total)})
                      </Text>
                    </Pressable>
                  ) : (
                    <View
                      style={{
                        padding: 12,
                        alignItems: 'center',
                        borderTopWidth: 0.5,
                        borderTopColor: palette.dark.border,
                      }}
                    >
                      <Text style={{ color: palette.dark.textMuted, fontSize: 11 }}>
                        {fmtInt(total)} movimiento(s)
                      </Text>
                    </View>
                  )}
                </Card>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const SummaryPill: React.FC<{ label: string; value: string; color: string; bg: string }> = ({
  label,
  value,
  color,
  bg,
}) => (
  <View style={{ flex: 1, backgroundColor: bg, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 12 }}>
    <Text style={{ color, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>{label.toUpperCase()}</Text>
    <Text style={{ color, fontSize: 15, fontWeight: '800', marginTop: 2 }} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

const KardexRowView: React.FC<{ row: KardexRow; isFirst: boolean }> = ({ row, isFirst }) => {
  const meta = SOURCE_META[row.source_type] ?? SOURCE_META.other;
  const isIn = Number(row.quantity) >= 0;
  const qtyColor = isIn ? palette.dark.success : palette.dark.danger;
  const unit = row.unit_abbr ?? row.unit_name ?? '';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: isFirst ? 0 : 0.5,
        borderTopColor: palette.dark.border,
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          backgroundColor: palette.dark.soft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 17 }}>{meta.emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{ color: palette.dark.text, fontSize: 13, fontWeight: '700', letterSpacing: -0.2 }}
          numberOfLines={1}
        >
          {row.item_name}
        </Text>
        <Text style={{ color: palette.dark.textMuted, fontSize: 11, marginTop: 1 }} numberOfLines={1}>
          {meta.label} · {row.warehouse_name}
        </Text>
        <Text style={{ color: palette.dark.textMuted, fontSize: 10, marginTop: 1 }} numberOfLines={1}>
          {fmtTime(row.created_at)} · {row.notes}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ color: qtyColor, fontSize: 15, fontWeight: '800', letterSpacing: -0.3 }}>
          {isIn ? '+' : ''}
          {fmtQty(row.quantity)} {unit}
        </Text>
        <Text style={{ color: palette.dark.textMuted, fontSize: 10, marginTop: 1 }}>
          saldo {fmtQty(row.balance)}
        </Text>
        {Number(row.line_value) ? (
          <Text style={{ color: palette.dark.textDim, fontSize: 10, marginTop: 1 }}>
            {money(Math.abs(Number(row.line_value)))}
          </Text>
        ) : null}
      </View>
    </View>
  );
};
