import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card, LoadingState, InlineFetchingBar } from '@components/ui';
import { ActiveLocationBanner } from '@components/reports/ActiveLocationBanner';
import { LocationSelector } from '@components/dashboard/LocationSelector';
import { palette } from '@theme/colors';
import { fmtCurrency, fmtPct } from '@utils/format';
import { presetRange, RANGE_LABELS, type RangePreset } from '@utils/dates';
import { useCostAnalysis } from '@hooks/useAdmin';
import type { CostCategory, CostItem } from '@/types/admin';

const money = (n: unknown) => fmtCurrency(n, 'DOP', 2);

// Umbrales de salud típicos de restaurante (food cost ideal < 35%).
const costColor = (pct: number): string =>
  pct <= 30 ? palette.dark.success : pct <= 38 ? palette.dark.warning : palette.dark.danger;

type ItemMode = 'rentables' | 'alto-costo';

export default function CostAnalysisScreen() {
  const router = useRouter();
  const [range, setRange] = useState<RangePreset>('month');
  const [view, setView] = useState<ItemMode>('rentables');

  const { start, end } = useMemo(() => presetRange(range), [range]);
  const { data, isLoading, isFetching, isRefetching, refetch, error, eff } = useCostAnalysis({ start, end });

  const k = data?.kpis;
  const categories = (data?.costos_por_categoria ?? []).slice(0, 20);
  const items = (view === 'rentables' ? data?.items_mas_rentables : data?.items_alto_costo) ?? [];

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
              Análisis de Costos
            </Text>
            <Text style={{ color: palette.dark.textDim, fontSize: 12, fontWeight: '500' }}>
              Food cost y rentabilidad · {RANGE_LABELS[range]}
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <LocationSelector />
        </View>

        <InlineFetchingBar visible={isFetching && !isLoading} />

        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          <ActiveLocationBanner eff={eff} />

          {eff.needsExplicitSelection ? null : (
            <>
              {/* Rango */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['today', '7d', 'month'] as RangePreset[]).map((kk) => {
                  const active = range === kk;
                  return (
                    <Pressable
                      key={kk}
                      onPress={() => setRange(kk)}
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
                      <Text style={{ color: active ? '#FFFFFF' : palette.dark.text, fontSize: 12, fontWeight: '700' }}>
                        {RANGE_LABELS[kk]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {isLoading ? (
                <LoadingState label="Calculando costos…" hint="Food cost, márgenes y mermas." variant="centered" />
              ) : error ? (
                <Card>
                  <Text style={{ color: palette.dark.danger, fontSize: 14, fontWeight: '700' }}>Error</Text>
                  <Text style={{ color: palette.dark.textDim, fontSize: 12, marginTop: 4 }}>
                    {(error as Error)?.message ?? 'No se pudo cargar.'}
                  </Text>
                </Card>
              ) : (
                <>
                  {/* KPIs principales */}
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Kpi
                      label="Food cost real"
                      value={fmtPct(k?.food_cost_percentage)}
                      color={costColor(Number(k?.food_cost_percentage) || 0)}
                    />
                    <Kpi
                      label="Costo teórico"
                      value={fmtPct(k?.theoretical_cost_percentage)}
                      color={costColor(Number(k?.theoretical_cost_percentage) || 0)}
                    />
                    <Kpi label="Margen bruto" value={fmtPct(k?.margen_percentage)} color={palette.dark.success} />
                  </View>

                  {/* Montos */}
                  <Card variant="default">
                    <Row label="Ventas" value={money(k?.total_ventas)} strong />
                    <Row label="Costo de ventas" value={money(k?.total_costo_ventas)} color={palette.dark.danger} />
                    <Row label="Margen bruto" value={money(k?.margen_bruto)} color={palette.dark.success} strong />
                    <Row label="Compras del período" value={money(k?.total_compras)} />
                    <Row label="Mermas" value={money(k?.total_mermas)} color={palette.dark.warning} />
                    <Row label="Costo cortesías" value={money(k?.total_costo_cortesias)} color={palette.dark.warning} />
                  </Card>

                  {/* Costo por categoría */}
                  {categories.length > 0 ? (
                    <Card variant="default" padded={false}>
                      <View style={{ padding: 14, paddingBottom: 8 }}>
                        <Text style={{ color: palette.dark.text, fontSize: 14, fontWeight: '700' }}>
                          Costo por categoría
                        </Text>
                      </View>
                      {categories.map((c, i) => (
                        <CategoryRow key={`cat-${c.category_id}-${i}`} cat={c} isFirst={i === 0} />
                      ))}
                    </Card>
                  ) : null}

                  {/* Items: rentables / alto costo */}
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {(
                      [
                        { k: 'rentables', label: '★ Más rentables' },
                        { k: 'alto-costo', label: '⚠ Alto costo' },
                      ] as { k: ItemMode; label: string }[]
                    ).map(({ k: vk, label }) => {
                      const active = view === vk;
                      return (
                        <Pressable
                          key={vk}
                          onPress={() => setView(vk)}
                          style={({ pressed }) => ({
                            flex: 1,
                            backgroundColor: active ? palette.dark.primary : palette.dark.surface,
                            borderWidth: 1,
                            borderColor: active ? palette.dark.primary : palette.dark.border,
                            paddingVertical: 9,
                            borderRadius: 10,
                            alignItems: 'center',
                            opacity: pressed ? 0.85 : 1,
                          })}
                        >
                          <Text style={{ color: active ? '#FFFFFF' : palette.dark.text, fontSize: 12, fontWeight: '700' }}>
                            {label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {items.length > 0 ? (
                    <Card variant="default" padded={false}>
                      {items.slice(0, 20).map((it, i) => (
                        <ItemRow key={`it-${it.item_id}-${i}`} item={it} mode={view} isFirst={i === 0} />
                      ))}
                    </Card>
                  ) : (
                    <Card>
                      <Text style={{ color: palette.dark.textMuted, fontSize: 12, textAlign: 'center' }}>
                        Sin datos de productos en el período.
                      </Text>
                    </Card>
                  )}
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const Kpi: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <View style={{ flex: 1, backgroundColor: palette.dark.surface, borderRadius: 14, borderWidth: 1, borderColor: palette.dark.border, padding: 12 }}>
    <Text style={{ color: palette.dark.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.3 }} numberOfLines={1}>
      {label.toUpperCase()}
    </Text>
    <Text style={{ color, fontSize: 19, fontWeight: '800', marginTop: 4 }}>{value}</Text>
  </View>
);

const Row: React.FC<{ label: string; value: string; color?: string; strong?: boolean }> = ({
  label,
  value,
  color,
  strong,
}) => (
  <View
    style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 7,
      borderBottomWidth: 0.5,
      borderBottomColor: palette.dark.border,
    }}
  >
    <Text style={{ color: palette.dark.textDim, fontSize: 12, fontWeight: '500' }}>{label}</Text>
    <Text style={{ color: color ?? palette.dark.text, fontSize: 13, fontWeight: strong ? '800' : '600' }}>
      {value}
    </Text>
  </View>
);

const CategoryRow: React.FC<{ cat: CostCategory; isFirst: boolean }> = ({ cat, isFirst }) => {
  const pct = Number(cat.cost_percentage) || 0;
  return (
    <View
      style={{
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderTopWidth: isFirst ? 0 : 0.5,
        borderTopColor: palette.dark.border,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ color: palette.dark.text, fontSize: 13, fontWeight: '600', flex: 1 }} numberOfLines={1}>
          {cat.category_name}
        </Text>
        <Text style={{ color: costColor(pct), fontSize: 13, fontWeight: '800' }}>{fmtPct(pct)}</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: palette.dark.textMuted, fontSize: 11 }}>Ventas {money(cat.ventas_totales)}</Text>
        <Text style={{ color: palette.dark.textMuted, fontSize: 11 }}>Margen {money(cat.margen_bruto)}</Text>
      </View>
    </View>
  );
};

const ItemRow: React.FC<{ item: CostItem; mode: ItemMode; isFirst: boolean }> = ({ item, mode, isFirst }) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderTopWidth: isFirst ? 0 : 0.5,
      borderTopColor: palette.dark.border,
    }}
  >
    <View style={{ flex: 1, marginRight: 10 }}>
      <Text style={{ color: palette.dark.text, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
        {item.item_name}
      </Text>
      <Text style={{ color: palette.dark.textMuted, fontSize: 11 }} numberOfLines={1}>
        {item.category_name ?? ''}
      </Text>
    </View>
    {mode === 'rentables' ? (
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ color: palette.dark.success, fontSize: 13, fontWeight: '800' }}>
          {money(item.margen_total)}
        </Text>
        <Text style={{ color: palette.dark.textMuted, fontSize: 10 }}>margen {fmtPct(item.margen_percentage)}</Text>
      </View>
    ) : (
      <Text style={{ color: costColor(Number(item.cost_percentage) || 0), fontSize: 14, fontWeight: '800' }}>
        {fmtPct(item.cost_percentage)}
      </Text>
    )}
  </View>
);
