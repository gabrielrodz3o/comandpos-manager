import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card, LoadingState, InlineFetchingBar } from '@components/ui';
import { ActiveLocationBanner } from '@components/reports/ActiveLocationBanner';
import { LocationSelector } from '@components/dashboard/LocationSelector';
import { palette } from '@theme/colors';
import { fmtCurrency, fmtInt } from '@utils/format';
import { useInventory, useWarehouses } from '@hooks/useOperations';
import type { InventoryItem, StockStatus } from '@/types/operations';

type StatusFilter = 'all' | 'critical' | 'low' | 'excess';

const STATUS_STYLE: Record<StockStatus, { label: string; color: string; bg: string }> = {
  SIN_STOCK:      { label: 'Sin stock',  color: '#FFFFFF', bg: '#EF4444' },
  CRITICAL:       { label: 'Crítico',    color: '#FFFFFF', bg: '#F97316' },
  LOW:            { label: 'Bajo',       color: '#92400E', bg: '#FEF3C7' },
  OK:             { label: 'OK',         color: '#065F46', bg: '#D1FAE5' },
  EXCESS:         { label: 'Exceso',     color: '#1E3A8A', bg: '#DBEAFE' },
  NOT_CONFIGURED: { label: 'Sin config', color: '#5C5C66', bg: '#F5F5F7' },
};

export default function InventoryScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedWarehouseIds, setSelectedWarehouseIds] = useState<number[] | null>(null);

  const warehousesQ = useWarehouses();
  const { items, isLoading, isFetching, isRefetching, refetch, error, eff } = useInventory(
    selectedWarehouseIds,
  );

  const warehouses = warehousesQ.data ?? [];

  const filtered = useMemo(() => {
    let list = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.item_name?.toLowerCase().includes(q) ||
          i.category_name?.toLowerCase().includes(q) ||
          i.warehouses.some((w) => w.warehouse_name?.toLowerCase().includes(q)),
      );
    }
    if (statusFilter === 'critical') {
      list = list.filter((i) => i.stock_status === 'SIN_STOCK' || i.stock_status === 'CRITICAL');
    } else if (statusFilter === 'low') {
      list = list.filter(
        (i) =>
          i.stock_status === 'LOW' ||
          i.stock_status === 'CRITICAL' ||
          i.stock_status === 'SIN_STOCK',
      );
    } else if (statusFilter === 'excess') {
      list = list.filter((i) => i.stock_status === 'EXCESS');
    }
    return list;
  }, [items, search, statusFilter]);

  const counts = useMemo(
    () => ({
      sinStock: items.filter((i) => i.stock_status === 'SIN_STOCK').length,
      critical: items.filter((i) => i.stock_status === 'CRITICAL').length,
      low: items.filter((i) => i.stock_status === 'LOW').length,
      ok: items.filter((i) => i.stock_status === 'OK').length,
      excess: items.filter((i) => i.stock_status === 'EXCESS').length,
    }),
    [items],
  );

  const toggleWarehouse = (id: number) => {
    setSelectedWarehouseIds((prev) => {
      if (prev == null) return [id];
      if (prev.includes(id)) {
        const next = prev.filter((x) => x !== id);
        return next.length === 0 ? null : next;
      }
      return [...prev, id];
    });
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
              Inventario
            </Text>
            <Text style={{ color: palette.dark.textDim, fontSize: 12, fontWeight: '500' }}>
              {fmtInt(filtered.length)} de {fmtInt(items.length)} productos
            </Text>
          </View>
        </View>

        {/* Location selector — para poder elegir sucursal */}
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <LocationSelector />
        </View>

        <InlineFetchingBar visible={isFetching && !isLoading} />

        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          <ActiveLocationBanner eff={eff} />

          {eff.needsExplicitSelection ? null : (
            <>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <StatPill label="Sin stock" count={counts.sinStock} color="#EF4444" bg="#FEF2F2" />
                <StatPill label="Crítico" count={counts.critical} color="#F97316" bg="#FFF7ED" />
                <StatPill label="Bajo" count={counts.low} color="#92400E" bg="#FEF3C7" />
                <StatPill label="OK" count={counts.ok} color="#065F46" bg="#D1FAE5" />
              </View>

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
                  placeholder="Buscar producto, categoría, almacén…"
                  placeholderTextColor={palette.dark.textMuted}
                  style={{ flex: 1, color: palette.dark.text, fontSize: 13 }}
                />
                {search ? (
                  <Pressable onPress={() => setSearch('')}>
                    <Text style={{ color: palette.dark.textMuted, fontSize: 16 }}>×</Text>
                  </Pressable>
                ) : null}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {(
                  [
                    { k: 'all', label: 'Todos', count: items.length },
                    { k: 'critical', label: 'Crítico+', count: counts.sinStock + counts.critical },
                    { k: 'low', label: 'Stock bajo', count: counts.sinStock + counts.critical + counts.low },
                    { k: 'excess', label: 'Exceso', count: counts.excess },
                  ] as { k: StatusFilter; label: string; count: number }[]
                ).map(({ k, label, count }) => {
                  const active = statusFilter === k;
                  return (
                    <Pressable
                      key={k}
                      onPress={() => setStatusFilter(k)}
                      style={({ pressed }) => ({
                        backgroundColor: active ? palette.dark.text : palette.dark.surface,
                        borderWidth: 1,
                        borderColor: active ? palette.dark.text : palette.dark.border,
                        paddingVertical: 7,
                        paddingHorizontal: 14,
                        borderRadius: 999,
                        opacity: pressed ? 0.85 : 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
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
                      <Text
                        style={{
                          color: active ? 'rgba(255,255,255,0.6)' : palette.dark.textMuted,
                          fontSize: 11,
                          fontWeight: '600',
                        }}
                      >
                        {count}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {warehouses.length > 0 ? (
                <View>
                  <Text
                    style={{
                      color: palette.dark.textMuted,
                      fontSize: 10,
                      fontWeight: '700',
                      letterSpacing: 1,
                      marginBottom: 6,
                    }}
                  >
                    ALMACENES ({warehouses.length})
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8 }}
                  >
                    <WarehouseChip
                      label="Todos"
                      active={selectedWarehouseIds == null}
                      onPress={() => setSelectedWarehouseIds(null)}
                    />
                    {warehouses.map((w) => (
                      <WarehouseChip
                        key={w.id}
                        label={w.name}
                        active={selectedWarehouseIds?.includes(w.id) ?? false}
                        onPress={() => toggleWarehouse(w.id)}
                      />
                    ))}
                  </ScrollView>
                </View>
              ) : null}

              {isLoading ? (
                <LoadingState
                  label="Cargando inventario…"
                  hint="Verificando stock en almacenes."
                />
              ) : error ? (
                <Card>
                  <Text style={{ color: palette.dark.danger, fontSize: 14, fontWeight: '700' }}>
                    Error
                  </Text>
                  <Text style={{ color: palette.dark.textDim, fontSize: 12, marginTop: 4 }}>
                    {(error as Error)?.message ?? 'No se pudo cargar el inventario.'}
                  </Text>
                </Card>
              ) : filtered.length === 0 ? (
                <Card>
                  <Text
                    style={{ color: palette.dark.text, fontSize: 14, fontWeight: '700', textAlign: 'center' }}
                  >
                    {search || statusFilter !== 'all' ? 'Sin resultados' : '✅ Sin productos'}
                  </Text>
                  <Text
                    style={{ color: palette.dark.textDim, fontSize: 12, textAlign: 'center', marginTop: 4 }}
                  >
                    {search ? 'Prueba con otra búsqueda.' : 'No hay productos en los filtros seleccionados.'}
                  </Text>
                </Card>
              ) : (
                <Card variant="default" padded={false}>
                  {filtered.map((item, idx) => (
                    <InventoryRow
                      key={`item-${item.item_id}`}
                      item={item}
                      isFirst={idx === 0}
                    />
                  ))}
                  <View
                    style={{
                      padding: 12,
                      alignItems: 'center',
                      borderTopWidth: 0.5,
                      borderTopColor: palette.dark.border,
                    }}
                  >
                    <Text style={{ color: palette.dark.textMuted, fontSize: 11 }}>
                      {fmtInt(filtered.length)} producto(s)
                    </Text>
                  </View>
                </Card>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const StatPill: React.FC<{ label: string; count: number; color: string; bg: string }> = ({
  label,
  count,
  color,
  bg,
}) => (
  <View style={{ flex: 1, backgroundColor: bg, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 12 }}>
    <Text style={{ color, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>
      {label.toUpperCase()}
    </Text>
    <Text style={{ color, fontSize: 18, fontWeight: '800', marginTop: 2 }}>{fmtInt(count)}</Text>
  </View>
);

const WarehouseChip: React.FC<{ label: string; active: boolean; onPress: () => void }> = ({
  label,
  active,
  onPress,
}) => (
  <Pressable
    onPress={onPress}
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
    <Text style={{ color: active ? '#FFFFFF' : palette.dark.text, fontSize: 12, fontWeight: '700' }}>
      {label}
    </Text>
  </Pressable>
);

const InventoryRow: React.FC<{ item: InventoryItem; isFirst: boolean }> = ({
  item,
  isFirst,
}) => {
  const [expanded, setExpanded] = useState(false);
  const sty = STATUS_STYLE[item.stock_status ?? 'NOT_CONFIGURED'];
  const hasMulti = item.warehouses_count > 1;

  return (
    <View
      style={{
        borderTopWidth: isFirst ? 0 : 0.5,
        borderTopColor: palette.dark.border,
      }}
    >
      <Pressable
        onPress={() => hasMulti && setExpanded((v) => !v)}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          opacity: pressed && hasMulti ? 0.7 : 1,
        })}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: sty.bg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 18 }}>📦</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{ color: palette.dark.text, fontSize: 13, fontWeight: '700', letterSpacing: -0.2 }}
            numberOfLines={1}
          >
            {item.item_name}
          </Text>
          <Text style={{ color: palette.dark.textMuted, fontSize: 11, marginTop: 1 }} numberOfLines={1}>
            {item.category_name ?? 'Sin categoría'}
            {item.cost_price ? ` · ${fmtCurrency(item.cost_price)}` : ''}
            {hasMulti ? ` · ${item.warehouses_count} almacenes` : ` · ${item.warehouses[0]?.warehouse_name ?? ''}`}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text
            style={{
              color: palette.dark.text,
              fontSize: 18,
              fontWeight: '800',
              letterSpacing: -0.5,
            }}
          >
            {fmtInt(item.quantity)}
          </Text>
          <Text style={{ color: palette.dark.textMuted, fontSize: 9 }}>
            {item.unit_abbreviation ?? 'und'}
          </Text>
          <View
            style={{
              backgroundColor: sty.bg,
              paddingHorizontal: 6,
              paddingVertical: 1,
              borderRadius: 5,
              marginTop: 3,
            }}
          >
            <Text style={{ color: sty.color, fontSize: 9, fontWeight: '800', letterSpacing: 0.3 }}>
              {sty.label.toUpperCase()}
            </Text>
          </View>
        </View>
        {hasMulti ? (
          <Text style={{ color: palette.dark.textMuted, fontSize: 14, marginLeft: 4 }}>
            {expanded ? '▴' : '▾'}
          </Text>
        ) : null}
      </Pressable>

      {/* Detalle expandido: stock por almacén */}
      {expanded && hasMulti ? (
        <View
          style={{
            backgroundColor: palette.dark.soft,
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
        >
          {item.warehouses.map((wh, whIdx) => {
            const ws = STATUS_STYLE[wh.stock_status ?? 'NOT_CONFIGURED'];
            return (
              <View
                key={`wh-${item.item_id}-${wh.warehouse_id}-${whIdx}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 6,
                  gap: 8,
                }}
              >
                <Text style={{ fontSize: 11 }}>
                  {wh.is_general ? '🏢' : '🏬'}
                </Text>
                <Text
                  style={{ color: palette.dark.text, fontSize: 12, fontWeight: '600', flex: 1 }}
                  numberOfLines={1}
                >
                  {wh.warehouse_name}
                </Text>
                {wh.min_quantity != null ? (
                  <Text style={{ color: palette.dark.textMuted, fontSize: 10 }}>
                    min {fmtInt(wh.min_quantity)}
                  </Text>
                ) : null}
                <Text style={{ color: palette.dark.text, fontSize: 13, fontWeight: '700' }}>
                  {fmtInt(wh.quantity)}
                </Text>
                <View
                  style={{
                    backgroundColor: ws.bg,
                    paddingHorizontal: 5,
                    paddingVertical: 1,
                    borderRadius: 4,
                    minWidth: 50,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: ws.color, fontSize: 8, fontWeight: '800', letterSpacing: 0.3 }}>
                    {ws.label.toUpperCase()}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
};
