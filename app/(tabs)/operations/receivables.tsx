import React from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card, LoadingState, InlineFetchingBar } from '@components/ui';
import { ActiveLocationBanner } from '@components/reports/ActiveLocationBanner';
import { LocationSelector } from '@components/dashboard/LocationSelector';
import { KpiCard } from '@components/dashboard/KpiCard';
import { SectionCard } from '@components/dashboard/SectionCard';
import { PresetChips } from '@components/dashboard/PresetChips';
import { palette } from '@theme/colors';
import { fmtCurrency, fmtInt } from '@utils/format';
import { useARSummary, useARAging } from '@hooks/useOperations';

const n = (v: unknown) => Number(v ?? 0);

const extractAgingList = (data: unknown): Array<Record<string, unknown>> => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  const d = data as Record<string, unknown>;
  if (Array.isArray(d.agingDetails)) return d.agingDetails as Array<Record<string, unknown>>;
  if (Array.isArray(d.aging)) return d.aging as Array<Record<string, unknown>>;
  if (Array.isArray(d.invoices)) return d.invoices as Array<Record<string, unknown>>;
  if (Array.isArray(d.data)) return d.data as Array<Record<string, unknown>>;
  return [];
};

const extractSummary = (data: unknown): Record<string, unknown> | null => {
  if (!data) return null;
  const d = data as Record<string, unknown>;
  if (d.summary) return d.summary as Record<string, unknown>;
  return d;
};

export default function ReceivablesScreen() {
  const router = useRouter();
  const summaryQ = useARSummary();
  const agingQ = useARAging();

  const eff = summaryQ.eff;
  const summary = extractSummary(summaryQ.data);
  const agingList = extractAgingList(agingQ.data);

  const isLoading = summaryQ.isLoading;
  const isFetching = summaryQ.isFetching || agingQ.isFetching;

  const onRefresh = () => {
    summaryQ.refetch();
    agingQ.refetch();
  };

  const totalPending = n(summary?.total_pending);
  const pendingInvoices = n(summary?.pending_invoices);
  const totalCollected = n(summary?.total_collected);
  const paidInvoices = n(summary?.paid_invoices);
  const avgDays = n(summary?.avg_collection_days);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.dark.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={summaryQ.isRefetching} onRefresh={onRefresh} />}
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
              Cuentas por Cobrar
            </Text>
            <Text style={{ color: palette.dark.textDim, fontSize: 12, fontWeight: '500' }}>
              Clientes con saldo pendiente
            </Text>
          </View>
        </View>

        <View style={{ marginBottom: 12 }}>
          <PresetChips />
        </View>

        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <LocationSelector />
        </View>

        <InlineFetchingBar visible={isFetching && !isLoading} />

        <View style={{ paddingHorizontal: 16, gap: 14 }}>
          <ActiveLocationBanner eff={eff} />

          {eff.needsExplicitSelection ? null : isLoading ? (
            <LoadingState
              label="Cargando cuentas por cobrar…"
              hint="Consolidando facturas pendientes y cobranzas."
            />
          ) : !summary ? (
            <Card>
              <Text style={{ color: palette.dark.textDim, fontSize: 13, textAlign: 'center' }}>
                Sin datos de cuentas por cobrar en el período.
              </Text>
            </Card>
          ) : (
            <>
              <KpiCard
                variant="hero"
                label="Por Cobrar"
                value={fmtCurrency(totalPending)}
                hint={`${fmtInt(pendingInvoices)} facturas pendientes`}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <KpiCard
                  label="Cobrado"
                  value={fmtCurrency(totalCollected)}
                  emoji="✅"
                  hint={`${fmtInt(paidInvoices)} facturas`}
                />
                <KpiCard
                  label="% Cobranza"
                  value={`${
                    totalCollected + totalPending > 0
                      ? Math.round((totalCollected / (totalCollected + totalPending)) * 100)
                      : 0
                  }%`}
                  emoji="📊"
                  hint={avgDays ? `${Math.round(avgDays)}d promedio` : 'del período'}
                />
              </View>

              {agingList.length > 0 ? (
                <SectionCard
                  title="Facturas pendientes"
                  subtitle={`${agingList.length} registros`}
                  emoji="💳"
                >
                  <View style={{ gap: 10 }}>
                    {agingList.slice(0, 50).map((inv, idx) => {
                      const customer = String(inv.customer_name ?? inv.entity_name ?? 'Sin cliente');
                      const ncf = String(inv.invoice_ncf ?? inv.invoice_number ?? '—');
                      const pending = n(inv.pending_amount ?? inv.total_amount);
                      const paid = n(inv.paid_amount);
                      const days = n(inv.days_overdue);
                      const bucket = String(inv.aging_bucket ?? '');
                      const emission = inv.emission_date ? String(inv.emission_date).slice(0, 10) : '';
                      return (
                        <View
                          key={`ar-${idx}`}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                            paddingVertical: 4,
                            paddingBottom: 10,
                            borderBottomWidth: idx < Math.min(49, agingList.length - 1) ? 0.5 : 0,
                            borderBottomColor: palette.dark.border,
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{ color: palette.dark.text, fontSize: 13, fontWeight: '600' }}
                              numberOfLines={1}
                            >
                              {customer}
                            </Text>
                            <Text
                              style={{ color: palette.dark.textMuted, fontSize: 11 }}
                              numberOfLines={1}
                            >
                              {ncf}
                              {emission ? ` · ${emission}` : ''}
                              {days > 0 ? ` · ${days}d` : ''}
                              {bucket ? ` · ${bucket}` : ''}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text
                              style={{
                                color: days > 30 ? palette.dark.danger : palette.dark.warning,
                                fontSize: 13,
                                fontWeight: '700',
                              }}
                            >
                              {fmtCurrency(pending)}
                            </Text>
                            {paid > 0 ? (
                              <Text style={{ color: palette.dark.textMuted, fontSize: 10 }}>
                                pagó {fmtCurrency(paid)}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </SectionCard>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
