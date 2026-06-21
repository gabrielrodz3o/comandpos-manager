// Hooks React Query para Comandi (mutations: no se cachean, son acciones).
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  askComandi,
  sendVoiceNote,
  executeAction,
  rejectAction,
  fetchAlerts,
  type Turn,
  type Period,
} from '@/services/comandiChat';

/** Alertas del negocio (vigilante). Se refresca al volver a la pantalla. */
export function useAlerts() {
  return useQuery({ queryKey: ['comandi-alerts'], queryFn: fetchAlerts, staleTime: 60_000 });
}

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
