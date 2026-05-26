import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Card, LoadingState, InlineFetchingBar } from '@components/ui';
import { LocationSelector } from '@components/dashboard/LocationSelector';
import { ActiveLocationBanner } from '@components/reports/ActiveLocationBanner';
import { palette, shadow } from '@theme/colors';
import { fmtInt } from '@utils/format';
import {
  useWaiters,
  useAddWaiter,
  useUpdateWaiter,
  useDeactivateWaiter,
  useResetWaiterPin,
} from '@hooks/useManagement';
import type { Waiter } from '@/types/management';

const initials = (name: string): string =>
  (name || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('') || '?';

export default function WaitersScreen() {
  const router = useRouter();
  const { data, isLoading, isFetching, isRefetching, refetch, error, eff } = useWaiters();
  const addM = useAddWaiter();
  const updateM = useUpdateWaiter();
  const deactivateM = useDeactivateWaiter();
  const resetPinM = useResetWaiterPin();

  const waiters = data ?? [];

  const [editOpen, setEditOpen] = useState(false);
  const [editingWaiter, setEditingWaiter] = useState<Waiter | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setEditingWaiter(null);
    setNameInput('');
    setEditOpen(true);
  };

  const openEdit = (w: Waiter) => {
    setEditingWaiter(w);
    setNameInput(w.name);
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!nameInput.trim()) {
      Alert.alert('Nombre requerido');
      return;
    }
    setSaving(true);
    try {
      if (editingWaiter) {
        await updateM.mutateAsync({ id: editingWaiter.id, name: nameInput.trim() });
      } else {
        await addM.mutateAsync(nameInput.trim());
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditOpen(false);
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', (e as Error)?.message ?? 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPin = (w: Waiter) => {
    Alert.alert(
      'Generar nuevo PIN',
      `¿Generar un nuevo PIN aleatorio para ${w.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Generar',
          onPress: async () => {
            try {
              await resetPinM.mutateAsync(w.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Listo', 'El nuevo PIN está disponible al recargar la lista.');
            } catch (e) {
              Alert.alert('Error', (e as Error)?.message ?? 'No se pudo generar.');
            }
          },
        },
      ],
    );
  };

  const handleDeactivate = (w: Waiter) => {
    Alert.alert(
      'Desactivar mesero',
      `${w.name} no podrá iniciar sesión en el POS. ¿Confirmas?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deactivateM.mutateAsync(w.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (e) {
              Alert.alert('Error', (e as Error)?.message ?? 'No se pudo desactivar.');
            }
          },
        },
      ],
    );
  };

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
              Meseros
            </Text>
            <Text style={{ color: palette.dark.textDim, fontSize: 12, fontWeight: '500' }}>
              {fmtInt(waiters.length)} activos
            </Text>
          </View>
          <Pressable
            onPress={openAdd}
            disabled={!eff.locationId}
            style={({ pressed }) => ({
              backgroundColor: palette.dark.primary,
              paddingHorizontal: 14,
              height: 38,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: !eff.locationId ? 0.4 : pressed ? 0.85 : 1,
              ...shadow.sm,
            })}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>+ Nuevo</Text>
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <LocationSelector />
        </View>

        <InlineFetchingBar visible={isFetching && !isLoading} />

        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          <ActiveLocationBanner eff={eff} />

          {eff.needsExplicitSelection ? null : isLoading ? (
            <LoadingState label="Cargando meseros…" />
          ) : error ? (
            <Card>
              <Text style={{ color: palette.dark.danger, fontSize: 14, fontWeight: '700' }}>Error</Text>
              <Text style={{ color: palette.dark.textDim, fontSize: 12, marginTop: 4 }}>
                {(error as Error)?.message ?? 'No se pudo cargar.'}
              </Text>
            </Card>
          ) : waiters.length === 0 ? (
            <Card>
              <Text style={{ color: palette.dark.text, fontSize: 14, fontWeight: '700', textAlign: 'center' }}>
                Sin meseros activos
              </Text>
              <Text style={{ color: palette.dark.textDim, fontSize: 12, textAlign: 'center', marginTop: 4 }}>
                Toca "+ Nuevo" para agregar el primer mesero.
              </Text>
            </Card>
          ) : (
            <Card variant="default" padded={false}>
              {waiters.map((w, idx) => (
                <View
                  key={w.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    gap: 12,
                    borderTopWidth: idx > 0 ? 0.5 : 0,
                    borderTopColor: palette.dark.border,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: palette.dark.primaryDim,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: palette.dark.success, fontSize: 13, fontWeight: '800' }}>
                      {initials(w.name)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ color: palette.dark.text, fontSize: 14, fontWeight: '600', letterSpacing: -0.2 }}
                      numberOfLines={1}
                    >
                      {w.name}
                    </Text>
                    <Text style={{ color: palette.dark.textMuted, fontSize: 11, marginTop: 2 }}>
                      PIN: {w.pin ?? '—'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => openEdit(w)}
                    style={({ pressed }) => ({
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: pressed ? palette.dark.soft : 'transparent',
                    })}
                  >
                    <Text style={{ color: palette.dark.text, fontSize: 11, fontWeight: '700' }}>Editar</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleResetPin(w)}
                    style={({ pressed }) => ({
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: pressed ? palette.dark.soft : 'transparent',
                    })}
                  >
                    <Text style={{ color: palette.dark.primary, fontSize: 11, fontWeight: '700' }}>PIN</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleDeactivate(w)}
                    style={({ pressed }) => ({
                      paddingHorizontal: 8,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: pressed ? '#FEF2F2' : 'transparent',
                    })}
                  >
                    <Text style={{ color: palette.dark.danger, fontSize: 14 }}>✕</Text>
                  </Pressable>
                </View>
              ))}
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Edit/Add Modal */}
      <Modal visible={editOpen} transparent animationType="fade" onRequestClose={() => setEditOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <Pressable
            onPress={() => setEditOpen(false)}
            style={{ flex: 1, backgroundColor: palette.dark.overlay, justifyContent: 'flex-end' }}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={{
                backgroundColor: palette.dark.surface,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                padding: 24,
                paddingBottom: 36,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: palette.dark.borderHi,
                  alignSelf: 'center',
                  marginBottom: 18,
                }}
              />
              <Text style={{ color: palette.dark.text, fontSize: 18, fontWeight: '700', marginBottom: 16 }}>
                {editingWaiter ? 'Editar mesero' : 'Nuevo mesero'}
              </Text>
              <Text style={{ color: palette.dark.textDim, fontSize: 12, fontWeight: '600', marginBottom: 6 }}>
                Nombre completo
              </Text>
              <TextInput
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Juan Pérez"
                placeholderTextColor={palette.dark.textMuted}
                autoFocus
                style={{
                  borderWidth: 1,
                  borderColor: palette.dark.border,
                  borderRadius: 12,
                  padding: 14,
                  color: palette.dark.text,
                  fontSize: 15,
                  backgroundColor: palette.dark.bg,
                  marginBottom: 16,
                }}
              />
              {!editingWaiter ? (
                <Text style={{ color: palette.dark.textMuted, fontSize: 11, marginBottom: 16 }}>
                  El sistema generará un PIN de acceso automáticamente.
                </Text>
              ) : null}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Pressable
                  onPress={() => setEditOpen(false)}
                  style={({ pressed }) => ({
                    flex: 1,
                    backgroundColor: palette.dark.soft,
                    height: 48,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text style={{ color: palette.dark.text, fontSize: 14, fontWeight: '700' }}>Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  disabled={!nameInput.trim() || saving}
                  style={({ pressed }) => ({
                    flex: 2,
                    backgroundColor: palette.dark.primary,
                    height: 48,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: !nameInput.trim() || saving ? 0.5 : pressed ? 0.85 : 1,
                  })}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>Guardar</Text>
                  )}
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
