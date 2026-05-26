import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { palette } from '@theme/colors';
import { locName } from '@utils/format';
import type { EffectiveLocation } from '@hooks/useEffectiveLocationId';
import { useBusinessStore } from '@store/useBusinessStore';

interface Props {
  eff: EffectiveLocation;
}

/**
 * Muestra qué sucursal está activa.
 * - Verde si hay una resuelta
 * - Amarillo (warning) si hace falta elegir, con botón directo para abrir picker
 */
export const ActiveLocationBanner: React.FC<Props> = ({ eff }) => {
  const setSelected = useBusinessStore((s) => s.setSelectedLocation);
  const activeBu = useBusinessStore((s) => s.activeBusinessUnit);
  const [pickerOpen, setPickerOpen] = useState(false);

  const available = useMemo(() => activeBu?.locations ?? [], [activeBu]);

  const handlePick = (id: number) => {
    setSelected(id);
    setPickerOpen(false);
  };

  // Warning state: necesita elegir
  if (eff.needsExplicitSelection) {
    return (
      <>
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: '#FFFBEB',
            borderWidth: 1,
            borderColor: '#FDE68A',
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderRadius: 14,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ fontSize: 18 }}>⚠️</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#92400E', fontSize: 12, fontWeight: '700' }}>
              Sucursal requerida
            </Text>
            <Text style={{ color: '#92400E', fontSize: 11, marginTop: 1 }}>
              Este reporte solo soporta una sucursal. Toca aquí para elegir.
            </Text>
          </View>
          <View
            style={{
              backgroundColor: '#92400E',
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>Elegir</Text>
          </View>
        </Pressable>
        <PickerModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          locations={available}
          selectedId={null}
          onPick={handlePick}
        />
      </>
    );
  }

  if (!eff.location) return null;

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: palette.dark.primaryDim,
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 12,
        }}
      >
        <Text style={{ fontSize: 14 }}>📍</Text>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: palette.dark.success,
              fontSize: 10,
              fontWeight: '700',
              letterSpacing: 0.5,
            }}
          >
            MOSTRANDO
          </Text>
          <Text
            style={{ color: '#065F46', fontSize: 13, fontWeight: '700', marginTop: 1 }}
            numberOfLines={1}
          >
            {locName(eff.location)}
            {eff.location.code ? ` · ${eff.location.code}` : ''}
          </Text>
        </View>
        {available.length > 1 ? (
          <Pressable
            onPress={() => setPickerOpen(true)}
            style={({ pressed }) => ({
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 8,
              backgroundColor: pressed ? '#A7F3D0' : '#FFFFFF',
              borderWidth: 1,
              borderColor: '#A7F3D0',
            })}
          >
            <Text style={{ color: palette.dark.success, fontSize: 11, fontWeight: '700' }}>
              Cambiar
            </Text>
          </Pressable>
        ) : null}
      </View>
      <PickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        locations={available}
        selectedId={eff.location.id}
        onPick={handlePick}
      />
    </>
  );
};

interface PickerModalProps {
  open: boolean;
  onClose: () => void;
  locations: Array<{ id: number; description_long?: string; description_short?: string; name?: string; code?: string }>;
  selectedId: number | null;
  onPick: (id: number) => void;
}

const PickerModal: React.FC<PickerModalProps> = ({ open, onClose, locations, selectedId, onPick }) => (
  <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable
      onPress={onClose}
      style={{
        flex: 1,
        backgroundColor: palette.dark.overlay,
        justifyContent: 'flex-end',
      }}
    >
      <Pressable
        onPress={(e) => e.stopPropagation()}
        style={{
          backgroundColor: palette.dark.surface,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingTop: 14,
          paddingBottom: 36,
          maxHeight: '75%',
        }}
      >
        <View
          style={{
            width: 40,
            height: 5,
            borderRadius: 3,
            backgroundColor: palette.dark.borderHi,
            alignSelf: 'center',
            marginBottom: 16,
          }}
        />
        <Text
          style={{
            color: palette.dark.text,
            fontSize: 18,
            fontWeight: '700',
            paddingHorizontal: 22,
            marginBottom: 14,
            letterSpacing: -0.4,
          }}
        >
          Selecciona sucursal
        </Text>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 12 }}>
          {locations.map((loc) => {
            const isSelected = selectedId === loc.id;
            const label =
              loc.description_long?.trim() ||
              loc.description_short?.trim() ||
              loc.name ||
              `Sucursal ${loc.id}`;
            return (
              <Pressable
                key={loc.id}
                onPress={() => onPick(loc.id)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 14,
                  borderRadius: 14,
                  backgroundColor: isSelected
                    ? palette.dark.primaryDim
                    : pressed
                    ? palette.dark.soft
                    : 'transparent',
                  borderWidth: 1,
                  borderColor: isSelected ? palette.dark.primary : 'transparent',
                  marginBottom: 6,
                })}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: palette.dark.surface,
                    borderWidth: 1,
                    borderColor: palette.dark.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 18 }}>🏬</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: palette.dark.text,
                      fontSize: 14,
                      fontWeight: '600',
                      letterSpacing: -0.2,
                    }}
                  >
                    {label}
                  </Text>
                  {loc.code ? (
                    <Text style={{ color: palette.dark.textMuted, fontSize: 11, marginTop: 2 }}>
                      {loc.code}
                    </Text>
                  ) : null}
                </View>
                {isSelected ? (
                  <Text style={{ color: palette.dark.primary, fontSize: 20, fontWeight: '700' }}>
                    ✓
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </Pressable>
    </Pressable>
  </Modal>
);
