import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { palette } from '@theme/colors';
import { fmtCompact, fmtCurrency } from '@utils/format';

interface HeatmapCellRaw {
  // Formato real del backend
  day_of_week?: number;
  hour_of_day?: number;
  total?: number;
  invoice_count?: number;
  // Compatibilidad — formato antiguo
  hour?: number;
  day?: number;
  value?: number;
}

interface Props {
  data?: HeatmapCellRaw[];
}

// Backend usa dow: 0=domingo, 1=lunes ... 6=sábado
// Visual: L M X J V S D
const DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DAY_BACKEND_TO_VISUAL: Record<number, number> = {
  1: 0, // Lun
  2: 1, // Mar
  3: 2, // Mié
  4: 3, // Jue
  5: 4, // Vie
  6: 5, // Sáb
  0: 6, // Dom
};

const HOURS = Array.from({ length: 16 }, (_, i) => i + 8); // 8am - 11pm

const cellColor = (intensity: number): string => {
  if (intensity <= 0) return palette.dark.soft;
  const alpha = 0.12 + intensity * 0.85;
  return `rgba(16, 185, 129, ${alpha.toFixed(2)})`;
};

const cellTextColor = (intensity: number): string =>
  intensity > 0.55 ? '#FFFFFF' : palette.dark.textDim;

export const HeatmapGrid: React.FC<Props> = ({ data }) => {
  const { matrix, max } = useMemo(() => {
    const m: Record<string, number> = {};
    let mx = 0;
    (data ?? []).forEach((c) => {
      // Aceptar ambos formatos
      const rawDay = c.day_of_week ?? c.day;
      const rawHour = c.hour_of_day ?? c.hour;
      const rawVal = Number(c.total ?? c.value ?? 0);
      if (rawDay == null || rawHour == null) return;

      const visualDay = DAY_BACKEND_TO_VISUAL[rawDay] ?? rawDay;
      const k = `${visualDay}-${rawHour}`;
      m[k] = (m[k] ?? 0) + rawVal;
      if (m[k] > mx) mx = m[k];
    });
    return { matrix: m, max: mx };
  }, [data]);

  if (!data?.length || max === 0) {
    return (
      <Text
        style={{
          color: palette.dark.textMuted,
          fontSize: 12,
          fontStyle: 'italic',
          textAlign: 'center',
          paddingVertical: 14,
        }}
      >
        Sin datos de horario en este período.
      </Text>
    );
  }

  return (
    <View>
      {/* Header con horas */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <View style={{ width: 22 }} />
        {HOURS.map((h) => (
          <Text
            key={`h-${h}`}
            style={{
              flex: 1,
              color: palette.dark.textMuted,
              fontSize: 8,
              fontWeight: '600',
              textAlign: 'center',
            }}
          >
            {h}
          </Text>
        ))}
      </View>

      {/* Rows por día (visual 0=L .. 6=D) */}
      {DAY_LABELS.map((d, visualDay) => (
        <View key={`d-${d}`} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
          <Text
            style={{
              width: 22,
              color: palette.dark.textDim,
              fontSize: 10,
              fontWeight: '700',
              textAlign: 'center',
            }}
          >
            {d}
          </Text>
          {HOURS.map((h) => {
            const v = matrix[`${visualDay}-${h}`] ?? 0;
            const intensity = max > 0 ? v / max : 0;
            return (
              <View
                key={`c-${d}-${h}`}
                style={{
                  flex: 1,
                  aspectRatio: 1,
                  backgroundColor: cellColor(intensity),
                  borderRadius: 3,
                  marginHorizontal: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {intensity > 0.35 ? (
                  <Text style={{ color: cellTextColor(intensity), fontSize: 7, fontWeight: '700' }}>
                    {fmtCompact(v)}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      ))}

      {/* Leyenda */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
        <Text style={{ color: palette.dark.textMuted, fontSize: 10 }}>menos</Text>
        {[0.15, 0.35, 0.55, 0.75, 0.95].map((i) => (
          <View
            key={`leg-${i}`}
            style={{
              width: 14,
              height: 14,
              borderRadius: 3,
              backgroundColor: cellColor(i),
            }}
          />
        ))}
        <Text style={{ color: palette.dark.textMuted, fontSize: 10 }}>más</Text>
        <Text style={{ color: palette.dark.textMuted, fontSize: 10, marginLeft: 8 }}>
          pico: {fmtCurrency(max)}
        </Text>
      </View>
    </View>
  );
};
