import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { KpiCard } from '@components/dashboard/KpiCard';
import { Card, LoadingState, InlineFetchingBar, SearchButton, IconSunrise, HourRangeSheet, fmtTime12 } from '@components/ui';
import { palette, shadow } from '@theme/colors';
import { fmtCurrency, fmtInt, fmtPct, buName } from '@utils/format';
import { useTodaySnapshot } from '@hooks/useTodaySnapshot';
import { useBusinessStore } from '@store/useBusinessStore';

const formatHour = (d: Date): string =>
  d.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', hour12: true });

const greeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

const totalAmount = (
  amounts: Array<{ amount_opened: number; amount_closed: number | null; is_closed: boolean }> | null,
  key: 'amount_opened' | 'amount_closed',
): number => {
  if (!amounts?.length) return 0;
  return amounts.reduce((s, a) => s + Number(a[key] ?? 0), 0);
};

export default function TodayScreen() {
  const router = useRouter();
  const bu = useBusinessStore((s) => s.activeBusinessUnit);

  // Franja horaria opcional del día (null = día completo).
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [hourSheetOpen, setHourSheetOpen] = useState(false);

  // Tab Hoy SIEMPRE en modo "today" — vista exclusiva del día actual
  const {
    summary,
    boxes,
    deltaPct,
    prevSales,
    isLoading,
    isFetching,
    isRefetching,
    refetch,
    locationName,
  } = useTodaySnapshot('today', { startTime, endTime });

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const openBoxes = boxes.filter((b) => b.is_open);
  const closedBoxes = boxes.filter((b) => !b.is_open);
  const sales = summary?.total_sales ?? 0;
  const hasNoSales = !isLoading && sales === 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.dark.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: palette.dark.textDim, fontSize: 13, fontWeight: '500' }}>
                {greeting()}
              </Text>
              <Text
                style={{
                  color: palette.dark.text,
                  fontSize: 30,
                  fontWeight: '700',
                  marginTop: 2,
                  letterSpacing: -0.8,
                }}
              >
                Hoy
              </Text>
            </View>
            <SearchButton />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: palette.dark.primary }} />
            <Text style={{ color: palette.dark.textMuted, fontSize: 11, fontWeight: '600' }} numberOfLines={1}>
              {buName(bu)}
              {locationName ? ` · ${locationName}` : ''} · Actualizado {formatHour(now)}
            </Text>
          </View>

          {/* Selector de franja horaria del día */}
          <Pressable
            onPress={() => setHourSheetOpen(true)}
            style={({ pressed }) => ({
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              marginTop: 12,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 999,
              borderWidth: 1,
              backgroundColor: startTime ? palette.dark.text : palette.dark.surface,
              borderColor: startTime ? palette.dark.text : palette.dark.border,
              opacity: pressed ? 0.85 : 1,
              ...shadow.sm,
            })}
          >
            <Text style={{ fontSize: 13 }}>🕐</Text>
            <Text
              style={{
                color: startTime ? '#FFFFFF' : palette.dark.text,
                fontSize: 12,
                fontWeight: '700',
              }}
            >
              {startTime && endTime ? `${fmtTime12(startTime)} – ${fmtTime12(endTime)}` : 'Todo el día'}
            </Text>
          </Pressable>
        </View>

        <InlineFetchingBar visible={isFetching && !isLoading} label="Actualizando…" />

        {isLoading ? (
          <View style={{ paddingHorizontal: 16 }}>
            <LoadingState label="Cargando hoy…" hint="Trayendo ventas y cajas en vivo." />
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, gap: 14 }}>
            {/* Hero */}
            <Animated.View entering={FadeInDown.duration(450).springify().damping(16)}>
            <LinearGradient
              colors={['#0A0A0B', '#1F1F23']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 24, padding: 24, ...shadow.lg }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    color: 'rgba(255,255,255,0.72)',
                    fontSize: 11,
                    fontWeight: '700',
                    letterSpacing: 1.4,
                  }}
                >
                  VENTAS DEL DÍA
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: 'rgba(255,255,255,0.14)',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 999,
                  }}
                >
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#34D399' }} />
                  <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '700' }}>EN VIVO</Text>
                </View>
              </View>
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: 38,
                  fontWeight: '800',
                  letterSpacing: -1.2,
                }}
                adjustsFontSizeToFit
                numberOfLines={1}
              >
                {fmtCurrency(sales)}
              </Text>

              {prevSales > 0 || sales > 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <View
                    style={{
                      backgroundColor:
                        deltaPct >= 0 ? 'rgba(52,211,153,0.18)' : 'rgba(252,165,165,0.18)',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 999,
                    }}
                  >
                    <Text
                      style={{
                        color: deltaPct >= 0 ? '#34D399' : '#FCA5A5',
                        fontSize: 11,
                        fontWeight: '800',
                      }}
                    >
                      {deltaPct >= 0 ? '↑' : '↓'} {fmtPct(Math.abs(deltaPct), 1)}
                    </Text>
                  </View>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11 }}>
                    vs ayer ({fmtCurrency(prevSales)})
                  </Text>
                </View>
              ) : null}

              <View style={{ flexDirection: 'row', gap: 16, marginTop: 14 }}>
                <HeroMini label="FACTURAS" value={fmtInt(summary?.num_facturas ?? 0)} />
                <HeroMini label="TICKET PROM." value={fmtCurrency(summary?.avg_ticket ?? 0)} />
                <HeroMini label="UTILIDAD" value={fmtCurrency(summary?.total_profit ?? 0)} />
              </View>
            </LinearGradient>
            </Animated.View>

            {/* Empty state cuando no hay ventas hoy */}
            {hasNoSales ? (
              <Card variant="default">
                <View style={{ alignItems: 'center', marginBottom: 10 }}>
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 18,
                      backgroundColor: palette.dark.primaryDim,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconSunrise color={palette.dark.primary} size={28} />
                  </View>
                </View>
                <Text
                  style={{
                    color: palette.dark.text,
                    fontSize: 15,
                    fontWeight: '700',
                    textAlign: 'center',
                  }}
                >
                  Sin actividad aún
                </Text>
                <Text
                  style={{
                    color: palette.dark.textDim,
                    fontSize: 12,
                    textAlign: 'center',
                    marginTop: 6,
                    lineHeight: 17,
                  }}
                >
                  No se han registrado facturas hoy. La información aparecerá automáticamente cuando comience la operación.
                </Text>
              </Card>
            ) : null}

            {/* KPIs secundarios */}
            {!hasNoSales ? (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <KpiCard
                  label="Utilidad Bruta"
                  value={fmtCurrency(summary?.total_profit ?? 0)}
                  icon={<IconTrend color={palette.dark.primary} size={17} />}
                  hint={
                    summary?.total_sales
                      ? `${fmtPct(((summary.total_profit ?? 0) / summary.total_sales) * 100)} margen`
                      : '—'
                  }
                />
                <KpiCard
                  label="Costo"
                  value={fmtCurrency(summary?.total_cost ?? 0)}
                  icon={<IconBox color={palette.dark.primary} size={17} />}
                  hint={
                    summary?.total_sales
                      ? `${fmtPct(((summary.total_cost ?? 0) / summary.total_sales) * 100)} de ventas`
                      : '—'
                  }
                />
              </View>
            ) : null}

            {/* Cajas del día */}
            {boxes.length > 0 ? (
              <Card variant="default">
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12,
                  }}
                >
                  <View>
                    <Text
                      style={{
                        color: palette.dark.text,
                        fontSize: 15,
                        fontWeight: '700',
                        letterSpacing: -0.3,
                      }}
                    >
                      Cajas de hoy
                    </Text>
                    <Text style={{ color: palette.dark.textMuted, fontSize: 11 }}>
                      {fmtInt(openBoxes.length)} abiertas · {fmtInt(closedBoxes.length)} cerradas
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => router.push('/(tabs)/reports/boxes')}
                    style={({ pressed }) => ({
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8,
                      backgroundColor: pressed ? palette.dark.soft : 'transparent',
                    })}
                  >
                    <Text style={{ color: palette.dark.primary, fontSize: 12, fontWeight: '700' }}>
                      Ver todas →
                    </Text>
                  </Pressable>
                </View>
                <View style={{ gap: 8 }}>
                  {boxes.slice(0, 4).map((b) => {
                    const opened = totalAmount(b.amounts, 'amount_opened');
                    const closed = totalAmount(b.amounts, 'amount_closed');
                    return (
                      <Pressable
                        key={b.box_entry_id}
                        onPress={() => router.push(`/(tabs)/reports/boxes/${b.box_entry_id}`)}
                        style={({ pressed }) => ({
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 10,
                          paddingVertical: 6,
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: b.is_open ? palette.dark.warning : palette.dark.success,
                          }}
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{ color: palette.dark.text, fontSize: 13, fontWeight: '600' }}
                            numberOfLines={1}
                          >
                            {b.box_name} — {b.use_fullname}
                          </Text>
                          <Text style={{ color: palette.dark.textMuted, fontSize: 10 }}>
                            {b.is_open ? 'ABIERTA' : 'CERRADA'} · {b.shift_code ?? '—'}
                          </Text>
                        </View>
                        <Text style={{ color: palette.dark.text, fontSize: 13, fontWeight: '700' }}>
                          {fmtCurrency(b.is_open ? opened : closed)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Card>
            ) : null}

            {/* Quick actions */}
            <Animated.View
              entering={FadeInDown.delay(120).duration(450)}
              style={{ flexDirection: 'row', gap: 10 }}
            >
              <QuickAction icon={<IconGrid color={palette.dark.primary} />} label="Dashboard" onPress={() => router.push('/(tabs)/dashboard')} />
              <QuickAction icon={<IconTrend color={palette.dark.primary} />} label="Reportes" onPress={() => router.push('/(tabs)/reports')} />
              <QuickAction icon={<IconBox color={palette.dark.primary} />} label="Operación" onPress={() => router.push('/(tabs)/operations')} />
            </Animated.View>
          </View>
        )}
      </ScrollView>

      <HourRangeSheet
        visible={hourSheetOpen}
        startTime={startTime}
        endTime={endTime}
        onClose={() => setHourSheetOpen(false)}
        onApply={(s, e) => {
          setStartTime(s);
          setEndTime(e);
          setHourSheetOpen(false);
        }}
      />
    </SafeAreaView>
  );
}

const HeroMini: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={{ flex: 1 }}>
    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>
      {label}
    </Text>
    <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginTop: 2 }} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

const QuickAction: React.FC<{ icon: React.ReactNode; label: string; onPress: () => void }> = ({
  icon,
  label,
  onPress,
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => ({
      flex: 1,
      backgroundColor: palette.dark.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: palette.dark.border,
      paddingVertical: 16,
      alignItems: 'center',
      gap: 8,
      opacity: pressed ? 0.7 : 1,
      ...shadow.sm,
    })}
  >
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
      {icon}
    </View>
    <Text style={{ color: palette.dark.text, fontSize: 12, fontWeight: '700' }}>{label}</Text>
  </Pressable>
);

type IconProps = { color: string; size?: number };

const IconGrid = ({ color, size = 20 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const IconTrend = ({ color, size = 20 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="m3 17 6-6 4 4 8-8M21 7v6m0-6h-6"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const IconBox = ({ color, size = 20 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 8 12 3 3 8m18 0-9 5m9-5v8l-9 5m0-8L3 8m9 5v8M3 8v8l9 5"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
