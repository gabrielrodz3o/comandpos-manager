import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, shadow } from '@theme/colors';

const ONBOARDING_KEY = 'comandpos-onboarding-done';

const SLIDES = [
  {
    emoji: '⚡',
    title: 'Tu negocio en vivo',
    description:
      'El tab "Hoy" muestra tus ventas en tiempo real con auto-actualización cada 60 segundos.',
    accent: '#10B981',
  },
  {
    emoji: '📊',
    title: 'Reportes ejecutivos',
    description:
      'Dashboard con KPIs financieros, charts y análisis. 6 reportes detallados a un tap de distancia.',
    accent: '#3B82F6',
  },
  {
    emoji: '✅',
    title: 'Aprueba sin estar en la oficina',
    description:
      'Vacaciones y sugerencias de compra esperando tu decisión. Resuelve desde el móvil.',
    accent: '#F59E0B',
  },
  {
    emoji: '🤖',
    title: 'Asistente IA',
    description:
      'Pregunta en lenguaje natural: "¿Cuánto vendí hoy?" y obtén respuestas inmediatas.',
    accent: '#8B5CF6',
  },
];

const { width: SCREEN_W } = Dimensions.get('window');

export const OnboardingTour: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((v) => {
      if (!v) setVisible(true);
    });
  }, []);

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    setVisible(false);
  };

  const next = () => {
    if (page < SLIDES.length - 1) {
      const nextPage = page + 1;
      setPage(nextPage);
      scrollRef.current?.scrollTo({ x: nextPage * SCREEN_W, animated: true });
    } else {
      finish();
    }
  };

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={finish}>
      <View style={{ flex: 1, backgroundColor: palette.dark.bg }}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(e) => {
            const p = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
            if (p !== page) setPage(p);
          }}
        >
          {SLIDES.map((s, idx) => (
            <View
              key={`slide-${idx}`}
              style={{
                width: SCREEN_W,
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 36,
              }}
            >
              <LinearGradient
                colors={[s.accent + '22', s.accent + '08']}
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: 70,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 32,
                  ...shadow.lg,
                }}
              >
                <Text style={{ fontSize: 64 }}>{s.emoji}</Text>
              </LinearGradient>
              <Text
                style={{
                  color: palette.dark.text,
                  fontSize: 28,
                  fontWeight: '800',
                  letterSpacing: -0.7,
                  textAlign: 'center',
                  marginBottom: 14,
                }}
              >
                {s.title}
              </Text>
              <Text
                style={{
                  color: palette.dark.textDim,
                  fontSize: 15,
                  textAlign: 'center',
                  lineHeight: 22,
                  maxWidth: 320,
                }}
              >
                {s.description}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Dots */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 6,
            marginBottom: 30,
          }}
        >
          {SLIDES.map((_, idx) => (
            <View
              key={`dot-${idx}`}
              style={{
                width: page === idx ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: page === idx ? palette.dark.primary : palette.dark.border,
              }}
            />
          ))}
        </View>

        {/* Botones */}
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: 24,
            paddingBottom: 36,
            gap: 12,
          }}
        >
          <Pressable
            onPress={finish}
            style={({ pressed }) => ({
              paddingHorizontal: 22,
              height: 52,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ color: palette.dark.textDim, fontSize: 14, fontWeight: '600' }}>
              Saltar
            </Text>
          </Pressable>
          <Pressable
            onPress={next}
            style={({ pressed }) => ({
              flex: 1,
              height: 52,
              borderRadius: 14,
              backgroundColor: palette.dark.text,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.85 : 1,
              ...shadow.md,
            })}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>
              {page === SLIDES.length - 1 ? '¡Empezar!' : 'Siguiente'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};
