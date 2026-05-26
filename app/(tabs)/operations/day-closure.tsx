import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Card, LoadingState } from '@components/ui';
import { palette, shadow } from '@theme/colors';
import { fmtCurrency, fmtInt } from '@utils/format';
import { useTodaySnapshot } from '@hooks/useTodaySnapshot';

type Step = 1 | 2 | 3 | 4;

interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
  checked: boolean;
}

export default function DayClosureScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: 'boxes', label: 'Todas las cajas cerradas', required: true, checked: false },
    { id: 'invoices', label: 'Facturación cuadrada', required: true, checked: false },
    { id: 'cash', label: 'Conteo de efectivo realizado', required: true, checked: false },
    { id: 'tips', label: 'Propinas repartidas', required: false, checked: false },
    { id: 'orders', label: 'Sin órdenes pendientes', required: false, checked: false },
    { id: 'cleaning', label: 'Local limpio y cerrado', required: false, checked: false },
  ]);

  const { summary, boxes, isLoading } = useTodaySnapshot();
  const openBoxes = boxes.filter((b) => b.is_open).length;
  const closedBoxes = boxes.filter((b) => !b.is_open).length;

  const requiredDone = checklist.filter((c) => c.required && c.checked).length;
  const requiredTotal = checklist.filter((c) => c.required).length;
  const canSubmit = requiredDone === requiredTotal;

  const toggle = (id: string) => {
    Haptics.selectionAsync();
    setChecklist((prev) =>
      prev.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c)),
    );
  };

  const handleSubmit = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setSubmitting(true);
    // TODO: backend endpoint para registrar el cierre del día
    setTimeout(() => {
      setSubmitting(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep(4);
    }, 1200);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.dark.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: step < 4 ? 140 : 60 }}>
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
            onPress={() => (step === 1 ? router.back() : setStep((s) => (s - 1) as Step))}
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
            <Text style={{ color: palette.dark.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>
              CIERRE DEL DÍA · PASO {step}/3
            </Text>
            <Text style={{ color: palette.dark.text, fontSize: 22, fontWeight: '700', letterSpacing: -0.6 }}>
              {step === 1
                ? 'Resumen del día'
                : step === 2
                ? 'Checklist'
                : step === 3
                ? 'Notas finales'
                : 'Listo'}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        {step < 4 ? (
          <View
            style={{
              flexDirection: 'row',
              paddingHorizontal: 16,
              gap: 6,
              marginBottom: 16,
            }}
          >
            {[1, 2, 3].map((s) => (
              <View
                key={s}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: s <= step ? palette.dark.primary : palette.dark.border,
                }}
              />
            ))}
          </View>
        ) : null}

        <View style={{ paddingHorizontal: 16, gap: 14 }}>
          {step === 1 ? (
            <>
              {isLoading ? (
                <LoadingState label="Cargando resumen del día…" />
              ) : (
                <>
                  <Card variant="default">
                    <Text
                      style={{
                        color: palette.dark.textMuted,
                        fontSize: 10,
                        fontWeight: '700',
                        letterSpacing: 1,
                      }}
                    >
                      VENTAS DEL DÍA
                    </Text>
                    <Text
                      style={{
                        color: palette.dark.text,
                        fontSize: 32,
                        fontWeight: '800',
                        marginTop: 4,
                        letterSpacing: -0.8,
                      }}
                    >
                      {fmtCurrency(summary?.total_sales ?? 0)}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 16, marginTop: 14 }}>
                      <Mini label="Facturas" value={fmtInt(summary?.num_facturas ?? 0)} />
                      <Mini label="Ticket prom." value={fmtCurrency(summary?.avg_ticket ?? 0)} />
                      <Mini label="Propinas" value={fmtCurrency(summary?.total_tips ?? 0)} />
                    </View>
                  </Card>

                  <Card variant="default">
                    <Text style={{ color: palette.dark.text, fontSize: 14, fontWeight: '700', marginBottom: 12 }}>
                      Estado de cajas
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <View
                        style={{
                          flex: 1,
                          backgroundColor: '#ECFDF5',
                          padding: 12,
                          borderRadius: 12,
                        }}
                      >
                        <Text style={{ color: '#065F46', fontSize: 10, fontWeight: '700' }}>
                          CERRADAS
                        </Text>
                        <Text style={{ color: '#065F46', fontSize: 22, fontWeight: '800', marginTop: 4 }}>
                          {fmtInt(closedBoxes)}
                        </Text>
                      </View>
                      <View
                        style={{
                          flex: 1,
                          backgroundColor: openBoxes > 0 ? '#FEF3C7' : palette.dark.soft,
                          padding: 12,
                          borderRadius: 12,
                        }}
                      >
                        <Text
                          style={{
                            color: openBoxes > 0 ? '#92400E' : palette.dark.textMuted,
                            fontSize: 10,
                            fontWeight: '700',
                          }}
                        >
                          ABIERTAS
                        </Text>
                        <Text
                          style={{
                            color: openBoxes > 0 ? '#92400E' : palette.dark.textMuted,
                            fontSize: 22,
                            fontWeight: '800',
                            marginTop: 4,
                          }}
                        >
                          {fmtInt(openBoxes)}
                        </Text>
                      </View>
                    </View>
                    {openBoxes > 0 ? (
                      <Text style={{ color: palette.dark.warning, fontSize: 11, marginTop: 10, fontWeight: '600' }}>
                        ⚠️ Hay {openBoxes} caja(s) sin cerrar. Ciérralas antes de continuar.
                      </Text>
                    ) : null}
                  </Card>
                </>
              )}
            </>
          ) : null}

          {step === 2 ? (
            <Card variant="default" padded={false}>
              <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 }}>
                <Text style={{ color: palette.dark.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
                  CHECKLIST · {requiredDone}/{requiredTotal} requeridos
                </Text>
              </View>
              {checklist.map((c, idx) => (
                <Pressable
                  key={c.id}
                  onPress={() => toggle(c.id)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    gap: 12,
                    borderTopWidth: 0.5,
                    borderTopColor: palette.dark.border,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      borderWidth: 2,
                      borderColor: c.checked ? palette.dark.primary : palette.dark.border,
                      backgroundColor: c.checked ? palette.dark.primary : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {c.checked ? (
                      <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>✓</Text>
                    ) : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: c.checked ? palette.dark.textMuted : palette.dark.text,
                        fontSize: 14,
                        fontWeight: '600',
                        textDecorationLine: c.checked ? 'line-through' : 'none',
                      }}
                    >
                      {c.label}
                    </Text>
                    {c.required ? (
                      <Text style={{ color: palette.dark.danger, fontSize: 10, fontWeight: '700', marginTop: 2 }}>
                        REQUERIDO
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </Card>
          ) : null}

          {step === 3 ? (
            <Card variant="default">
              <Text style={{ color: palette.dark.text, fontSize: 14, fontWeight: '700', marginBottom: 6 }}>
                Notas del día (opcional)
              </Text>
              <Text style={{ color: palette.dark.textDim, fontSize: 12, marginBottom: 14 }}>
                Eventos importantes, incidentes, observaciones para el equipo.
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Ej: Hubo un apagón a las 7pm, mantenimiento del freezer pendiente…"
                placeholderTextColor={palette.dark.textMuted}
                multiline
                style={{
                  borderWidth: 1,
                  borderColor: palette.dark.border,
                  borderRadius: 12,
                  padding: 14,
                  minHeight: 120,
                  textAlignVertical: 'top',
                  color: palette.dark.text,
                  fontSize: 14,
                  backgroundColor: palette.dark.bg,
                }}
              />
            </Card>
          ) : null}

          {step === 4 ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <View
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  backgroundColor: '#ECFDF5',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 24,
                }}
              >
                <Text style={{ fontSize: 50 }}>✅</Text>
              </View>
              <Text style={{ color: palette.dark.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.6 }}>
                ¡Día cerrado!
              </Text>
              <Text
                style={{
                  color: palette.dark.textDim,
                  fontSize: 14,
                  marginTop: 8,
                  textAlign: 'center',
                  maxWidth: 280,
                }}
              >
                Excelente trabajo. Tu cierre se registró correctamente.
              </Text>
              <Pressable
                onPress={() => router.replace('/(tabs)/today')}
                style={({ pressed }) => ({
                  marginTop: 32,
                  height: 50,
                  paddingHorizontal: 28,
                  borderRadius: 14,
                  backgroundColor: palette.dark.text,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.85 : 1,
                  ...shadow.md,
                })}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>
                  Volver al inicio
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Bottom action bar */}
      {step < 4 ? (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: palette.dark.surface,
            borderTopWidth: 1,
            borderTopColor: palette.dark.border,
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: 24,
            flexDirection: 'row',
            gap: 10,
            ...shadow.lg,
          }}
        >
          <Pressable
            onPress={() => {
              if (step === 3) handleSubmit();
              else setStep((s) => (s + 1) as Step);
            }}
            disabled={(step === 2 && !canSubmit) || submitting}
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: palette.dark.primary,
              height: 52,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              opacity:
                (step === 2 && !canSubmit) || submitting ? 0.4 : pressed ? 0.85 : 1,
              ...shadow.md,
            })}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>
                {step === 3 ? '✓ Cerrar día' : 'Continuar'}
              </Text>
            )}
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const Mini: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={{ flex: 1 }}>
    <Text style={{ color: palette.dark.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}>
      {label.toUpperCase()}
    </Text>
    <Text style={{ color: palette.dark.text, fontSize: 14, fontWeight: '700', marginTop: 3 }}>
      {value}
    </Text>
  </View>
);
