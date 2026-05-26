import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { palette, shadow } from '@theme/colors';
import { chatWithAi, type ChatMessage } from '@services/aiChat';
import { useBusinessStore } from '@store/useBusinessStore';
import { useFiltersStore } from '@store/useFiltersStore';

const SUGGESTIONS = [
  '¿Cuánto vendí hoy?',
  '¿Quién es mi mejor mesero?',
  '¿Qué productos tienen stock bajo?',
  '¿Cuánto me deben los clientes?',
  '¿Cuál es mi utilidad este mes?',
];

const initialMessage: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    '👋 Hola, soy tu asistente. Pregúntame sobre tus ventas, equipo, inventario o finanzas. Toca una sugerencia abajo o escribe tu pregunta.',
  timestamp: Date.now(),
};

export default function AIAssistantScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const buId = useBusinessStore((s) => s.activeBusinessUnitId);
  const locationId = useBusinessStore((s) => s.selectedLocationId);
  const startDate = useFiltersStore((s) => s.startDate);
  const endDate = useFiltersStore((s) => s.endDate);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const send = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || loading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: Date.now(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await chatWithAi({
        message,
        context: {
          business_unit_id: buId ?? undefined,
          location_id: locationId ?? undefined,
          start_date: startDate,
          end_date: endDate,
        },
        history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      });
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: res.reply,
          timestamp: Date.now(),
        },
      ]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: `a-err-${Date.now()}`,
          role: 'assistant',
          content: 'Lo siento, no pude procesar tu pregunta. Intenta de nuevo.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.dark.bg }} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 12,
            gap: 12,
            borderBottomWidth: 1,
            borderBottomColor: palette.dark.border,
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
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: '#0A0A0B',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 18 }}>🤖</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: palette.dark.text, fontSize: 16, fontWeight: '700', letterSpacing: -0.3 }}>
              Asistente IA
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View
                style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: palette.dark.success }}
              />
              <Text style={{ color: palette.dark.textMuted, fontSize: 11 }}>En línea</Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((m) => (
            <View
              key={m.id}
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
              }}
            >
              <View
                style={{
                  backgroundColor: m.role === 'user' ? palette.dark.primary : palette.dark.surface,
                  borderWidth: m.role === 'user' ? 0 : 1,
                  borderColor: palette.dark.border,
                  borderRadius: 18,
                  borderBottomRightRadius: m.role === 'user' ? 4 : 18,
                  borderBottomLeftRadius: m.role === 'assistant' ? 4 : 18,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  ...shadow.sm,
                }}
              >
                <Text
                  style={{
                    color: m.role === 'user' ? '#FFFFFF' : palette.dark.text,
                    fontSize: 14,
                    lineHeight: 20,
                  }}
                >
                  {m.content}
                </Text>
              </View>
            </View>
          ))}

          {loading ? (
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: palette.dark.surface,
                borderWidth: 1,
                borderColor: palette.dark.border,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderRadius: 18,
                borderBottomLeftRadius: 4,
                flexDirection: 'row',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <ActivityIndicator size="small" color={palette.dark.textMuted} />
              <Text style={{ color: palette.dark.textDim, fontSize: 12 }}>Pensando…</Text>
            </View>
          ) : null}

          {/* Sugerencias rápidas */}
          {messages.length === 1 && !loading ? (
            <View style={{ marginTop: 16, gap: 8 }}>
              <Text style={{ color: palette.dark.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>
                SUGERENCIAS
              </Text>
              {SUGGESTIONS.map((s, idx) => (
                <Pressable
                  key={`sug-${idx}`}
                  onPress={() => send(s)}
                  style={({ pressed }) => ({
                    backgroundColor: palette.dark.surface,
                    borderWidth: 1,
                    borderColor: palette.dark.border,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text style={{ color: palette.dark.text, fontSize: 13, fontWeight: '500' }}>
                    {s}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </ScrollView>

        {/* Input */}
        <View
          style={{
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderTopWidth: 1,
            borderTopColor: palette.dark.border,
            flexDirection: 'row',
            gap: 10,
            backgroundColor: palette.dark.surface,
          }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Pregúntame algo…"
            placeholderTextColor={palette.dark.textMuted}
            style={{
              flex: 1,
              backgroundColor: palette.dark.bg,
              borderWidth: 1,
              borderColor: palette.dark.border,
              borderRadius: 22,
              paddingHorizontal: 16,
              paddingVertical: 10,
              color: palette.dark.text,
              fontSize: 14,
              maxHeight: 100,
            }}
            multiline
            onSubmitEditing={() => send()}
          />
          <Pressable
            onPress={() => send()}
            disabled={!input.trim() || loading}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: palette.dark.primary,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: !input.trim() || loading ? 0.4 : pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '800' }}>↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
