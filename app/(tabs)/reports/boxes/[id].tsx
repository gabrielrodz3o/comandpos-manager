import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Skeleton, LoadingState } from '@components/ui';
import { SectionCard } from '@components/dashboard/SectionCard';
import { palette } from '@theme/colors';
import { fmtCurrency, fmtInt } from '@utils/format';
import {
  useBoxEntryDetail,
  useBoxSalesDay,
  useBoxInvoices,
  useBoxDenominations,
} from '@hooks/useBoxes';
import {
  normalizeBoxBalance,
  isMovementEntry,
  movementLabel,
  cleanConcept,
  type BoxBalanceStatus,
  type NormalizedBoxBalance,
} from '@utils/boxBalance';
import type {
  BoxSalesDay,
  BoxPayment,
  BoxDenominationGroup,
} from '@/types/reports';

type TabKey = 'resumen' | 'movimientos' | 'facturas' | 'cortesias' | 'nc';

/** Dinero del cierre: SIEMPRE 2 decimales (fmtCurrency global usa 0 por defecto). */
const money = (n: unknown, cur = 'DOP'): string => fmtCurrency(n, cur, 2);

const fmtDateTime = (raw?: string | null): string => {
  if (!raw) return '—';
  try {
    return new Date(raw).toLocaleString('es-DO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return raw;
  }
};

const shiftDuration = (open?: string | null, close?: string | null): string => {
  if (!open) return '—';
  const start = new Date(open).getTime();
  const end = close ? new Date(close).getTime() : Date.now();
  const diff = Math.max(0, end - start);
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  return `${hours}h ${minutes}m`;
};

// ── Estado del balance → color / etiqueta / emoji ────────────────────
const STATUS_META: Record<
  BoxBalanceStatus,
  { label: string; color: string; bg: string; emoji: string }
> = {
  CUADRADA: { label: 'CUADRADA', color: palette.dark.success, bg: '#D1FAE5', emoji: '✅' },
  SOBRANTE: { label: 'SOBRANTE', color: '#B45309', bg: '#FEF3C7', emoji: '📈' },
  FALTANTE: { label: 'FALTANTE', color: palette.dark.danger, bg: '#FEE2E2', emoji: '⚠️' },
  ABIERTA: { label: 'ABIERTA', color: palette.dark.info, bg: '#DBEAFE', emoji: '🔓' },
  SIN_CERRAR: { label: 'SIN CERRAR', color: palette.dark.textMuted, bg: palette.dark.soft, emoji: '⏳' },
};

const KvRow: React.FC<{
  label: string;
  value: string;
  valueColor?: string;
  strong?: boolean;
}> = ({ label, value, valueColor, strong }) => (
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
    <Text
      style={{
        color: valueColor ?? palette.dark.text,
        fontSize: 13,
        fontWeight: strong ? '800' : '600',
      }}
    >
      {value}
    </Text>
  </View>
);

export default function BoxDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const boxId = Number(id);

  const [tab, setTab] = useState<TabKey>('resumen');

  // Atrás robusto: si hay historial vuelve (con el anchor del stack siempre cae
  // en el listado de cajas); si no, navega explícitamente al listado en vez de
  // salir del tab hacia "Hoy".
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/reports/boxes');
  };

  const detailQ = useBoxEntryDetail(boxId || null);
  const salesDayQ = useBoxSalesDay(boxId || null);
  const invoicesQ = useBoxInvoices(boxId || null);
  const denomQ = useBoxDenominations(boxId || null);

  const box = detailQ.data;
  const salesData = salesDayQ.data ?? [];
  const invoices = invoicesQ.data ?? [];
  const denominations = denomQ.data ?? [];

  // Métricas agregadas
  const ticketAvg =
    invoices.length > 0
      ? invoices.reduce((s, i) => s + Number(i.total_amount ?? 0), 0) / invoices.length
      : 0;

  // Resumen de discrepancias (banner accionable, espejo de la web)
  const discrepancies = useMemo(() => {
    const issues = salesData
      .map((s) => ({ s, b: normalizeBoxBalance(s.box_balance) }))
      .filter(
        ({ b }) =>
          b &&
          b.status !== 'CUADRADA' &&
          b.status !== 'ABIERTA' &&
          b.status !== 'SIN_CERRAR' &&
          Math.abs(b.difference ?? 0) > 0.01,
      );
    if (issues.length === 0) return null;
    const hasFaltante = issues.some(({ b }) => b!.status === 'FALTANTE');
    const detail = issues
      .map(({ s, b }) => {
        const d = b!.difference ?? 0;
        return `${s.out_currency}: ${d > 0 ? '+' : '-'}${money(Math.abs(d), s.out_currency)}`;
      })
      .join('  ·  ');
    return { hasFaltante, detail, count: issues.length };
  }, [salesData]);

  // Métodos de pago agregados (todas las monedas), espejo de typePayments web
  const typePayments = useMemo(() => {
    const all = salesData.flatMap((s) => s.new_payments ?? []);
    const grouped: Record<string, BoxPayment> = {};
    for (const p of all) {
      const key = `${p.payment_type_name}-${p.currency_code ?? ''}`;
      if (!grouped[key]) {
        grouped[key] = {
          payment_type_id: p.payment_type_id,
          payment_type_name: p.payment_type_name,
          currency_code: p.currency_code,
          is_external: !!p.is_external,
          total_ingresos: 0,
          total_egresos: 0,
          total_neto: 0,
          sales_count: 0,
          purchase_count: 0,
          payment_count: 0,
          invoice_count: 0,
          credit_count: 0,
          total_credito_pendiente: 0,
        };
      }
      const g = grouped[key];
      g.total_ingresos += p.total_ingresos || 0;
      g.total_egresos += p.total_egresos || 0;
      g.total_neto += p.total_neto || 0;
      g.sales_count += p.sales_count || 0;
      g.purchase_count += p.purchase_count || 0;
      g.payment_count += p.payment_count || 0;
      g.invoice_count += p.invoice_count || 0;
      g.credit_count = (g.credit_count || 0) + (p.credit_count || 0);
      g.total_credito_pendiente =
        (g.total_credito_pendiente || 0) + (p.total_credito_pendiente || 0);
    }
    return Object.values(grouped).filter(
      (p) => p.payment_count > 0 || (p.payment_type_name === 'CRÉDITO' && (p.credit_count ?? 0) > 0),
    );
  }, [salesData]);

  const denomByCurrency = (currencyId: number): BoxDenominationGroup | undefined =>
    denominations.find((d) => d.currency_id === currencyId);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.dark.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
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
            onPress={goBack}
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
            <Text style={{ color: palette.dark.textDim, fontSize: 11, fontWeight: '500', letterSpacing: 0.5 }}>
              CIERRE DE CAJA
            </Text>
            <Text
              style={{ color: palette.dark.text, fontSize: 20, fontWeight: '700', letterSpacing: -0.5 }}
              numberOfLines={1}
            >
              {box?.box_name ?? 'Caja'}
            </Text>
          </View>
          {box ? (
            <View
              style={{
                backgroundColor: box.is_open ? '#FEF3C7' : palette.dark.primaryDim,
                paddingHorizontal: 9,
                paddingVertical: 4,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  color: box.is_open ? '#92400E' : palette.dark.success,
                  fontSize: 10,
                  fontWeight: '800',
                  letterSpacing: 0.5,
                }}
              >
                {box.is_open ? 'ABIERTA' : 'CERRADA'}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Loading */}
        {detailQ.isLoading ? (
          <View style={{ paddingHorizontal: 16 }}>
            <LoadingState
              label="Cargando cierre de caja…"
              hint="Trayendo balance por moneda, movimientos y facturas."
              variant="centered"
            />
          </View>
        ) : !box ? (
          <View style={{ paddingHorizontal: 16 }}>
            <Card>
              <Text style={{ color: palette.dark.textDim, fontSize: 13, textAlign: 'center' }}>
                Caja no encontrada.
              </Text>
            </Card>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, gap: 14 }}>
            {/* Info general */}
            <Card variant="default">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: palette.dark.primaryDim,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 22 }}>💰</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: palette.dark.text, fontSize: 15, fontWeight: '700' }}>
                    {box.use_fullname}
                  </Text>
                  <Text style={{ color: palette.dark.textMuted, fontSize: 11 }}>
                    Cajero · turno {box.shift_code ?? '—'}
                  </Text>
                </View>
              </View>
              <KvRow label="Apertura" value={fmtDateTime(box.open_at)} />
              <KvRow label="Cierre" value={fmtDateTime(box.close_at)} />
              <KvRow label="Duración" value={shiftDuration(box.open_at, box.close_at)} />
              <KvRow label="Facturas" value={fmtInt(invoices.length)} />
              <KvRow label="Ticket promedio" value={money(ticketAvg)} />
              {box.authorized_by ? (
                <KvRow label="Autorizado por" value={box.authorized_by} />
              ) : null}
            </Card>

            {/* Banner de discrepancias */}
            {discrepancies ? (
              <View
                style={{
                  flexDirection: 'row',
                  gap: 10,
                  padding: 14,
                  borderRadius: 14,
                  backgroundColor: discrepancies.hasFaltante ? '#FEE2E2' : '#FEF3C7',
                  borderWidth: 1,
                  borderColor: discrepancies.hasFaltante ? '#FCA5A5' : '#FDE68A',
                }}
              >
                <Text style={{ fontSize: 18 }}>{discrepancies.hasFaltante ? '⛔' : '⚠️'}</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: discrepancies.hasFaltante ? '#991B1B' : '#92400E',
                      fontSize: 13,
                      fontWeight: '800',
                    }}
                  >
                    {discrepancies.count} caja(s) con descuadre
                  </Text>
                  <Text
                    style={{
                      color: discrepancies.hasFaltante ? '#B91C1C' : '#B45309',
                      fontSize: 12,
                      fontWeight: '600',
                      marginTop: 2,
                    }}
                  >
                    {discrepancies.detail}
                  </Text>
                  <Text style={{ color: palette.dark.textDim, fontSize: 11, marginTop: 4 }}>
                    Posibles causas: factura en turno equivocado · propina en efectivo no
                    registrada · cambio de divisa informal · error de conteo.
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Tabs */}
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: palette.dark.soft,
                borderRadius: 12,
                padding: 3,
                gap: 3,
              }}
            >
              {(
                [
                  { k: 'resumen', label: 'Resumen' },
                  { k: 'movimientos', label: 'Movim.' },
                  { k: 'facturas', label: 'Facturas' },
                  { k: 'cortesias', label: 'Cortes.' },
                  { k: 'nc', label: 'NC' },
                ] as { k: TabKey; label: string }[]
              ).map(({ k, label }) => (
                <Pressable
                  key={k}
                  onPress={() => setTab(k)}
                  style={{
                    flex: 1,
                    paddingVertical: 9,
                    borderRadius: 10,
                    backgroundColor: tab === k ? palette.dark.surface : 'transparent',
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: tab === k ? palette.dark.text : palette.dark.textDim,
                      fontSize: 11,
                      fontWeight: '700',
                    }}
                  >
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Tab: Resumen */}
            {tab === 'resumen' ? (
              <>
                {salesDayQ.isLoading ? (
                  <Skeleton height={260} radius={18} />
                ) : salesData.length === 0 ? (
                  <Card>
                    <Text style={{ color: palette.dark.textMuted, fontSize: 12, textAlign: 'center' }}>
                      Sin balance registrado.
                    </Text>
                  </Card>
                ) : (
                  <>
                    {salesData.map((s) => (
                      <CurrencyBalanceCard
                        key={s.out_currency_id}
                        data={s}
                        denom={denomByCurrency(s.out_currency_id)}
                      />
                    ))}

                    {/* Métodos de pago */}
                    {typePayments.length > 0 ? (
                      <SectionCard
                        title="Métodos de pago"
                        subtitle={`${typePayments.length} métodos`}
                        emoji="💳"
                      >
                        <View style={{ gap: 10 }}>
                          {typePayments.map((p) => (
                            <PaymentMethodRow
                              key={`${p.payment_type_name}-${p.currency_code}`}
                              p={p}
                            />
                          ))}
                        </View>
                      </SectionCard>
                    ) : null}
                  </>
                )}
              </>
            ) : null}

            {/* Tab: Movimientos */}
            {tab === 'movimientos' ? (
              <>
                {salesDayQ.isLoading ? (
                  <Skeleton height={200} radius={18} />
                ) : (
                  salesData.map((s) => {
                    const movs = s.manual_movements?.movements_detail ?? [];
                    if (movs.length === 0) return null;
                    return (
                      <SectionCard
                        key={`mov-${s.out_currency_id}`}
                        title={`Movimientos ${s.out_currency}`}
                        subtitle={`${s.manual_movements?.entries_count ?? 0} entradas · ${
                          s.manual_movements?.exits_count ?? 0
                        } salidas`}
                        emoji="🔄"
                      >
                        <View style={{ gap: 8 }}>
                          {movs.map((m, idx) => {
                            const isIn =
                              m.direction === 'in' ||
                              (m.direction == null && isMovementEntry(m.movement_type));
                            return (
                              <View
                                key={`m-${idx}`}
                                style={{
                                  flexDirection: 'row',
                                  justifyContent: 'space-between',
                                  paddingVertical: 6,
                                  borderBottomWidth: idx < movs.length - 1 ? 0.5 : 0,
                                  borderBottomColor: palette.dark.border,
                                }}
                              >
                                <View style={{ flex: 1, marginRight: 10 }}>
                                  <Text
                                    style={{ color: palette.dark.text, fontSize: 13, fontWeight: '600' }}
                                  >
                                    {movementLabel(m.movement_type)}
                                  </Text>
                                  {m.concept ? (
                                    <Text
                                      style={{ color: palette.dark.textMuted, fontSize: 11 }}
                                      numberOfLines={2}
                                    >
                                      {cleanConcept(m.concept)}
                                    </Text>
                                  ) : null}
                                  {m.user_name ? (
                                    <Text style={{ color: palette.dark.textMuted, fontSize: 10, marginTop: 1 }}>
                                      {m.user_name}
                                    </Text>
                                  ) : null}
                                </View>
                                <Text
                                  style={{
                                    color: isIn ? palette.dark.success : palette.dark.danger,
                                    fontSize: 13,
                                    fontWeight: '700',
                                  }}
                                >
                                  {isIn ? '+' : '-'}
                                  {money(Math.abs(Number(m.amount)), s.out_currency)}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      </SectionCard>
                    );
                  })
                )}
                {!salesDayQ.isLoading &&
                salesData.every((s) => !(s.manual_movements?.movements_detail?.length)) ? (
                  <Card>
                    <Text style={{ color: palette.dark.textMuted, fontSize: 12, textAlign: 'center' }}>
                      Sin movimientos manuales en esta caja.
                    </Text>
                  </Card>
                ) : null}
              </>
            ) : null}

            {/* Tab: Facturas */}
            {tab === 'facturas' ? (
              <>
                {invoicesQ.isLoading ? (
                  <Skeleton height={200} radius={18} />
                ) : invoices.length === 0 ? (
                  <Card>
                    <Text style={{ color: palette.dark.textMuted, fontSize: 12, textAlign: 'center' }}>
                      Sin facturas en esta caja.
                    </Text>
                  </Card>
                ) : (
                  <SectionCard
                    title="Facturas del turno"
                    subtitle={`${invoices.length} facturas · ${money(
                      invoices.reduce((s, i) => s + Number(i.total_amount ?? 0), 0),
                    )}`}
                    emoji="🧾"
                  >
                    <View style={{ gap: 10 }}>
                      {invoices.map((inv, idx) => (
                        <View
                          key={`inv-${inv.invoice_id ?? idx}`}
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            paddingVertical: 6,
                            borderBottomWidth: idx < invoices.length - 1 ? 0.5 : 0,
                            borderBottomColor: palette.dark.border,
                          }}
                        >
                          <View style={{ flex: 1, marginRight: 10 }}>
                            <Text
                              style={{ color: palette.dark.text, fontSize: 13, fontWeight: '600' }}
                              numberOfLines={1}
                            >
                              {inv.invoice_ncf ?? inv.invoice_number ?? `Factura #${inv.invoice_id}`}
                            </Text>
                            <Text style={{ color: palette.dark.textMuted, fontSize: 11 }} numberOfLines={1}>
                              {inv.customer_name ?? inv.waiter_name ?? 'Sin cliente'}
                              {inv.table_name ? ` · ${inv.table_name}` : ''}
                              {inv.emission_date ? ` · ${fmtDateTime(inv.emission_date)}` : ''}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ color: palette.dark.text, fontSize: 13, fontWeight: '700' }}>
                              {money(inv.total_amount, inv.currency_code ?? 'DOP')}
                            </Text>
                            {Number(inv.invoice_tip) ? (
                              <Text style={{ color: palette.dark.textMuted, fontSize: 10 }}>
                                propina {money(inv.invoice_tip)}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      ))}
                    </View>
                  </SectionCard>
                )}
              </>
            ) : null}

            {/* Tab: Cortesías */}
            {tab === 'cortesias' ? (
              <>
                {salesDayQ.isLoading ? (
                  <Skeleton height={200} radius={18} />
                ) : (
                  salesData.map((s) => {
                    const cs = s.courtesies?.courtesies_detail ?? [];
                    if (cs.length === 0) return null;
                    return (
                      <SectionCard
                        key={`cort-${s.out_currency_id}`}
                        title={`Cortesías ${s.out_currency}`}
                        subtitle={`${s.courtesies?.courtesies_count ?? cs.length} · ${money(
                          s.courtesies?.total_courtesies_sale ?? 0,
                          s.out_currency,
                        )}`}
                        emoji="🎁"
                      >
                        <View style={{ gap: 10 }}>
                          {cs.map((c, idx) => (
                            <View
                              key={`c-${idx}`}
                              style={{
                                paddingVertical: 6,
                                borderBottomWidth: idx < cs.length - 1 ? 0.5 : 0,
                                borderBottomColor: palette.dark.border,
                              }}
                            >
                              <View
                                style={{
                                  flexDirection: 'row',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}
                              >
                                <Text
                                  style={{ color: palette.dark.text, fontSize: 13, fontWeight: '600', flex: 1 }}
                                  numberOfLines={1}
                                >
                                  {c.reason ?? 'Cortesía'}
                                  {c.table_name ? ` · ${c.table_name}` : ''}
                                </Text>
                                <Text style={{ color: palette.dark.danger, fontSize: 13, fontWeight: '700' }}>
                                  {money(c.total_sale_price, s.out_currency)}
                                </Text>
                              </View>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                                <Text style={{ color: palette.dark.textMuted, fontSize: 11 }} numberOfLines={1}>
                                  {[c.waiter, c.authorized_by && `aut. ${c.authorized_by}`]
                                    .filter(Boolean)
                                    .join(' · ')}
                                </Text>
                                {Number(c.utility_lost) ? (
                                  <Text style={{ color: palette.dark.textMuted, fontSize: 11 }}>
                                    util. perdida {money(c.utility_lost, s.out_currency)}
                                  </Text>
                                ) : null}
                              </View>
                            </View>
                          ))}
                        </View>
                      </SectionCard>
                    );
                  })
                )}
                {!salesDayQ.isLoading &&
                salesData.every((s) => !(s.courtesies?.courtesies_detail?.length)) ? (
                  <Card>
                    <Text style={{ color: palette.dark.textMuted, fontSize: 12, textAlign: 'center' }}>
                      Sin cortesías en esta caja.
                    </Text>
                  </Card>
                ) : null}
              </>
            ) : null}

            {/* Tab: Notas de crédito (informativo — no altera el cuadre) */}
            {tab === 'nc' ? (
              <>
                {salesDayQ.isLoading ? (
                  <Skeleton height={200} radius={18} />
                ) : (
                  salesData.map((s) => {
                    const notes = s.credit_notes?.notes_detail ?? [];
                    if (notes.length === 0) return null;
                    return (
                      <SectionCard
                        key={`nc-${s.out_currency_id}`}
                        title={`Notas de crédito ${s.out_currency}`}
                        subtitle={`${s.credit_notes?.notes_count ?? notes.length} · ${money(
                          s.credit_notes?.total_credited ?? 0,
                          s.out_currency,
                        )} acreditado`}
                        emoji="🧾"
                      >
                        <View style={{ gap: 10 }}>
                          {notes.map((nc, idx) => (
                            <View
                              key={`nc-${nc.nc_id ?? idx}`}
                              style={{
                                paddingVertical: 6,
                                borderBottomWidth: idx < notes.length - 1 ? 0.5 : 0,
                                borderBottomColor: palette.dark.border,
                              }}
                            >
                              <View
                                style={{
                                  flexDirection: 'row',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}
                              >
                                <Text
                                  style={{ color: palette.dark.text, fontSize: 13, fontWeight: '600', flex: 1 }}
                                  numberOfLines={1}
                                >
                                  {nc.nc_number ?? 'NC'}
                                  {nc.affected_invoice_number ? ` → ${nc.affected_invoice_number}` : ''}
                                </Text>
                                <Text style={{ color: palette.dark.danger, fontSize: 13, fontWeight: '700' }}>
                                  −{money(nc.nc_total ?? 0, s.out_currency)}
                                </Text>
                              </View>
                              {(nc.annulled_payments ?? []).map((p, pi) => (
                                <View
                                  key={`ap-${pi}`}
                                  style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}
                                >
                                  <Text style={{ color: palette.dark.textMuted, fontSize: 11 }}>
                                    Pago anulado · {p.payment_type_name ?? '—'}
                                  </Text>
                                  <Text style={{ color: palette.dark.textMuted, fontSize: 11 }}>
                                    −{money(p.amount ?? 0, s.out_currency)}
                                  </Text>
                                </View>
                              ))}
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                                <Text style={{ color: palette.dark.textMuted, fontSize: 11 }} numberOfLines={1}>
                                  {[nc.user_name, nc.created_at].filter(Boolean).join(' · ')}
                                </Text>
                                {Number(nc.cash_refund) > 0 ? (
                                  <Text style={{ color: palette.dark.danger, fontSize: 11 }}>
                                    efectivo devuelto −{money(nc.cash_refund ?? 0, s.out_currency)}
                                  </Text>
                                ) : null}
                              </View>
                            </View>
                          ))}
                        </View>
                      </SectionCard>
                    );
                  })
                )}
                {!salesDayQ.isLoading &&
                salesData.every((s) => !(s.credit_notes?.notes_detail?.length)) ? (
                  <Card>
                    <Text style={{ color: palette.dark.textMuted, fontSize: 12, textAlign: 'center' }}>
                      Sin notas de crédito en este turno.
                    </Text>
                  </Card>
                ) : null}
              </>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Tarjeta de balance por moneda ────────────────────────────────────
const CurrencyBalanceCard: React.FC<{
  data: BoxSalesDay;
  denom?: BoxDenominationGroup;
}> = ({ data, denom }) => {
  const b: NormalizedBoxBalance | null = normalizeBoxBalance(data.box_balance);
  const cur = data.out_currency;
  const totalSales = (data.new_payments ?? []).reduce((t, p) => t + (p.total_neto || 0), 0);

  if (!b) {
    return (
      <Card variant="default">
        <Text style={{ color: palette.dark.textMuted, fontSize: 12, textAlign: 'center' }}>
          Sin balance para {cur}.
        </Text>
      </Card>
    );
  }

  const meta = STATUS_META[b.status];
  const showDiff = b.status === 'FALTANTE' || b.status === 'SOBRANTE';

  return (
    <Card variant="default">
      {/* Header: moneda + total ventas */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: palette.dark.primaryDim,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '800', color: palette.dark.success }}>{cur}</Text>
          </View>
          <View>
            <Text style={{ color: palette.dark.text, fontSize: 14, fontWeight: '700' }}>
              Balance {cur}
            </Text>
            <Text style={{ color: palette.dark.textMuted, fontSize: 10 }}>Total ventas del turno</Text>
          </View>
        </View>
        <Text style={{ color: palette.dark.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.5 }}>
          {money(totalSales, cur)}
        </Text>
      </View>

      {/* Veredicto */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: meta.bg,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 10,
          marginBottom: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 16 }}>{meta.emoji}</Text>
          <Text style={{ color: meta.color, fontSize: 13, fontWeight: '800', letterSpacing: 0.3 }}>
            {meta.label}
          </Text>
        </View>
        {showDiff && b.difference != null ? (
          <Text style={{ color: meta.color, fontSize: 15, fontWeight: '800' }}>
            {b.difference > 0 ? '+' : '-'}
            {money(Math.abs(b.difference), cur)}
          </Text>
        ) : (
          <Text style={{ color: meta.color, fontSize: 12, fontWeight: '700' }}>
            {b.status === 'CUADRADA' ? 'Sin diferencia' : ''}
          </Text>
        )}
      </View>

      {/* Monto inicial */}
      <KvRow label="Monto inicial" value={money(b.initial_amount, cur)} strong />

      {/* Ingresos */}
      {b.sales_cash_income > 0 ? (
        <KvRow
          label="(+) Ventas efectivo"
          value={`+${money(b.sales_cash_income, cur)}`}
          valueColor={palette.dark.success}
        />
      ) : null}
      {b.manual_entries > 0 ? (
        <KvRow
          label="(+) Entradas manuales"
          value={`+${money(b.manual_entries, cur)}`}
          valueColor={palette.dark.success}
        />
      ) : null}

      {/* Egresos */}
      {b.purchases_cash_outcome > 0 ? (
        <KvRow
          label="(–) Compras efectivo"
          value={`-${money(b.purchases_cash_outcome, cur)}`}
          valueColor={palette.dark.danger}
        />
      ) : null}
      {b.manual_exits > 0 ? (
        <KvRow
          label="(–) Salidas manuales"
          value={`-${money(b.manual_exits, cur)}`}
          valueColor={palette.dark.danger}
        />
      ) : null}

      {/* Esperado vs físico */}
      <KvRow label="Esperado en gaveta" value={money(b.expected_balance, cur)} strong />
      <KvRow
        label="Físico declarado"
        value={b.closed_amount == null ? '—' : money(b.closed_amount, cur)}
        strong
      />

      {/* Cortesías informativo */}
      {b.courtesies_amount > 0 ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 8,
            paddingHorizontal: 10,
            paddingVertical: 8,
            backgroundColor: '#FEF3C7',
            borderRadius: 10,
          }}
        >
          <Text style={{ color: '#92400E', fontSize: 11, fontWeight: '600', flex: 1 }}>
            🎁 Cortesías (informativo · no afecta caja)
          </Text>
          <Text style={{ color: '#92400E', fontSize: 12, fontWeight: '700' }}>
            {money(b.courtesies_amount, cur)}
          </Text>
        </View>
      ) : null}

      {/* Desglose físico de denominaciones */}
      {denom && denom.rows.length > 0 ? (
        <View
          style={{
            marginTop: 12,
            paddingTop: 10,
            borderTopWidth: 0.5,
            borderTopColor: palette.dark.border,
          }}
        >
          <Text style={{ color: palette.dark.textDim, fontSize: 11, fontWeight: '700', marginBottom: 6 }}>
            DESGLOSE FÍSICO CONTADO
          </Text>
          {denom.rows.map((d) => (
            <View
              key={d.value}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 3,
              }}
            >
              <Text style={{ color: palette.dark.textDim, fontSize: 12 }}>
                {d.type === 'BILL' ? '💵' : '🪙'} {cur} {d.value.toLocaleString('es-DO')}
              </Text>
              <Text style={{ color: palette.dark.textMuted, fontSize: 12 }}>× {d.quantity}</Text>
              <Text style={{ color: palette.dark.text, fontSize: 12, fontWeight: '600' }}>
                {money(d.subtotal, cur)}
              </Text>
            </View>
          ))}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 6,
              paddingTop: 6,
              borderTopWidth: 0.5,
              borderTopColor: palette.dark.border,
            }}
          >
            <Text style={{ color: palette.dark.text, fontSize: 12, fontWeight: '800' }}>
              Total contado
            </Text>
            <Text style={{ color: palette.dark.text, fontSize: 13, fontWeight: '800' }}>
              {money(denom.total, cur)}
            </Text>
          </View>
        </View>
      ) : null}
    </Card>
  );
};

// ── Fila de método de pago ───────────────────────────────────────────
const PaymentMethodRow: React.FC<{ p: BoxPayment }> = ({ p }) => {
  const isCredit = p.payment_type_name === 'CRÉDITO';
  const isCash = p.payment_type_id === 1;
  const ingresos = isCredit ? p.total_credito_pendiente ?? 0 : p.total_ingresos;
  const salesCount = isCredit ? p.credit_count ?? 0 : p.sales_count;
  const cur = p.currency_code ?? 'DOP';

  const accent = isCash
    ? palette.dark.success
    : isCredit
    ? palette.dark.warning
    : p.is_external
    ? palette.dark.info
    : palette.dark.text;

  return (
    <View
      style={{
        paddingVertical: 8,
        paddingHorizontal: 10,
        backgroundColor: palette.dark.soft,
        borderRadius: 12,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: palette.dark.text, fontSize: 13, fontWeight: '700' }}>
            {p.payment_type_name}
            <Text style={{ color: palette.dark.textMuted, fontWeight: '500' }}> · {cur}</Text>
          </Text>
          {p.is_external ? (
            <Text style={{ color: palette.dark.textMuted, fontSize: 10 }}>
              liquida plataforma · no es efectivo
            </Text>
          ) : null}
        </View>
        <Text style={{ color: accent, fontSize: 14, fontWeight: '800' }}>
          {money(p.total_neto, cur)}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <Text style={{ color: palette.dark.textMuted, fontSize: 11 }}>
          {isCredit ? 'Ventas crédito' : 'Ingresos'} {money(ingresos, cur)}
        </Text>
        {p.total_egresos > 0 ? (
          <Text style={{ color: palette.dark.textMuted, fontSize: 11 }}>
            Egresos {money(p.total_egresos, cur)}
          </Text>
        ) : null}
        <Text style={{ color: palette.dark.textMuted, fontSize: 11 }}>
          {fmtInt(salesCount)} ventas
        </Text>
      </View>
    </View>
  );
};
