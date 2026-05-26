import React, { useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ReportHeader } from '@components/reports/ReportHeader';
import { ActiveLocationBanner } from '@components/reports/ActiveLocationBanner';
import { KpiCard } from '@components/dashboard/KpiCard';
import { SectionCard } from '@components/dashboard/SectionCard';
import { Card, LoadingState, InlineFetchingBar } from '@components/ui';
import { palette, chartPalette } from '@theme/colors';
import { fmtCurrency, fmtInt } from '@utils/format';
import { useWaiterSales } from '@hooks/useWaiterSales';

const n = (v: unknown) => Number(v ?? 0);

const STAFF_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  waiter:     { label: 'Mesero',  bg: '#ECFDF5', color: '#047857' },
  user:       { label: 'Usuario', bg: '#EFF6FF', color: '#1D4ED8' },
  unassigned: { label: 'S/asig.', bg: '#FFFBEB', color: '#92400E' },
};

export default function WaiterSalesScreen() {
  const { data, isLoading, isFetching, isRefetching, refetch, error, eff } = useWaiterSales();

  // Rows ya vienen agregadas por staff. Solo ordenamos por total_sales DESC (por si acaso).
  const rows = useMemo(() => {
    const list = (data?.data ?? []).slice();
    list.sort((a, b) => n(b.total_sales) - n(a.total_sales));
    return list;
  }, [data]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, r) => {
          acc.sales += n(r.total_sales);
          acc.tips += n(r.total_tips);
          acc.invoices += n(r.total_invoices);
          acc.accounts += n(r.total_accounts);
          return acc;
        },
        { sales: 0, tips: 0, invoices: 0, accounts: 0 },
      ),
    [rows],
  );

  const maxSales = rows[0]?.total_sales ?? 0;
  const summary = data?.summary;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.dark.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <ReportHeader title="Por Mesero" subtitle="Ranking del equipo" />

        <InlineFetchingBar visible={isFetching && !isLoading} />

        <View style={{ paddingHorizontal: 16, gap: 14 }}>
          <ActiveLocationBanner eff={eff} />

          {eff.needsExplicitSelection ? null : isLoading ? (
            <LoadingState
              label="Cargando ventas por mesero…"
              hint="Calculando totales y rankings por staff."
              variant="centered"
            />
          ) : error ? (
            <Card>
              <Text style={{ color: palette.dark.danger, fontSize: 14, fontWeight: '700' }}>Error</Text>
              <Text style={{ color: palette.dark.textDim, fontSize: 12, marginTop: 4 }}>
                {(error as Error)?.message ?? 'No se pudo cargar el reporte.'}
              </Text>
            </Card>
          ) : rows.length === 0 ? (
            <Card>
              <Text style={{ color: palette.dark.text, fontSize: 14, fontWeight: '700', textAlign: 'center', marginBottom: 6 }}>
                Sin actividad
              </Text>
              <Text style={{ color: palette.dark.textDim, fontSize: 12, textAlign: 'center' }}>
                No hay ventas por mesero en el período seleccionado.
              </Text>
            </Card>
          ) : (
            <>
              {/* Hero */}
              <KpiCard
                variant="hero"
                label="Ventas del equipo"
                value={fmtCurrency(totals.sales)}
                hint={`${fmtInt(totals.invoices)} facturas · ${rows.length} miembros`}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <KpiCard
                  label="Propinas"
                  value={fmtCurrency(totals.tips)}
                  emoji="💵"
                  hint={`${fmtCurrency(totals.tips / Math.max(1, totals.invoices))} prom.`}
                />
                <KpiCard
                  label="Mejor mesero"
                  value={rows[0]?.staff_name ?? '—'}
                  emoji="🥇"
                  hint={fmtCurrency(rows[0]?.total_sales ?? 0)}
                />
              </View>

              {summary ? (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <KpiCard
                    label="Cuentas"
                    value={fmtInt(summary.total_accounts ?? totals.accounts)}
                    emoji="📋"
                    hint={`${fmtInt(summary.total_waiters ?? 0)} meseros activos`}
                  />
                  <KpiCard
                    label="Tipos"
                    value={`${fmtInt(summary.total_waiters)}M / ${fmtInt(summary.total_users)}U`}
                    emoji="👥"
                    hint={summary.total_unassigned ? `${fmtInt(summary.total_unassigned)} sin asignar` : 'todos asignados'}
                  />
                </View>
              ) : null}

              {/* Ranking */}
              <SectionCard title="Ranking" subtitle={`${rows.length} miembros activos`} emoji="🏆">
                <View style={{ gap: 16 }}>
                  {rows.map((r, idx) => {
                    const pct = maxSales > 0 ? (n(r.total_sales) / n(maxSales)) * 100 : 0;
                    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
                    const badge = STAFF_BADGE[r.staff_type ?? ''];
                    return (
                      <View key={`w-${r.staff_id}-${idx}`} style={{ gap: 8 }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                            <View
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                backgroundColor: idx < 3 ? palette.dark.primaryDim : palette.dark.soft,
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: medal ? 18 : 12,
                                  fontWeight: '800',
                                  color: palette.dark.text,
                                }}
                              >
                                {medal ?? `#${idx + 1}`}
                              </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text
                                  style={{ color: palette.dark.text, fontSize: 14, fontWeight: '700', letterSpacing: -0.2 }}
                                  numberOfLines={1}
                                >
                                  {r.staff_name || 'Sin nombre'}
                                </Text>
                                {badge ? (
                                  <View
                                    style={{
                                      backgroundColor: badge.bg,
                                      paddingHorizontal: 6,
                                      paddingVertical: 1,
                                      borderRadius: 5,
                                    }}
                                  >
                                    <Text style={{ color: badge.color, fontSize: 9, fontWeight: '800', letterSpacing: 0.4 }}>
                                      {badge.label}
                                    </Text>
                                  </View>
                                ) : null}
                              </View>
                              <Text style={{ color: palette.dark.textMuted, fontSize: 11, marginTop: 2 }}>
                                {fmtInt(r.total_invoices)} fact. · {fmtInt(r.total_accounts)} cuentas
                                {r.waiter_pin ? ` · PIN ${r.waiter_pin}` : ''}
                              </Text>
                            </View>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ color: palette.dark.text, fontSize: 14, fontWeight: '700' }}>
                              {fmtCurrency(r.total_sales)}
                            </Text>
                            <Text style={{ color: palette.dark.textMuted, fontSize: 10 }}>
                              prop. {fmtCurrency(r.total_tips)}
                            </Text>
                          </View>
                        </View>
                        <View
                          style={{
                            height: 5,
                            backgroundColor: palette.dark.soft,
                            borderRadius: 3,
                            overflow: 'hidden',
                          }}
                        >
                          <View
                            style={{
                              width: `${pct}%`,
                              height: '100%',
                              backgroundColor: chartPalette[idx % chartPalette.length],
                            }}
                          />
                        </View>
                        {r.average_invoice_ticket ? (
                          <View
                            style={{
                              flexDirection: 'row',
                              gap: 12,
                              marginTop: 2,
                            }}
                          >
                            <Text style={{ color: palette.dark.textMuted, fontSize: 10 }}>
                              ticket {fmtCurrency(r.average_invoice_ticket)}
                            </Text>
                            {r.total_discounts ? (
                              <Text style={{ color: palette.dark.textMuted, fontSize: 10 }}>
                                desc. {fmtCurrency(r.total_discounts)}
                              </Text>
                            ) : null}
                            {r.total_courtesies_amount ? (
                              <Text style={{ color: palette.dark.warning, fontSize: 10 }}>
                                cortesías {fmtCurrency(r.total_courtesies_amount)}
                              </Text>
                            ) : null}
                          </View>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              </SectionCard>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
