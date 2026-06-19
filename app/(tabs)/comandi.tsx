// Comandi — copiloto del negocio (chat de texto + nota de voz).
// Habla con el servicio Comandi (services.comandpos.com) con el JWT del usuario;
// el alcance (empresa/sucursales) sale de la BU activa. Acciones de escritura se
// confirman con botones.
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { palette } from '@/theme/colors';
import { fontSize, fontWeight } from '@/theme/typography';
import { useComandiText, useComandiVoice, useComandiExecute, useComandiReject } from '@/hooks/useComandi';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import type { PendingAction, Turn } from '@/services/comandiChat';

const c = palette.dark;
const LOGO = require('../../assets/comandi.png');

type ActState = 'idle' | 'busy' | 'done' | 'rejected' | 'error';
interface Msg {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  voice?: boolean;
  tools?: number;
  pending?: PendingAction | null;
  actState?: ActState;
  actMsg?: string;
}

// Markdown ligero → texto plano legible (Telegram-style).
const clean = (t: string) =>
  (t || '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .trim();

const CHIPS = ['¿Cuánto vendí hoy?', '¿Cómo está mi food cost?', '¿Qué debo reordenar?', '¿Hay descuadres de caja?'];

let _id = 0;
const nid = () => `m${++_id}`;

export default function ComandiScreen() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const textMut = useComandiText();
  const voiceMut = useComandiVoice();
  const execMut = useComandiExecute();
  const rejectMut = useComandiReject();
  const rec = useVoiceRecorder();

  const busy = textMut.isPending || voiceMut.isPending;

  const period = useMemo(() => {
    const now = new Date();
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
      to: now.toISOString().slice(0, 10),
    };
  }, []);

  const scrollDown = useCallback(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, []);

  const history = useCallback((): Turn[] => {
    const turns: Turn[] = [];
    for (const m of messages) {
      if (m.role === 'user' && m.text) turns.push({ role: 'user', content: m.text });
      else if (m.role === 'assistant' && m.text) turns.push({ role: 'assistant', content: m.text });
    }
    return turns.slice(-8);
  }, [messages]);

  const patch = (id: string, fields: Partial<Msg>) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...fields } : m)));

  const applyAnswer = (assistantId: string, res: any) => {
    patch(assistantId, {
      text: clean(res?.answer || res?.message || 'Sin respuesta'),
      tools: res?.tools_used?.length || 0,
      pending: res?.pending_action || null,
      actState: 'idle',
    });
  };

  const send = useCallback(
    async (q?: string) => {
      const question = (q ?? input).trim();
      if (!question || busy) return;
      setInput('');
      const h = history();
      const userId = nid();
      const aId = nid();
      setMessages((prev) => [...prev, { id: userId, role: 'user', text: question }, { id: aId, role: 'assistant', text: '' }]);
      scrollDown();
      try {
        const res = await textMut.mutateAsync({ question, history: h, period });
        applyAnswer(aId, res);
      } catch (e: any) {
        patch(aId, { text: `⚠️ ${e?.response?.data?.message || e?.message || 'No se pudo responder'}` });
      } finally {
        scrollDown();
      }
    },
    [input, busy, history, period, textMut],
  );

  const toggleMic = useCallback(async () => {
    if (busy) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (rec.recording) {
      const uri = await rec.stop();
      if (!uri) return;
      const h = history();
      const userId = nid();
      const aId = nid();
      setMessages((prev) => [
        ...prev,
        { id: userId, role: 'user', text: 'Nota de voz…', voice: true },
        { id: aId, role: 'assistant', text: '' },
      ]);
      scrollDown();
      try {
        const res = await voiceMut.mutateAsync({ uri, history: h, period });
        if (res?.transcript) patch(userId, { text: res.transcript });
        applyAnswer(aId, res);
      } catch (e: any) {
        patch(aId, { text: `⚠️ ${e?.response?.data?.message || e?.message || 'No se pudo procesar la voz'}` });
      } finally {
        scrollDown();
      }
    } else {
      await rec.start();
    }
  }, [busy, rec, history, period, voiceMut]);

  const confirm = useCallback(
    async (m: Msg) => {
      if (!m.pending || m.actState === 'busy') return;
      patch(m.id, { actState: 'busy' });
      try {
        const r = await execMut.mutateAsync(m.pending.token);
        patch(m.id, { actState: 'done', actMsg: r?.already ? 'Ya estaba hecho.' : '✅ Hecho.' });
      } catch (e: any) {
        patch(m.id, { actState: 'error', actMsg: `⚠️ ${e?.response?.data?.message || 'No se pudo ejecutar'}` });
      }
    },
    [execMut],
  );

  const cancel = useCallback(
    async (m: Msg) => {
      if (!m.pending || m.actState === 'busy') return;
      try {
        await rejectMut.mutateAsync(m.pending.token);
      } catch {
        /* da igual */
      }
      patch(m.id, { actState: 'rejected', actMsg: 'Cancelado.' });
    },
    [rejectMut],
  );

  const briefing = () =>
    send('Dame un briefing ejecutivo muy conciso: ventas/utilidad, food cost, caja y compras, y lo más urgente. Máximo 8 líneas.');

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Image source={LOGO} style={s.avatar} resizeMode="contain" />
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Comandi</Text>
          <Text style={s.subtitle}>Tu copiloto del negocio</Text>
        </View>
        <Pressable style={s.briefBtn} onPress={briefing} disabled={busy}>
          <Text style={s.briefBtnText}>✦ Briefing</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <ScrollView ref={scrollRef} style={s.list} contentContainerStyle={{ padding: 16, paddingBottom: 8 }}>
          {messages.length === 0 && (
            <View style={s.empty}>
              <Text style={s.emptyTitle}>Pregúntame lo que sea de tu negocio</Text>
              <Text style={s.emptyHint}>Escribe o envía una nota de voz 🎙️</Text>
              <View style={s.chips}>
                {CHIPS.map((ch) => (
                  <Pressable key={ch} style={s.chip} onPress={() => send(ch)}>
                    <Text style={s.chipText}>{ch}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {messages.map((m) =>
            m.role === 'user' ? (
              <View key={m.id} style={s.rowEnd}>
                <View style={[s.bubble, s.userBubble]}>
                  <Text style={s.userText}>
                    {m.voice ? '🎙️  ' : ''}
                    {m.text}
                  </Text>
                </View>
              </View>
            ) : (
              <View key={m.id} style={s.rowStart}>
                <Image source={LOGO} style={s.aiAvatar} resizeMode="contain" />
                <View style={[s.bubble, s.aiBubble]}>
                  {m.text ? <Text style={s.aiText}>{m.text}</Text> : <ActivityIndicator size="small" color={c.primary} />}
                  {!!m.tools && m.tools > 0 && <Text style={s.tools}>🔧 consultó {m.tools} reporte(s)</Text>}

                  {m.pending && (
                    <View style={s.action}>
                      <Text style={s.actionHead}>🛡️ Acción pendiente</Text>
                      <Text style={s.actionBody}>{m.pending.summary}</Text>
                      {m.actState === 'idle' && (
                        <View style={s.actionBtns}>
                          <Pressable style={[s.actBtn, s.actConfirm]} onPress={() => confirm(m)}>
                            <Text style={s.actConfirmText}>Confirmar</Text>
                          </Pressable>
                          <Pressable style={s.actBtn} onPress={() => cancel(m)}>
                            <Text style={s.actCancelText}>Cancelar</Text>
                          </Pressable>
                        </View>
                      )}
                      {m.actState === 'busy' && <ActivityIndicator size="small" color={c.primary} style={{ marginTop: 6 }} />}
                      {(m.actState === 'done' || m.actState === 'rejected' || m.actState === 'error') && (
                        <Text style={[s.actionResult, m.actState === 'error' && { color: c.danger }]}>{m.actMsg}</Text>
                      )}
                    </View>
                  )}
                </View>
              </View>
            ),
          )}
        </ScrollView>

        {/* Barra de entrada */}
        <View style={s.inputBar}>
          {rec.recording ? (
            <View style={s.recording}>
              <View style={s.recDot} />
              <Text style={s.recText}>Grabando… toca ⏹ para enviar</Text>
            </View>
          ) : (
            <TextInput
              style={s.input}
              value={input}
              onChangeText={setInput}
              placeholder="Escribe tu pregunta…"
              placeholderTextColor={c.textMuted}
              editable={!busy}
              multiline
              onSubmitEditing={() => send()}
            />
          )}
          <Pressable
            style={[s.micBtn, rec.recording && s.micBtnActive]}
            onPress={toggleMic}
            disabled={busy && !rec.recording}
          >
            <Text style={{ fontSize: 18 }}>{rec.recording ? '⏹' : '🎙️'}</Text>
          </Pressable>
          {!rec.recording && (
            <Pressable style={[s.sendBtn, (!input.trim() || busy) && s.sendBtnOff]} onPress={() => send()} disabled={!input.trim() || busy}>
              {busy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.sendText}>↑</Text>}
            </Pressable>
          )}
        </View>
        {rec.error && <Text style={s.recError}>{rec.error}</Text>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    backgroundColor: c.surface,
  },
  avatar: { width: 42, height: 42, borderRadius: 13 },
  title: { fontSize: fontSize.lg, fontWeight: fontWeight.bold as any, color: c.text },
  subtitle: { fontSize: fontSize.xs, color: c.textMuted },
  briefBtn: { backgroundColor: c.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  briefBtnText: { color: '#fff', fontSize: fontSize.sm, fontWeight: fontWeight.semibold as any },

  list: { flex: 1 },
  empty: { alignItems: 'center', paddingTop: 40, gap: 6 },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold as any, color: c.text, textAlign: 'center' },
  emptyHint: { fontSize: fontSize.sm, color: c.textMuted, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 8 },
  chip: { borderWidth: 1, borderColor: c.primary, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  chipText: { color: c.primary, fontSize: fontSize.sm, fontWeight: fontWeight.medium as any },

  rowEnd: { alignItems: 'flex-end', marginBottom: 10 },
  rowStart: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  aiAvatar: { width: 28, height: 28, borderRadius: 8, marginTop: 2 },
  bubble: { maxWidth: '82%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  userBubble: { backgroundColor: c.primary, borderBottomRightRadius: 4 },
  userText: { color: '#fff', fontSize: fontSize.base, lineHeight: 21 },
  aiBubble: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderBottomLeftRadius: 4, flexShrink: 1 },
  aiText: { color: c.text, fontSize: fontSize.base, lineHeight: 22 },
  tools: { fontSize: fontSize.xs, color: c.textMuted, marginTop: 6 },

  action: { marginTop: 10, borderWidth: 1, borderColor: c.primary, borderRadius: 12, padding: 10, backgroundColor: c.primaryDim, gap: 8 },
  actionHead: { fontSize: fontSize.xs, color: c.primary, fontWeight: fontWeight.bold as any },
  actionBody: { fontSize: fontSize.sm, color: c.text, lineHeight: 19 },
  actionBtns: { flexDirection: 'row', gap: 8 },
  actBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9 },
  actConfirm: { backgroundColor: c.primary },
  actConfirmText: { color: '#fff', fontWeight: fontWeight.semibold as any, fontSize: fontSize.sm },
  actCancelText: { color: c.textDim, fontWeight: fontWeight.medium as any, fontSize: fontSize.sm, paddingVertical: 7 },
  actionResult: { fontSize: fontSize.sm, fontWeight: fontWeight.bold as any, color: c.text },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: c.border,
    backgroundColor: c.surface,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 44,
    borderWidth: 1,
    borderColor: c.borderHi,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 11,
    paddingBottom: 11,
    fontSize: fontSize.base,
    color: c.text,
    backgroundColor: c.bg,
  },
  recording: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, paddingHorizontal: 8 },
  recDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: c.danger },
  recText: { color: c.danger, fontSize: fontSize.sm, fontWeight: fontWeight.medium as any },
  recError: { color: c.danger, fontSize: fontSize.xs, paddingHorizontal: 16, paddingBottom: 6 },
  micBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: c.soft },
  micBtnActive: { backgroundColor: c.primaryDim },
  sendBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary },
  sendBtnOff: { backgroundColor: c.borderHi },
  sendText: { color: '#fff', fontSize: 22, fontWeight: '700', lineHeight: 24 },
});
