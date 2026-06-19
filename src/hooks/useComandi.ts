// Hooks React Query para Comandi (mutations: no se cachean, son acciones).
import { useMutation } from '@tanstack/react-query';
import {
  askComandi,
  sendVoiceNote,
  executeAction,
  rejectAction,
  type Turn,
  type Period,
} from '@/services/comandiChat';

export function useComandiText() {
  return useMutation({
    mutationFn: (v: { question: string; history?: Turn[]; period?: Period }) =>
      askComandi(v.question, v.history ?? [], v.period ?? null),
  });
}

export function useComandiVoice() {
  return useMutation({
    mutationFn: (v: { uri: string; history?: Turn[]; period?: Period }) =>
      sendVoiceNote(v.uri, v.history ?? [], v.period ?? null),
  });
}

export function useComandiExecute() {
  return useMutation({ mutationFn: (token: string) => executeAction(token) });
}
export function useComandiReject() {
  return useMutation({ mutationFn: (token: string) => rejectAction(token) });
}
