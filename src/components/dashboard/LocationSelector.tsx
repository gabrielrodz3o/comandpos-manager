import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { useBusinessStore } from '@store/useBusinessStore';
import { palette, shadow } from '@theme/colors';
import { Card } from '@components/ui';
import { locName } from '@utils/format';

interface Props {
  onChange?: () => void;
}

export const LocationSelector: React.FC<Props> = ({ onChange }) => {
  const activeBu = useBusinessStore((s) => s.activeBusinessUnit);
  const selectedId = useBusinessStore((s) => s.selectedLocationId);
  const setSelected = useBusinessStore((s) => s.setSelectedLocation);

  // Sin filtrar — backend ya devuelve solo las accesibles
  const available = useMemo(() => activeBu?.locations ?? [], [activeBu]);
  const [open, setOpen] = useState(false);

  if (available.length < 2) return null;

  const selectedLoc = selectedId ? available.find((l) => l.id === selectedId) : null;

  const handleConsolidated = () => {
    setSelected(null);
    onChange?.();
  };

  const handlePick = (id: number) => {
    setSelected(id);
    setOpen(false);
    onChange?.();
  };

  return (
    <>
      <Card variant="default">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
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
            <Text style={{ fontSize: 18 }}>📍</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: palette.dark.text, fontSize: 13, fontWeight: '700', letterSpacing: -0.2 }}>
              Sucursal
            </Text>
            <Text style={{ color: palette.dark.textDim, fontSize: 11, fontWeight: '500', marginTop: 1 }} numberOfLines={1}>
              {selectedLoc ? locName(selectedLoc) : `Consolidado · ${available.length} sucursales`}
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            marginTop: 14,
            backgroundColor: palette.dark.soft,
            borderRadius: 12,
            padding: 3,
            gap: 3,
          }}
        >
          <Pressable
            onPress={handleConsolidated}
            style={{
              flex: 1,
              paddingVertical: 9,
              borderRadius: 10,
              backgroundColor: selectedId == null ? palette.dark.surface : 'transparent',
              alignItems: 'center',
              ...(selectedId == null ? shadow.sm : shadow.none),
            }}
          >
            <Text
              style={{
                color: selectedId == null ? palette.dark.text : palette.dark.textDim,
                fontSize: 12,
                fontWeight: '600',
              }}
            >
              Consolidado
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setOpen(true)}
            style={{
              flex: 1,
              paddingVertical: 9,
              borderRadius: 10,
              backgroundColor: selectedId != null ? palette.dark.surface : 'transparent',
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 4,
              ...(selectedId != null ? shadow.sm : shadow.none),
            }}
          >
            <Text
              style={{
                color: selectedId != null ? palette.dark.text : palette.dark.textDim,
                fontSize: 12,
                fontWeight: '600',
              }}
            >
              Por Sucursal
            </Text>
            <Text style={{ color: selectedId != null ? palette.dark.text : palette.dark.textDim, fontSize: 9 }}>
              ▼
            </Text>
          </Pressable>
        </View>
      </Card>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          style={{ flex: 1, backgroundColor: palette.dark.overlay, justifyContent: 'flex-end' }}
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
                marginBottom: 18,
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
              {available.map((loc) => {
                const isSelected = selectedId === loc.id;
                return (
                  <Pressable
                    key={loc.id}
                    onPress={() => handlePick(loc.id)}
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
                      <Text style={{ color: palette.dark.text, fontSize: 14, fontWeight: '600', letterSpacing: -0.2 }}>
                        {locName(loc)}
                      </Text>
                      {loc.code ? (
                        <Text style={{ color: palette.dark.textMuted, fontSize: 11, marginTop: 2 }}>
                          {loc.code}
                        </Text>
                      ) : null}
                    </View>
                    {isSelected ? (
                      <Text style={{ color: palette.dark.primary, fontSize: 20, fontWeight: '700' }}>✓</Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};
