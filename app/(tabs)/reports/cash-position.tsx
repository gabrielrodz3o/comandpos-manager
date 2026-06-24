import React, { useMemo } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card, LoadingState, InlineFetchingBar } from '@components/ui';
import { ActiveLocationBanner } from '@components/reports/ActiveLocationBanner';
import { LocationSelector } from '@components/dashboard/LocationSelector';
import { palette } from '@theme/colors';
import { fmtCurrency, fmtInt } from '@utils/format';
import { useCashPosition } from '@hooks/useAdmin';
import type { CashBox, TreasuryAccount, BankAccount } from '@/types/admin';

const money = (n: unknown, cur = 'DOP') => fmtCurrency(n, cur, 2);

interface CurrencyBucket {
  currency: string;
  cash: number;
  treasury: number;
  banks: number;
  total: number;
}

export default function CashPositionScreen() {
  const router = useRouter();
  const { data, isLoading, isFetching, isRefetching, refetch, error, eff } = useCashPosition();

  const boxes = data?.position.boxes ?? [];
  const treasury = data?.treasury ?? [];
  const banks = data?.banks ?? [];

  const buckets = useMemo<CurrencyBucket[]>(() => {
    const map = new Map<string, CurrencyBucket>();
    const get = (cur: string) => {
      const c = cur || 'DOP';
      if (!map.has(c)) map.set(c, { currency: c, cash: 0, treasury: 0, banks: 0, total: 0 });
      return map.get(c)!;
    };
    (data?.position.by_currency ?? []).forEach((c) => {
      const b = get(c.currency_code);
      b.cash += Number(c.total) || 0;
    });
    treasury.forEach((t) => {
      const b = get(t.currency_code);
      b.treasury += Number(t.current_balance) || 0;
    });
    banks.forEach((bk) => {
      const b = get(bk.currency_code);
      b.banks += Number(bk.balance) || 0;
    });
    map.forEach((b) => {
      b.total = b.cash + b.treasury + b.banks;
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [data, treasury, banks]);

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
              Posición de Efectivo
            </Text>
            <Text style={{ color: palette.dark.textDim, fontSize: 12, fontWeight: '500' }}>
              {fmtInt(data?.position.open_count ?? 0)} cajas abiertas
            </Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <LocationSelector />
        </View>

        <InlineFetchingBar visible={isFetching && !isLoading} />

        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          <ActiveLocationBanner eff={eff} />

          {eff.needsExplicitSelection ? null : isLoading ? (
            <LoadingState label="Cargando efectivo…" hint="Cajas, tesorería y bancos." variant="centered" />
          ) : error ? (
            <Card>
              <Text style={{ color: palette.dark.danger, fontSize: 14, fontWeight: '700' }}>Error</Text>
              <Text style={{ color: palette.dark.textDim, fontSize: 12, marginTop: 4 }}>
                {(error as Error)?.message ?? 'No se pudo cargar.'}
              </Text>
            </Card>
          ) : (
            <>
              {/* Total consolidado por moneda */}
              {buckets.map((b) => (
                <Card key={b.currency} variant="default">
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 12,
                    }}
                  >
                    <View>
                      <Text style={{ color: palette.dark.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>
                        EFECTIVO TOTAL · {b.currency}
                      </Text>
                      <Text style={{ color: palette.dark.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.8, marginTop: 2 }}>
                        {money(b.total, b.currency)}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 30 }}>🏦</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Breakdown label="Cajas" value={money(b.cash, b.currency)} />
                    <Breakdown label="Bóveda/Principal" value={money(b.treasury, b.currency)} />
                    <Breakdown label="Bancos" value={money(b.banks, b.currency)} />
                  </View>
                </Card>
              ))}

              {buckets.length === 0 ? (
                <Card>
                  <Text style={{ color: palette.dark.textMuted, fontSize: 12, textAlign: 'center' }}>
                    Sin efectivo registrado.
                  </Text>
                </Card>
              ) : null}

              {/* Cajas abiertas */}
              {boxes.length > 0 ? (
                <Section title={`Cajas abiertas (${boxes.length})`} emoji="🧾">
                  {boxes.map((bx, i) => (
                    <BoxRow key={`bx-${bx.entry_id}-${i}`} box={bx} isFirst={i === 0} />
                  ))}
                </Section>
              ) : null}

              {/* Tesorería */}
              {treasury.length > 0 ? (
                <Section title="Bóveda / Caja Principal" emoji="🔐">
                  {treasury.map((t, i) => (
                    <TreasuryRow key={`tr-${t.id}`} acc={t} isFirst={i === 0} />
                  ))}
                </Section>
              ) : null}

              {/* Bancos */}
              {banks.length > 0 ? (
                <Section title="Cuentas bancarias" emoji="🏛️">
                  {banks.map((bk, i) => (
                    <BankRow key={`bk-${bk.account_id}`} acc={bk} isFirst={i === 0} />
                  ))}
                </Section>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const Breakdown: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={{ flex: 1, backgroundColor: palette.dark.soft, borderRadius: 10, padding: 10 }}>
    <Text style={{ color: palette.dark.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.3 }} numberOfLines={1}>
      {label.toUpperCase()}
    </Text>
    <Text style={{ color: palette.dark.text, fontSize: 13, fontWeight: '800', marginTop: 3 }} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

const Section: React.FC<{ title: string; emoji: string; children: React.ReactNode }> = ({
  title,
  emoji,
  children,
}) => (
  <Card variant="default" padded={false}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, paddingBottom: 8 }}>
      <Text style={{ fontSize: 15 }}>{emoji}</Text>
      <Text style={{ color: palette.dark.text, fontSize: 14, fontWeight: '700' }}>{title}</Text>
    </View>
    {children}
  </Card>
);

const RowShell: React.FC<{ isFirst: boolean; children: React.ReactNode }> = ({ isFirst, children }) => (
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
    {children}
  </View>
);

const BoxRow: React.FC<{ box: CashBox; isFirst: boolean }> = ({ box, isFirst }) => (
  <RowShell isFirst={isFirst}>
    <View style={{ flex: 1, marginRight: 10 }}>
      <Text style={{ color: palette.dark.text, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
        {box.box_name}
      </Text>
      <Text style={{ color: palette.dark.textMuted, fontSize: 11 }} numberOfLines={1}>
        {box.location_name ?? ''}
        {box.shift_code ? ` · ${box.shift_code}` : ''}
      </Text>
    </View>
    <Text style={{ color: palette.dark.text, fontSize: 14, fontWeight: '800' }}>
      {money(box.current_balance, box.currency_code)}
    </Text>
  </RowShell>
);

const TreasuryRow: React.FC<{ acc: TreasuryAccount; isFirst: boolean }> = ({ acc, isFirst }) => (
  <RowShell isFirst={isFirst}>
    <View style={{ flex: 1, marginRight: 10 }}>
      <Text style={{ color: palette.dark.text, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
        {acc.name}
      </Text>
      <Text style={{ color: palette.dark.textMuted, fontSize: 11 }} numberOfLines={1}>
        {acc.type}
        {acc.location_name ? ` · ${acc.location_name}` : ''}
      </Text>
    </View>
    <Text style={{ color: palette.dark.text, fontSize: 14, fontWeight: '800' }}>
      {money(acc.current_balance, acc.currency_code)}
    </Text>
  </RowShell>
);

const BankRow: React.FC<{ acc: BankAccount; isFirst: boolean }> = ({ acc, isFirst }) => (
  <RowShell isFirst={isFirst}>
    <View style={{ flex: 1, marginRight: 10 }}>
      <Text style={{ color: palette.dark.text, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
        {acc.account_name}
      </Text>
      <Text style={{ color: palette.dark.textMuted, fontSize: 11 }} numberOfLines={1}>
        {acc.bank_name ?? ''}
      </Text>
    </View>
    <Text style={{ color: palette.dark.text, fontSize: 14, fontWeight: '800' }}>
      {money(acc.balance, acc.currency_code)}
    </Text>
  </RowShell>
);
