import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card, LoadingState, InlineFetchingBar } from '@components/ui';
import { ActiveLocationBanner } from '@components/reports/ActiveLocationBanner';
import { LocationSelector } from '@components/dashboard/LocationSelector';
import { palette } from '@theme/colors';
import { fmtCurrency, fmtInt, fmtPct } from '@utils/format';
import { presetRange, RANGE_LABELS, type RangePreset } from '@utils/dates';
import {
  useDiscounts,
  useCourtesies,
  useDeletedItems,
  usePriceChanges,
  useAuditTrail,
} from '@hooks/useAdmin';
import { useEffectiveLocationId } from '@hooks/useEffectiveLocationId';

const money = (n: unknown) => fmtCurrency(n, 'DOP', 2);

const fmtTime = (raw?: string): string => {
  if (!raw) return '—';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString('es-DO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};

type TabKey = 'discounts' | 'courtesies' | 'deleted' | 'prices' | 'audit';

const TABS: { k: TabKey; label: string }[] = [
  { k: 'discounts', label: 'Descuentos' },
  { k: 'courtesies', label: 'Cortesías' },
  { k: 'deleted', label: 'Anulados' },
  { k: 'prices', label: 'Precios' },
  { k: 'audit', label: 'Auditoría' },
];

export default function ControlScreen() {
  const router = useRouter();
  const [range, setRange] = useState<RangePreset>('7d');
  const [tab, setTab] = useState<TabKey>('discounts');

  const r = useMemo(() => presetRange(range), [range]);
  const eff = useEffectiveLocationId();

  const discountsQ = useDiscounts(r, tab === 'discounts');
  const courtesiesQ = useCourtesies(r, tab === 'courtesies');
  const deletedQ = useDeletedItems(r, tab === 'deleted');
  const pricesQ = usePriceChanges(r, tab === 'prices');
  const auditQ = useAuditTrail(r, tab === 'audit');

  const active = { discounts: discountsQ, courtesies: courtesiesQ, deleted: deletedQ, prices: pricesQ, audit: auditQ }[tab];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.dark.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={active.isRefetching} onRefresh={active.refetch} />}
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
              Control / Auditoría
            </Text>
            <Text style={{ color: palette.dark.textDim, fontSize: 12, fontWeight: '500' }}>
              Prevención de pérdidas · {RANGE_LABELS[range]}
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <LocationSelector />
        </View>

        <InlineFetchingBar visible={active.isFetching && !active.isLoading} />

        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          <ActiveLocationBanner eff={eff} />

          {/* Rango */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['today', '7d', 'month'] as RangePreset[]).map((kk) => {
              const isActive = range === kk;
              return (
                <Pressable
                  key={kk}
                  onPress={() => setRange(kk)}
                  style={({ pressed }) => ({
                    flex: 1,
                    backgroundColor: isActive ? palette.dark.text : palette.dark.surface,
                    borderWidth: 1,
                    borderColor: isActive ? palette.dark.text : palette.dark.border,
                    paddingVertical: 9,
                    borderRadius: 10,
                    alignItems: 'center',
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text style={{ color: isActive ? '#FFFFFF' : palette.dark.text, fontSize: 12, fontWeight: '700' }}>
                    {RANGE_LABELS[kk]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {TABS.map(({ k, label }) => {
              const isActive = tab === k;
              return (
                <Pressable
                  key={k}
                  onPress={() => setTab(k)}
                  style={({ pressed }) => ({
                    backgroundColor: isActive ? palette.dark.primary : palette.dark.surface,
                    borderWidth: 1,
                    borderColor: isActive ? palette.dark.primary : palette.dark.border,
                    paddingVertical: 7,
                    paddingHorizontal: 14,
                    borderRadius: 999,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text style={{ color: isActive ? '#FFFFFF' : palette.dark.text, fontSize: 12, fontWeight: '700' }}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {active.isLoading ? (
            <LoadingState label="Cargando…" hint="Trayendo movimientos de control." variant="centered" />
          ) : active.error ? (
            <Card>
              <Text style={{ color: palette.dark.danger, fontSize: 14, fontWeight: '700' }}>Error</Text>
              <Text style={{ color: palette.dark.textDim, fontSize: 12, marginTop: 4 }}>
                {(active.error as Error)?.message ?? 'No se pudo cargar.'}
              </Text>
            </Card>
          ) : (
            <>
              {tab === 'discounts' ? <DiscountsTab q={discountsQ} /> : null}
              {tab === 'courtesies' ? <CourtesiesTab q={courtesiesQ} /> : null}
              {tab === 'deleted' ? <DeletedTab q={deletedQ} /> : null}
              {tab === 'prices' ? <PricesTab q={pricesQ} /> : null}
              {tab === 'audit' ? <AuditTab q={auditQ} /> : null}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Helpers UI ──────────────────────────────────────────────────────
const SummaryStrip: React.FC<{ stats: { label: string; value: string; danger?: boolean }[] }> = ({ stats }) => (
  <View style={{ flexDirection: 'row', gap: 8 }}>
    {stats.map((s) => (
      <View key={s.label} style={{ flex: 1, backgroundColor: palette.dark.soft, borderRadius: 12, padding: 10 }}>
        <Text style={{ color: palette.dark.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.3 }} numberOfLines={1}>
          {s.label.toUpperCase()}
        </Text>
        <Text style={{ color: s.danger ? palette.dark.danger : palette.dark.text, fontSize: 15, fontWeight: '800', marginTop: 3 }} numberOfLines={1}>
          {s.value}
        </Text>
      </View>
    ))}
  </View>
);

const ListCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Card variant="default" padded={false}>
    {children}
  </Card>
);

const Empty: React.FC<{ text: string }> = ({ text }) => (
  <Card>
    <Text style={{ color: palette.dark.textMuted, fontSize: 12, textAlign: 'center' }}>{text}</Text>
  </Card>
);

const EventRow: React.FC<{
  title: string;
  subtitle?: string;
  meta?: string;
  amount?: string;
  amountColor?: string;
  isFirst: boolean;
}> = ({ title, subtitle, meta, amount, amountColor, isFirst }) => (
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
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ color: palette.dark.textMuted, fontSize: 11 }} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
      {meta ? (
        <Text style={{ color: palette.dark.textMuted, fontSize: 10, marginTop: 1 }} numberOfLines={1}>
          {meta}
        </Text>
      ) : null}
    </View>
    {amount ? (
      <Text style={{ color: amountColor ?? palette.dark.text, fontSize: 14, fontWeight: '800' }}>{amount}</Text>
    ) : null}
  </View>
);

// ── Tabs ────────────────────────────────────────────────────────────
const DiscountsTab: React.FC<{ q: ReturnType<typeof useDiscounts> }> = ({ q }) => {
  const rows = q.data?.data ?? [];
  const t = q.data?.totals;
  if (rows.length === 0) return <Empty text="Sin descuentos en el período." />;
  return (
    <>
      <SummaryStrip
        stats={[
          { label: 'Descuentos', value: money(t?.total_discount_amount), danger: true },
          { label: 'Facturas', value: fmtInt(t?.total_invoices) },
          { label: 'Promedio', value: fmtPct(t?.average_discount_percentage) },
        ]}
      />
      <ListCard>
        {rows.slice(0, 50).map((d, i) => (
          <EventRow
            key={`d-${d.id}-${i}`}
            title={`${d.invoice_number}${d.customer_name ? ` · ${d.customer_name}` : ''}`}
            subtitle={`Autorizó: ${d.authorized_by_fullname ?? '—'}${d.note ? ` · ${d.note}` : ''}`}
            meta={fmtTime(d.authorized_at ?? d.invoice_date)}
            amount={`-${money(d.discount_amount)}`}
            amountColor={palette.dark.danger}
            isFirst={i === 0}
          />
        ))}
      </ListCard>
    </>
  );
};

const CourtesiesTab: React.FC<{ q: ReturnType<typeof useCourtesies> }> = ({ q }) => {
  const rows = q.data ?? [];
  if (rows.length === 0) return <Empty text="Sin cortesías en el período." />;
  const totalSale = rows.reduce((s, c) => s + (Number(c.total_sale_price) || 0), 0);
  const totalLost = rows.reduce((s, c) => s + (Number(c.utility_lost) || 0), 0);
  return (
    <>
      <SummaryStrip
        stats={[
          { label: 'Cortesías', value: fmtInt(rows.length) },
          { label: 'Venta regalada', value: money(totalSale), danger: true },
          { label: 'Utilidad perdida', value: money(totalLost), danger: true },
        ]}
      />
      <ListCard>
        {rows.slice(0, 50).map((c, i) => (
          <EventRow
            key={`c-${c.id}-${i}`}
            title={`${c.reason_name ?? c.reason ?? 'Cortesía'}${c.table_name ? ` · ${c.table_name}` : ''}`}
            subtitle={`${c.waiter_name ?? c.waiter_fullname ?? ''}${c.authorized_by_fullname ? ` · aut. ${c.authorized_by_fullname}` : ''}`}
            meta={fmtTime(c.authorized_at)}
            amount={money(c.total_sale_price)}
            amountColor={palette.dark.danger}
            isFirst={i === 0}
          />
        ))}
      </ListCard>
    </>
  );
};

const DeletedTab: React.FC<{ q: ReturnType<typeof useDeletedItems> }> = ({ q }) => {
  const rows = q.data ?? [];
  if (rows.length === 0) return <Empty text="Sin items anulados en el período." />;
  const total = rows.reduce((s, d) => s + (Number(d.total_amount) || 0), 0);
  return (
    <>
      <SummaryStrip
        stats={[
          { label: 'Anulados', value: fmtInt(rows.length), danger: true },
          { label: 'Monto', value: money(total), danger: true },
        ]}
      />
      <ListCard>
        {rows.slice(0, 50).map((d, i) => (
          <EventRow
            key={`x-${d.id}-${i}`}
            title={`${d.item_name} ×${fmtInt(d.quantity)}`}
            subtitle={`${d.order_code ?? ''}${d.deleted_by ? ` · ${d.deleted_by}` : ''}${d.reason ? ` · ${d.reason}` : ''}`}
            meta={`${fmtTime(d.deleted_at)}${d.inventory_returned ? ' · devuelto a inventario' : ''}`}
            amount={`-${money(d.total_amount)}`}
            amountColor={palette.dark.danger}
            isFirst={i === 0}
          />
        ))}
      </ListCard>
    </>
  );
};

const PricesTab: React.FC<{ q: ReturnType<typeof usePriceChanges> }> = ({ q }) => {
  const rows = q.data ?? [];
  if (rows.length === 0) return <Empty text="Sin cambios de precio en el período." />;
  return (
    <>
      <SummaryStrip stats={[{ label: 'Cambios', value: fmtInt(rows.length) }]} />
      <ListCard>
        {rows.slice(0, 50).map((p, i) => {
          const diff = Number(p.price_difference) || 0;
          return (
            <EventRow
              key={`p-${p.id}-${i}`}
              title={p.item_name}
              subtitle={`${money(p.old_price)} → ${money(p.new_price)}${p.changed_by ? ` · ${p.changed_by}` : ''}`}
              meta={`${fmtTime(p.changed_at)}${p.authorization_profile_name ? ` · ${p.authorization_profile_name}` : ''}`}
              amount={`${diff > 0 ? '+' : ''}${money(diff)}`}
              amountColor={diff < 0 ? palette.dark.danger : palette.dark.success}
              isFirst={i === 0}
            />
          );
        })}
      </ListCard>
    </>
  );
};

const AuditTab: React.FC<{ q: ReturnType<typeof useAuditTrail> }> = ({ q }) => {
  const k = q.data?.kpis;
  const rows = q.data?.audit_trail_list ?? [];
  if (rows.length === 0) return <Empty text="Sin eventos de auditoría en el período." />;
  const sevColor = (s: string) =>
    s === 'HIGH' ? palette.dark.danger : s === 'MEDIUM' ? palette.dark.warning : palette.dark.textMuted;
  return (
    <>
      <SummaryStrip
        stats={[
          { label: 'Eventos', value: fmtInt(k?.total_changes) },
          { label: 'Severidad alta', value: fmtInt(k?.high_severity), danger: (k?.high_severity ?? 0) > 0 },
          { label: 'Usuarios', value: fmtInt(k?.unique_users) },
        ]}
      />
      <ListCard>
        {rows.slice(0, 80).map((e, i) => (
          <EventRow
            key={`a-${e.entity_type}-${e.entity_id}-${i}`}
            title={`${e.action_type} · ${e.entity_type}${e.entity_reference ? ` (${e.entity_reference})` : ''}`}
            subtitle={e.user_name}
            meta={fmtTime(e.action_timestamp)}
            amount={e.severity}
            amountColor={sevColor(e.severity)}
            isFirst={i === 0}
          />
        ))}
      </ListCard>
    </>
  );
};
