import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { palette } from '@theme/colors';
import { useEmployees } from '@hooks/useOperations';
import { useInventory } from '@hooks/useOperations';
import { useBusinessStore } from '@store/useBusinessStore';
import { fmtCurrency, fmtInt } from '@utils/format';

interface Result {
  group: 'Sucursales' | 'Empleados' | 'Productos';
  title: string;
  subtitle?: string;
  href: string;
  emoji: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const GlobalSearch: React.FC<Props> = ({ visible, onClose }) => {
  const router = useRouter();
  const [q, setQ] = useState('');

  const activeBu = useBusinessStore((s) => s.activeBusinessUnit);
  const locations = useMemo(() => activeBu?.locations ?? [], [activeBu]);
  const empQ = useEmployees();
  const invQ = useInventory(null);

  useEffect(() => {
    if (!visible) setQ('');
  }, [visible]);

  const results = useMemo<Result[]>(() => {
    if (!q.trim()) return [];
    const lower = q.toLowerCase();
    const out: Result[] = [];

    locations
      .filter(
        (l) =>
          l.description_long?.toLowerCase().includes(lower) ||
          l.description_short?.toLowerCase().includes(lower) ||
          l.code?.toLowerCase().includes(lower),
      )
      .slice(0, 4)
      .forEach((l) =>
        out.push({
          group: 'Sucursales',
          title: l.description_long ?? l.description_short ?? `Sucursal ${l.id}`,
          subtitle: l.code,
          href: `/(tabs)/dashboard`,
          emoji: '🏬',
        }),
      );

    (empQ.data ?? [])
      .filter(
        (e) =>
          e.full_name?.toLowerCase().includes(lower) ||
          e.employee_code?.toLowerCase().includes(lower) ||
          e.department_name?.toLowerCase().includes(lower) ||
          e.job_title_name?.toLowerCase().includes(lower),
      )
      .slice(0, 6)
      .forEach((e) =>
        out.push({
          group: 'Empleados',
          title: e.full_name,
          subtitle: `${e.employee_code ?? '—'}${e.job_title_name ? ` · ${e.job_title_name}` : ''}`,
          href: `/(tabs)/operations/employees/${e.id}`,
          emoji: '👤',
        }),
      );

    (invQ.items ?? [])
      .filter(
        (i) =>
          i.item_name?.toLowerCase().includes(lower) ||
          i.category_name?.toLowerCase().includes(lower),
      )
      .slice(0, 6)
      .forEach((i) =>
        out.push({
          group: 'Productos',
          title: i.item_name,
          subtitle: `${fmtInt(i.quantity)} ${i.unit_abbreviation ?? 'und'} · ${
            i.cost_price ? fmtCurrency(i.cost_price) : 'sin costo'
          }`,
          href: `/(tabs)/operations/inventory`,
          emoji: '📦',
        }),
      );

    return out;
  }, [q, locations, empQ.data, invQ.items]);

  const grouped = useMemo(() => {
    const map = new Map<string, Result[]>();
    results.forEach((r) => {
      if (!map.has(r.group)) map.set(r.group, []);
      map.get(r.group)!.push(r);
    });
    return Array.from(map.entries());
  }, [results]);

  const handlePick = (href: string) => {
    onClose();
    setTimeout(() => router.push(href as never), 100);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.97)' }}
      >
        <Pressable
          onPress={onClose}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
        <View style={{ flex: 1, paddingTop: 60, paddingHorizontal: 20 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: palette.dark.surface,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: palette.dark.border,
              paddingHorizontal: 14,
              height: 52,
              gap: 10,
            }}
          >
            <Text style={{ fontSize: 18 }}>🔍</Text>
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Buscar empleados, productos, sucursales…"
              placeholderTextColor={palette.dark.textMuted}
              style={{ flex: 1, color: palette.dark.text, fontSize: 15 }}
              autoFocus
              returnKeyType="search"
            />
            <Pressable onPress={onClose}>
              <Text style={{ color: palette.dark.textMuted, fontSize: 14, fontWeight: '600' }}>
                Cerrar
              </Text>
            </Pressable>
          </View>

          <ScrollView
            style={{ flex: 1, marginTop: 12 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {!q.trim() ? (
              <View style={{ paddingTop: 40, alignItems: 'center' }}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>⌘</Text>
                <Text style={{ color: palette.dark.text, fontSize: 14, fontWeight: '700' }}>
                  Búsqueda global
                </Text>
                <Text
                  style={{
                    color: palette.dark.textDim,
                    fontSize: 12,
                    textAlign: 'center',
                    maxWidth: 260,
                    marginTop: 6,
                  }}
                >
                  Encuentra empleados, productos del inventario y sucursales sin importar dónde
                  estés en la app.
                </Text>
              </View>
            ) : results.length === 0 ? (
              <View style={{ paddingTop: 40, alignItems: 'center' }}>
                <Text style={{ color: palette.dark.text, fontSize: 14, fontWeight: '700' }}>
                  Sin resultados
                </Text>
                <Text style={{ color: palette.dark.textDim, fontSize: 12, marginTop: 4 }}>
                  Intenta con otras palabras.
                </Text>
              </View>
            ) : (
              grouped.map(([group, list]) => (
                <View key={group} style={{ marginBottom: 18 }}>
                  <Text
                    style={{
                      color: palette.dark.textMuted,
                      fontSize: 10,
                      fontWeight: '700',
                      letterSpacing: 1,
                      marginBottom: 6,
                    }}
                  >
                    {group.toUpperCase()} · {list.length}
                  </Text>
                  <View
                    style={{
                      backgroundColor: palette.dark.surface,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: palette.dark.border,
                      overflow: 'hidden',
                    }}
                  >
                    {list.map((r, idx) => (
                      <Pressable
                        key={`${group}-${idx}`}
                        onPress={() => handlePick(r.href)}
                        style={({ pressed }) => ({
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 12,
                          paddingHorizontal: 14,
                          paddingVertical: 12,
                          borderTopWidth: idx > 0 ? 0.5 : 0,
                          borderTopColor: palette.dark.border,
                          backgroundColor: pressed ? palette.dark.soft : 'transparent',
                        })}
                      >
                        <Text style={{ fontSize: 20 }}>{r.emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{ color: palette.dark.text, fontSize: 13, fontWeight: '600' }}
                            numberOfLines={1}
                          >
                            {r.title}
                          </Text>
                          {r.subtitle ? (
                            <Text
                              style={{ color: palette.dark.textDim, fontSize: 11, marginTop: 1 }}
                              numberOfLines={1}
                            >
                              {r.subtitle}
                            </Text>
                          ) : null}
                        </View>
                        <Text style={{ color: palette.dark.textMuted, fontSize: 16 }}>›</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
