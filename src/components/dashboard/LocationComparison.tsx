import React, { useMemo } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { palette, chartPalette } from '@theme/colors';
import { fmtCurrency, fmtPct, locName } from '@utils/format';
import { useLocationComparison } from '@hooks/useLocationComparison';

const n = (v: unknown) => Number(v ?? 0);

export const LocationComparison: React.FC = () => {
  const rows = useLocationComparison();

  const data = useMemo(() => {
    const enriched = rows.map((r) => ({
      ...r,
      ventas: n(r.data?.summary?.ventas_total),
      utilidad: n(r.data?.summary?.utilidad_neta),
      margenPct: n(r.data?.summary?.margen_neto_pct),
    }));
    enriched.sort((a, b) => b.ventas - a.ventas);
    return enriched;
  }, [rows]);

  if (data.length < 2) return null;

  const maxVentas = data[0]?.ventas ?? 0;
  const totalVentas = data.reduce((s, r) => s + r.ventas, 0);
  const totalUtilidad = data.reduce((s, r) => s + r.utilidad, 0);
  const isAnyLoading = data.some((r) => r.isLoading);

  return (
    <View>
      {/* Totales */}
      <View
        style={{
          flexDirection: 'row',
          gap: 10,
          backgroundColor: palette.dark.soft,
          padding: 12,
          borderRadius: 10,
          marginBottom: 14,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: palette.dark.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>
            VENTAS TOTALES
          </Text>
          <Text style={{ color: palette.dark.text, fontSize: 15, fontWeight: '800', marginTop: 2, letterSpacing: -0.3 }}>
            {fmtCurrency(totalVentas)}
          </Text>
        </View>
        <View style={{ width: 1, backgroundColor: palette.dark.border }} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: palette.dark.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 }}>
            UTILIDAD TOTAL
          </Text>
          <Text
            style={{
              color: totalUtilidad >= 0 ? palette.dark.success : palette.dark.danger,
              fontSize: 15,
              fontWeight: '800',
              marginTop: 2,
              letterSpacing: -0.3,
            }}
          >
            {fmtCurrency(totalUtilidad)}
          </Text>
        </View>
        {isAnyLoading ? (
          <ActivityIndicator size="small" color={palette.dark.primary} />
        ) : null}
      </View>

      {/* Filas por sucursal */}
      <View style={{ gap: 14 }}>
        {data.map((r, idx) => {
          const pct = maxVentas > 0 ? (r.ventas / maxVentas) * 100 : 0;
          const concentration = totalVentas > 0 ? (r.ventas / totalVentas) * 100 : 0;
          return (
            <View key={`lc-${r.location.id}`} style={{ gap: 6 }}>
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
                      width: 24,
                      height: 24,
                      borderRadius: 7,
                      backgroundColor: idx === 0 ? palette.dark.primaryDim : palette.dark.soft,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: palette.dark.text, fontSize: 11, fontWeight: '800' }}>
                      {idx === 0 ? '🥇' : `#${idx + 1}`}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ color: palette.dark.text, fontSize: 13, fontWeight: '600', letterSpacing: -0.2 }}
                      numberOfLines={1}
                    >
                      {locName(r.location)}
                    </Text>
                    <Text style={{ color: palette.dark.textMuted, fontSize: 10 }}>
                      {r.location.code ?? '—'} · {fmtPct(concentration, 0)} del total
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: palette.dark.text, fontSize: 13, fontWeight: '700' }}>
                    {r.isLoading ? '...' : fmtCurrency(r.ventas)}
                  </Text>
                  <Text
                    style={{
                      color: r.utilidad >= 0 ? palette.dark.success : palette.dark.danger,
                      fontSize: 10,
                      fontWeight: '700',
                    }}
                  >
                    {r.isLoading ? '' : `util. ${fmtCurrency(r.utilidad)}`}
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
              <Text style={{ color: palette.dark.textMuted, fontSize: 10 }}>
                margen {fmtPct(r.margenPct)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};
