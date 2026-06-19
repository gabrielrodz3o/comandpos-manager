import React, { useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
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

// Dimensiones de la cuadrícula desplazable.
const CELL = 38;
const COL_GAP = 3;
const ROW_GAP = 4;
const HEADER_H = 18;
const LABEL_W = 26;

const cellColor = (intensity: number): string => {
  if (intensity <= 0) return palette.dark.soft;
  const alpha = 0.12 + intensity * 0.85;
  return `rgba(16, 185, 129, ${alpha.toFixed(2)})`;
};

const cellTextColor = (intensity: number): string =>
  intensity > 0.55 ? '#FFFFFF' : palette.dark.textDim;

const fmtHour = (h: number): string => {
  if (h === 0) return '12a';
  if (h === 12) return '12p';
  return h < 12 ? `${h}a` : `${h - 12}p`;
};

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
      {/* Pista de scroll */}
      <Text style={{ color: palette.dark.textMuted, fontSize: 10, fontWeight: '600', textAlign: 'right', marginBottom: 8 }}>
        Desliza para ver todas las horas →
      </Text>

      <View style={{ flexDirection: 'row' }}>
        {/* Columna fija de días */}
        <View>
          <View style={{ height: HEADER_H, marginBottom: 6 }} />
          {DAY_LABELS.map((d) => (
            <View
              key={`lbl-${d}`}
              style={{ width: LABEL_W, height: CELL, marginBottom: ROW_GAP, justifyContent: 'center' }}
            >
              <Text style={{ color: palette.dark.textDim, fontSize: 11, fontWeight: '700', textAlign: 'center' }}>
                {d}
              </Text>
            </View>
          ))}
        </View>

        {/* Cuadrícula desplazable de horas */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 4 }}
        >
          <View>
            {/* Header con horas */}
            <View style={{ flexDirection: 'row', height: HEADER_H, marginBottom: 6 }}>
              {HOURS.map((h) => (
                <Text
                  key={`h-${h}`}
                  style={{
                    width: CELL,
                    marginHorizontal: COL_GAP,
                    color: palette.dark.textMuted,
                    fontSize: 9,
                    fontWeight: '600',
                    textAlign: 'center',
                  }}
                >
                  {fmtHour(h)}
                </Text>
              ))}
            </View>

            {/* Filas por día */}
            {DAY_LABELS.map((d, visualDay) => (
              <View key={`row-${d}`} style={{ flexDirection: 'row', height: CELL, marginBottom: ROW_GAP }}>
                {HOURS.map((h) => {
                  const v = matrix[`${visualDay}-${h}`] ?? 0;
                  const intensity = max > 0 ? v / max : 0;
                  return (
                    <View
                      key={`c-${d}-${h}`}
                      style={{
                        width: CELL,
                        height: CELL,
                        marginHorizontal: COL_GAP,
                        backgroundColor: cellColor(intensity),
                        borderRadius: 6,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {v > 0 ? (
                        <Text style={{ color: cellTextColor(intensity), fontSize: 10, fontWeight: '700' }}>
                          {fmtCompact(v)}
                        </Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Leyenda */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
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
