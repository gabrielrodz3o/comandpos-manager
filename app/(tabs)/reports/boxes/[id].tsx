import React, { useState } from 'react';
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
} from '@hooks/useBoxes';
import type { BoxSalesDay } from '@/types/reports';

type TabKey = 'resumen' | 'movimientos' | 'facturas' | 'cortesias';

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

const KvRow: React.FC<{ label: string; value: string; valueColor?: string }> = ({
  label,
  value,
  valueColor,
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
    <Text style={{ color: valueColor ?? palette.dark.text, fontSize: 13, fontWeight: '600' }}>
      {value}
    </Text>
  </View>
);

export default function BoxDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const boxId = Number(id);

  const [tab, setTab] = useState<TabKey>('resumen');

  const detailQ = useBoxEntryDetail(boxId || null);
  const salesDayQ = useBoxSalesDay(boxId || null);
  const invoicesQ = useBoxInvoices(boxId || null);

  const box = detailQ.data;
  const salesData = salesDayQ.data ?? [];
  const invoices = invoicesQ.data ?? [];

  // Métricas agregadas
  const ticketAvg =
    invoices.length > 0
      ? invoices.reduce((s, i) => s + Number(i.total_amount ?? 0), 0) / invoices.length
      : 0;

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
            <Text style={{ color: palette.dark.textDim, fontSize: 11, fontWeight: '500', letterSpacing: 0.5 }}>
              DETALLE DE CAJA
            </Text>
            <Text
              style={{
                color: palette.dark.text,
                fontSize: 20,
                fontWeight: '700',
                letterSpacing: -0.5,
              }}
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
              label="Cargando detalle de caja…"
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
              <KvRow label="Ticket promedio" value={fmtCurrency(ticketAvg)} />
              {box.authorized_by ? (
                <KvRow label="Autorizado por" value={box.authorized_by} />
              ) : null}
            </Card>

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
                  <Skeleton height={200} radius={18} />
                ) : salesData.length === 0 ? (
                  <Card>
                    <Text style={{ color: palette.dark.textMuted, fontSize: 12, textAlign: 'center' }}>
                      Sin balance registrado.
                    </Text>
                  </Card>
                ) : (
                  salesData.map((s) => <CurrencyBalanceCard key={s.out_currency_id} data={s} />)
                )}
              </>
            ) : null}

            {/* Tab: Movimientos */}
            {tab === 'movimientos' ? (
              <>
                {salesDayQ.isLoading ? (
                  <Skeleton height={200} radius={18} />
                ) : (
                  salesData.map((s) =>
                    s.movements && s.movements.length > 0 ? (
                      <SectionCard
                        key={`mov-${s.out_currency_id}`}
                        title={`Movimientos ${s.out_currency}`}
                        subtitle={`${s.movements.length} registros`}
                        emoji="🔄"
                      >
                        <View style={{ gap: 8 }}>
                          {s.movements.map((m, idx) => (
                            <View
                              key={`m-${idx}`}
                              style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                paddingVertical: 4,
                                borderBottomWidth: idx < s.movements!.length - 1 ? 0.5 : 0,
                                borderBottomColor: palette.dark.border,
                              }}
                            >
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={{ color: palette.dark.text, fontSize: 13, fontWeight: '600' }}
                                >
                                  {m.movement_type}
                                </Text>
                                {m.note ? (
                                  <Text style={{ color: palette.dark.textMuted, fontSize: 11 }}>
                                    {m.note}
                                  </Text>
                                ) : null}
                              </View>
                              <Text
                                style={{
                                  color:
                                    Number(m.amount) >= 0
                                      ? palette.dark.success
                                      : palette.dark.danger,
                                  fontSize: 13,
                                  fontWeight: '700',
                                }}
                              >
                                {Number(m.amount) >= 0 ? '+' : ''}
                                {fmtCurrency(m.amount, s.out_currency)}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </SectionCard>
                    ) : null,
                  )
                )}
                {!salesDayQ.isLoading &&
                salesData.every((s) => !s.movements || s.movements.length === 0) ? (
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
                    subtitle={`${invoices.length} facturas · ${fmtCurrency(
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
                            <Text
                              style={{ color: palette.dark.text, fontSize: 13, fontWeight: '700' }}
                            >
                              {fmtCurrency(inv.total_amount, inv.currency_code ?? 'DOP')}
                            </Text>
                            {Number(inv.invoice_tip) ? (
                              <Text style={{ color: palette.dark.textMuted, fontSize: 10 }}>
                                propina {fmtCurrency(inv.invoice_tip)}
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
                  salesData.map((s) =>
                    s.courtesies && s.courtesies.length > 0 ? (
                      <SectionCard
                        key={`cort-${s.out_currency_id}`}
                        title={`Cortesías ${s.out_currency}`}
                        subtitle={`${s.courtesies.length} registros`}
                        emoji="🎁"
                      >
                        <View style={{ gap: 10 }}>
                          {s.courtesies.map((c, idx) => (
                            <View
                              key={`c-${idx}`}
                              style={{
                                paddingVertical: 6,
                                borderBottomWidth: idx < s.courtesies!.length - 1 ? 0.5 : 0,
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
                                </Text>
                                <Text
                                  style={{
                                    color: palette.dark.danger,
                                    fontSize: 13,
                                    fontWeight: '700',
                                  }}
                                >
                                  {fmtCurrency(c.total_sale_price, s.out_currency)}
                                </Text>
                              </View>
                              {Number(c.utility_lost) ? (
                                <Text style={{ color: palette.dark.textMuted, fontSize: 11, marginTop: 2 }}>
                                  utilidad perdida: {fmtCurrency(c.utility_lost, s.out_currency)}
                                </Text>
                              ) : null}
                            </View>
                          ))}
                        </View>
                      </SectionCard>
                    ) : null,
                  )
                )}
                {!salesDayQ.isLoading &&
                salesData.every((s) => !s.courtesies || s.courtesies.length === 0) ? (
                  <Card>
                    <Text style={{ color: palette.dark.textMuted, fontSize: 12, textAlign: 'center' }}>
                      Sin cortesías en esta caja.
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

const CurrencyBalanceCard: React.FC<{ data: BoxSalesDay }> = ({ data }) => {
  const b = data.box_balance;
  const initial = Number(b?.initial_amount ?? 0);
  const closed = Number(b?.closed_amount ?? 0);
  const cashIn = Number(b?.sales_cash_income ?? 0);
  const cardIn = Number(b?.sales_card_income ?? 0);
  const creditIn = Number(b?.sales_credit_income ?? 0);
  const expenses = Number(b?.expenses_total ?? 0);
  const movements = Number(b?.movements_total ?? 0);
  const courtesy = Number(b?.courtesy_total ?? 0);
  const totalSales = cashIn + cardIn + creditIn;
  const diff = closed - initial;

  return (
    <Card variant="default">
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
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
            <Text style={{ fontSize: 16, fontWeight: '800', color: palette.dark.success }}>
              {data.out_currency}
            </Text>
          </View>
          <View>
            <Text style={{ color: palette.dark.text, fontSize: 14, fontWeight: '700' }}>
              Balance {data.out_currency}
            </Text>
            <Text style={{ color: palette.dark.textMuted, fontSize: 10 }}>
              Total ventas del turno
            </Text>
          </View>
        </View>
        <Text style={{ color: palette.dark.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.5 }}>
          {fmtCurrency(totalSales, data.out_currency)}
        </Text>
      </View>

      {/* Sections */}
      <KvRow label="Apertura" value={fmtCurrency(initial, data.out_currency)} />
      <KvRow
        label="(+) Ventas Efectivo"
        value={fmtCurrency(cashIn, data.out_currency)}
        valueColor={palette.dark.success}
      />
      {cardIn ? (
        <KvRow
          label="(+) Ventas Tarjeta"
          value={fmtCurrency(cardIn, data.out_currency)}
          valueColor={palette.dark.success}
        />
      ) : null}
      {creditIn ? (
        <KvRow
          label="(+) Crédito"
          value={fmtCurrency(creditIn, data.out_currency)}
          valueColor={palette.dark.success}
        />
      ) : null}
      {expenses ? (
        <KvRow
          label="(–) Gastos / Sangrías"
          value={`(${fmtCurrency(expenses, data.out_currency)})`}
          valueColor={palette.dark.danger}
        />
      ) : null}
      {movements ? (
        <KvRow label="Movimientos netos" value={fmtCurrency(movements, data.out_currency)} />
      ) : null}
      {courtesy ? (
        <KvRow
          label="Cortesías"
          value={`(${fmtCurrency(courtesy, data.out_currency)})`}
          valueColor={palette.dark.danger}
        />
      ) : null}

      <View style={{ height: 10 }} />

      {/* Closing */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 10,
          backgroundColor: palette.dark.soft,
          borderRadius: 10,
          paddingHorizontal: 12,
        }}
      >
        <Text style={{ color: palette.dark.text, fontSize: 13, fontWeight: '800' }}>
          Cierre
        </Text>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: palette.dark.text, fontSize: 15, fontWeight: '800' }}>
            {fmtCurrency(closed, data.out_currency)}
          </Text>
          {diff !== 0 ? (
            <Text
              style={{
                color: diff >= 0 ? palette.dark.success : palette.dark.danger,
                fontSize: 11,
                fontWeight: '700',
              }}
            >
              {diff > 0 ? '+' : ''}
              {fmtCurrency(diff, data.out_currency)} dif.
            </Text>
          ) : null}
        </View>
      </View>
    </Card>
  );
};
