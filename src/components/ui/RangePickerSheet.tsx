import React, { useMemo, useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  addMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isAfter,
  isBefore,
  isWithinInterval,
  parseISO,
  format,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { palette } from '@theme/colors';
import { isoDate } from '@utils/dates';

export interface RangeSelection {
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  startTime: string | null; // HH:mm (24h) — null = inicio del día
  endTime: string | null; // HH:mm (24h) — null = fin del día
}

interface Props {
  visible: boolean;
  initial: RangeSelection;
  onClose: () => void;
  onApply: (sel: RangeSelection) => void;
}

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MINUTES = [0, 15, 30, 45];

/** '14:30' → { h12: 2, m: 30, ampm: 'PM' } */
const split12 = (hhmm: string): { h12: number; m: number; ampm: 'AM' | 'PM' } => {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return { h12, m, ampm };
};

/** (2, 30, 'PM') → '14:30' */
const join24 = (h12: number, m: number, ampm: 'AM' | 'PM'): string => {
  let h = h12 % 12;
  if (ampm === 'PM') h += 12;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/** '14:30' → '2:30 PM' */
export const fmtTime12 = (hhmm: string): string => {
  const { h12, m, ampm } = split12(hhmm);
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

const TimeField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
}> = ({ label, value, onChange }) => {
  const { h12, m, ampm } = split12(value);
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: palette.dark.textDim, fontSize: 12, fontWeight: '700' }}>{label}</Text>
      {/* Horas 1–12 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => {
          const active = h === h12;
          return (
            <Pressable
              key={`h-${h}`}
              onPress={() => {
                Haptics.selectionAsync();
                onChange(join24(h, m, ampm));
              }}
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: active ? palette.dark.text : palette.dark.soft,
              }}
            >
              <Text style={{ color: active ? '#FFF' : palette.dark.text, fontSize: 14, fontWeight: '700' }}>
                {h}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {/* Minutos */}
        {MINUTES.map((min) => {
          const active = min === m;
          return (
            <Pressable
              key={`m-${min}`}
              onPress={() => {
                Haptics.selectionAsync();
                onChange(join24(h12, min, ampm));
              }}
              style={{
                paddingHorizontal: 12,
                height: 34,
                borderRadius: 9,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: active ? palette.dark.primaryDim : palette.dark.soft,
              }}
            >
              <Text
                style={{
                  color: active ? palette.dark.primary : palette.dark.textDim,
                  fontSize: 13,
                  fontWeight: '700',
                }}
              >
                :{String(min).padStart(2, '0')}
              </Text>
            </Pressable>
          );
        })}
        {/* AM / PM */}
        <View style={{ flexDirection: 'row', marginLeft: 'auto', borderRadius: 9, overflow: 'hidden', backgroundColor: palette.dark.soft }}>
          {(['AM', 'PM'] as const).map((p) => {
            const active = p === ampm;
            return (
              <Pressable
                key={p}
                onPress={() => {
                  Haptics.selectionAsync();
                  onChange(join24(h12, m, p));
                }}
                style={{
                  paddingHorizontal: 14,
                  height: 34,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: active ? palette.dark.text : 'transparent',
                }}
              >
                <Text style={{ color: active ? '#FFF' : palette.dark.textDim, fontSize: 13, fontWeight: '800' }}>
                  {p}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

interface HourRangeProps {
  visible: boolean;
  startTime: string | null;
  endTime: string | null;
  onClose: () => void;
  onApply: (startTime: string | null, endTime: string | null) => void;
}

/**
 * Selector SOLO de franja horaria (sin calendario). Para vistas con fecha fija
 * (ej. el tab "Hoy"): elegir desde qué hora hasta qué hora del día.
 */
export const HourRangeSheet: React.FC<HourRangeProps> = ({
  visible,
  startTime,
  endTime,
  onClose,
  onApply,
}) => {
  const [on, setOn] = useState<boolean>(!!startTime || !!endTime);
  const [start, setStart] = useState<string>(startTime ?? '08:00');
  const [end, setEnd] = useState<string>(endTime ?? '22:00');

  React.useEffect(() => {
    if (visible) {
      setOn(!!startTime || !!endTime);
      setStart(startTime ?? '08:00');
      setEnd(endTime ?? '22:00');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const apply = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onApply(on ? start : null, on ? end : null);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: palette.dark.overlay, justifyContent: 'flex-end' }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: palette.dark.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingTop: 14,
            paddingBottom: 28,
          }}
        >
          <View
            style={{
              width: 40,
              height: 5,
              borderRadius: 3,
              backgroundColor: palette.dark.borderHi,
              alignSelf: 'center',
              marginBottom: 14,
            }}
          />
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 10 }}>
            <Text style={{ color: palette.dark.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.4 }}>
              Rango de hora del día
            </Text>
            <Text style={{ color: palette.dark.textMuted, fontSize: 12, marginTop: 2, marginBottom: 4 }}>
              {on ? `${fmtTime12(start)} → ${fmtTime12(end)}` : 'Día completo'}
            </Text>

            {/* Toggle */}
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setOn((v) => !v);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 14,
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 12,
                backgroundColor: palette.dark.soft,
              }}
            >
              <Text style={{ color: palette.dark.text, fontSize: 14, fontWeight: '700' }}>Filtrar por hora</Text>
              <View
                style={{
                  width: 46,
                  height: 28,
                  borderRadius: 999,
                  padding: 3,
                  backgroundColor: on ? palette.dark.primary : palette.dark.borderHi,
                  alignItems: on ? 'flex-end' : 'flex-start',
                }}
              >
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFF' }} />
              </View>
            </Pressable>

            {on ? (
              <View style={{ gap: 16, marginTop: 16 }}>
                <TimeField label="Desde la hora" value={start} onChange={setStart} />
                <TimeField label="Hasta la hora" value={end} onChange={setEnd} />
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 22 }}>
              <Pressable
                onPress={onClose}
                style={{
                  flex: 1,
                  height: 50,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: palette.dark.soft,
                }}
              >
                <Text style={{ color: palette.dark.textDim, fontSize: 15, fontWeight: '700' }}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={apply}
                style={{
                  flex: 1.4,
                  height: 50,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: palette.dark.text,
                }}
              >
                <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800' }}>Aplicar</Text>
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export const RangePickerSheet: React.FC<Props> = ({ visible, initial, onClose, onApply }) => {
  const [selStart, setSelStart] = useState<string>(initial.start);
  const [selEnd, setSelEnd] = useState<string>(initial.end);
  const [viewMonth, setViewMonth] = useState<Date>(() => parseISO(initial.end || initial.start));
  const [timeOn, setTimeOn] = useState<boolean>(!!initial.startTime || !!initial.endTime);
  const [startTime, setStartTime] = useState<string>(initial.startTime ?? '08:00');
  const [endTime, setEndTime] = useState<string>(initial.endTime ?? '22:00');

  // Re-sincroniza cuando el modal se reabre con otros valores.
  React.useEffect(() => {
    if (visible) {
      setSelStart(initial.start);
      setSelEnd(initial.end);
      setViewMonth(parseISO(initial.end || initial.start));
      setTimeOn(!!initial.startTime || !!initial.endTime);
      setStartTime(initial.startTime ?? '08:00');
      setEndTime(initial.endTime ?? '22:00');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  /**
   * Filas explícitas de 7 días.
   *
   * BUG arreglado: la grilla usaba `flexWrap` con `width: '14.285714%'`. El
   * redondeo de píxeles de RN hace que 7 celdas sumen algo > 100% del ancho,
   * así que solo entraban 6 por fila: cada día caía bajo el día de semana
   * equivocado y los domingos desaparecían de su columna.
   */
  const weeks = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 1 });
    const gridEnd = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 1 });
    const all = eachDayOfInterval({ start: gridStart, end: gridEnd });
    const rows: Date[][] = [];
    for (let i = 0; i < all.length; i += 7) rows.push(all.slice(i, i + 7));
    return rows;
  }, [viewMonth]);

  const startD = selStart ? parseISO(selStart) : null;
  const endD = selEnd ? parseISO(selEnd) : null;

  const handleDay = (d: Date) => {
    Haptics.selectionAsync();
    const iso = isoDate(d);
    // Sin selección completa o ambos puestos → reinicia con nuevo inicio.
    if (!startD || (startD && endD)) {
      setSelStart(iso);
      setSelEnd('');
      return;
    }
    // Hay inicio, falta fin.
    if (isBefore(d, startD)) {
      setSelStart(iso);
      return;
    }
    setSelEnd(iso);
  };

  const canApply = !!selStart;

  const apply = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const start = selStart;
    const end = selEnd || selStart; // un solo día → mismo día
    onApply({
      start,
      end,
      startTime: timeOn ? startTime : null,
      endTime: timeOn ? endTime : null,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: palette.dark.overlay, justifyContent: 'flex-end' }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: palette.dark.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingTop: 14,
            paddingBottom: 28,
            maxHeight: '90%',
          }}
        >
          <View
            style={{
              width: 40,
              height: 5,
              borderRadius: 3,
              backgroundColor: palette.dark.borderHi,
              alignSelf: 'center',
              marginBottom: 14,
            }}
          />
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 10 }}>
            <Text style={{ color: palette.dark.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.4 }}>
              Rango personalizado
            </Text>
            <Text style={{ color: palette.dark.textMuted, fontSize: 12, marginTop: 2, marginBottom: 14 }}>
              {startD ? format(startD, "d 'de' MMM", { locale: es }) : '—'}
              {' → '}
              {endD ? format(endD, "d 'de' MMM", { locale: es }) : selStart ? 'elige fin' : '—'}
            </Text>

            {/* Navegación de mes */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <Pressable
                onPress={() => setViewMonth((m) => addMonths(m, -1))}
                style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.dark.soft }}
              >
                <Text style={{ color: palette.dark.text, fontSize: 18, fontWeight: '700' }}>‹</Text>
              </Pressable>
              <Text style={{ color: palette.dark.text, fontSize: 15, fontWeight: '700', textTransform: 'capitalize' }}>
                {format(viewMonth, 'MMMM yyyy', { locale: es })}
              </Text>
              <Pressable
                onPress={() => setViewMonth((m) => addMonths(m, 1))}
                style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.dark.soft }}
              >
                <Text style={{ color: palette.dark.text, fontSize: 18, fontWeight: '700' }}>›</Text>
              </Pressable>
            </View>

            {/* Cabecera de días */}
            <View style={{ flexDirection: 'row' }}>
              {WEEKDAYS.map((w, i) => (
                <View key={`wd-${i}`} style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
                  <Text style={{ color: palette.dark.textMuted, fontSize: 11, fontWeight: '700' }}>{w}</Text>
                </View>
              ))}
            </View>

            {/* Grilla */}
            <View>
              {weeks.map((week, wi) => (
                <View key={`wk-${wi}`} style={{ flexDirection: 'row' }}>
                  {week.map((d) => {
                    const inMonth = isSameMonth(d, viewMonth);
                    const isStart = startD && isSameDay(d, startD);
                    const isEnd = endD && isSameDay(d, endD);
                    const inRange =
                      startD && endD && isWithinInterval(d, { start: startD, end: endD });
                    const edge = isStart || isEnd;
                    const future = isAfter(d, new Date());
                    return (
                      <View key={d.toISOString()} style={{ flex: 1, alignItems: 'center', paddingVertical: 2 }}>
                        <Pressable
                          onPress={() => !future && handleDay(d)}
                          disabled={future}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: edge
                              ? palette.dark.text
                              : inRange
                                ? palette.dark.primaryDim
                                : 'transparent',
                          }}
                        >
                          <Text
                            style={{
                              color: edge
                                ? '#FFF'
                                : !inMonth || future
                                  ? palette.dark.textMuted
                                  : inRange
                                    ? palette.dark.primary
                                    : palette.dark.text,
                              fontSize: 14,
                              fontWeight: edge ? '800' : '600',
                              opacity: future ? 0.35 : 1,
                            }}
                          >
                            {format(d, 'd')}
                          </Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* Toggle de hora */}
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setTimeOn((v) => !v);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 18,
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 12,
                backgroundColor: palette.dark.soft,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: palette.dark.text, fontSize: 14, fontWeight: '700' }}>Filtrar por hora</Text>
                <Text style={{ color: palette.dark.textMuted, fontSize: 11, marginTop: 1 }}>
                  {timeOn ? `${fmtTime12(startTime)} → ${fmtTime12(endTime)}` : 'Día completo'}
                </Text>
              </View>
              <View
                style={{
                  width: 46,
                  height: 28,
                  borderRadius: 999,
                  padding: 3,
                  backgroundColor: timeOn ? palette.dark.primary : palette.dark.borderHi,
                  alignItems: timeOn ? 'flex-end' : 'flex-start',
                }}
              >
                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFF' }} />
              </View>
            </Pressable>

            {timeOn ? (
              <View style={{ gap: 16, marginTop: 16 }}>
                <TimeField label="Desde la hora" value={startTime} onChange={setStartTime} />
                <TimeField label="Hasta la hora" value={endTime} onChange={setEndTime} />
              </View>
            ) : null}

            {/* Acciones */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 22 }}>
              <Pressable
                onPress={onClose}
                style={{
                  flex: 1,
                  height: 50,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: palette.dark.soft,
                }}
              >
                <Text style={{ color: palette.dark.textDim, fontSize: 15, fontWeight: '700' }}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={apply}
                disabled={!canApply}
                style={{
                  flex: 1.4,
                  height: 50,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: canApply ? palette.dark.text : palette.dark.borderHi,
                  opacity: canApply ? 1 : 0.6,
                }}
              >
                <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800' }}>Aplicar</Text>
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
