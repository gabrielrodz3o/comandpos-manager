import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Card, Input, Button } from '@components/ui';
import { palette } from '@theme/colors';
import { useGoalsStore, periodKey } from '@store/useGoalsStore';
import { showToast } from '@store/useToastStore';

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const monthLabel = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
};

const shiftMonth = (key: string, delta: number) => {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return periodKey(d);
};

export default function GoalsScreen() {
  const router = useRouter();
  const goals = useGoalsStore((s) => s.goals);
  const setGoal = useGoalsStore((s) => s.setGoal);

  const [period, setPeriod] = useState(() => periodKey(new Date()));
  const existing = goals[period];

  const [sales, setSales] = useState(existing ? String(existing.salesGoal) : '');
  const [expense, setExpense] = useState(existing ? String(existing.expenseBudget) : '');

  // Re-sincroniza inputs al cambiar de mes.
  const syncInputs = (key: string) => {
    const g = goals[key];
    setSales(g ? String(g.salesGoal) : '');
    setExpense(g ? String(g.expenseBudget) : '');
  };

  const goPrev = () => {
    const next = shiftMonth(period, -1);
    setPeriod(next);
    syncInputs(next);
  };
  const goNext = () => {
    const next = shiftMonth(period, 1);
    setPeriod(next);
    syncInputs(next);
  };

  const parsed = useMemo(
    () => ({
      sales: Number(sales.replace(/[^0-9.]/g, '')) || 0,
      expense: Number(expense.replace(/[^0-9.]/g, '')) || 0,
    }),
    [sales, expense],
  );

  const handleSave = () => {
    Keyboard.dismiss();
    setGoal(period, { salesGoal: parsed.sales, expenseBudget: parsed.expense });
    showToast({ message: `Metas de ${monthLabel(period)} guardadas`, variant: 'success' });
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.dark.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 16 }}>
        <View>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={{ color: palette.dark.textMuted, fontSize: 14, fontWeight: '600' }}>‹ Atrás</Text>
          </Pressable>
          <Text style={{ color: palette.dark.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.7, marginTop: 8 }}>
            Metas del mes
          </Text>
          <Text style={{ color: palette.dark.textDim, fontSize: 13, marginTop: 4 }}>
            Define tu meta de ventas y presupuesto de gastos. Verás el progreso en el Dashboard.
          </Text>
        </View>

        {/* Selector de mes */}
        <Card variant="default">
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Pressable onPress={goPrev} hitSlop={12}>
              <Text style={{ color: palette.dark.primary, fontSize: 24, fontWeight: '700' }}>‹</Text>
            </Pressable>
            <Text style={{ color: palette.dark.text, fontSize: 16, fontWeight: '700', textTransform: 'capitalize' }}>
              {monthLabel(period)}
            </Text>
            <Pressable onPress={goNext} hitSlop={12}>
              <Text style={{ color: palette.dark.primary, fontSize: 24, fontWeight: '700' }}>›</Text>
            </Pressable>
          </View>
        </Card>

        <Card variant="default">
          <View style={{ gap: 16 }}>
            <Input
              label="Meta de ventas (DOP)"
              keyboardType="numeric"
              placeholder="Ej. 500000"
              value={sales}
              onChangeText={setSales}
            />
            <Input
              label="Presupuesto de gastos (DOP)"
              keyboardType="numeric"
              placeholder="Ej. 200000"
              value={expense}
              onChangeText={setExpense}
            />
          </View>
        </Card>

        <Button onPress={handleSave}>Guardar metas</Button>
      </ScrollView>
    </SafeAreaView>
  );
}
