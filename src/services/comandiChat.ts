// Servicio de chat Comandi: arma el contexto (sucursales de la BU activa + RBAC)
// y llama al motor agéntico. Texto → /comandi/agent. Voz → /comandi/voice
// (transcribe el audio y corre el agente). También confirma/descarta acciones.
import { comandiApi } from './comandi';
import { useBusinessStore } from '@/store/useBusinessStore';

export interface Turn {
  role: 'user' | 'assistant';
  content: string;
}
export interface PendingAction {
  token: string;
  summary: string;
  action_type: string;
  expires_at: string;
}
export interface ComandiAnswer {
  enabled?: boolean;
  answer: string;
  tools_used?: string[];
  pending_action?: PendingAction | null;
  transcript?: string; // solo en respuestas de voz
  message?: string;
}
export type Period = { from?: string; to?: string } | null;

// Contexto de alcance: sucursales de la BU activa + la sucursal seleccionada.
function buildScope() {
  const bs = useBusinessStore.getState();
  const locations = bs.getAvailableLocations();
  const location_ids = locations.map((l) => l.id).filter((n) => Number.isFinite(n));
  const branches = locations.map((l) => ({
    id: l.id,
    name: l.name || l.description_short || `Sucursal ${l.id}`,
  }));
  return {
    location_ids,
    branches,
    active_location_id: bs.selectedLocationId ?? undefined,
  };
}

export async function askComandi(question: string, history: Turn[] = [], period: Period = null): Promise<ComandiAnswer> {
  const { data } = await comandiApi.post<ComandiAnswer>('/comandi/agent', {
    ...buildScope(),
    question,
    period,
    history,
  });
  return data;
}

export async function sendVoiceNote(uri: string, history: Turn[] = [], period: Period = null): Promise<ComandiAnswer> {
  const form = new FormData();
  form.append('payload', JSON.stringify({ ...buildScope(), period, history }));
  // RN: el archivo se adjunta como { uri, name, type }.
  form.append('audio', { uri, name: 'nota.m4a', type: 'audio/m4a' } as any);
  // No fijamos Content-Type: RN agrega el boundary del multipart automáticamente.
  const { data } = await comandiApi.post<ComandiAnswer>('/comandi/voice', form, {
    transformRequest: (d) => d, // evita que axios serialice el FormData
  });
  return data;
}

export interface BizAlert {
  domain: string;
  severity: 'alta' | 'media';
  title: string;
  detail: string;
}

/** Vigilante: alertas del negocio (qué necesita atención hoy). */
export async function fetchAlerts(): Promise<{ count: number; alerts: BizAlert[] }> {
  const { data } = await comandiApi.post('/comandi/watchdog/check', { ...buildScope() });
  return { count: data?.count || 0, alerts: data?.alerts || [] };
}

/** Registra el token de push de Expo en Comandi (para alertas proactivas). */
export async function registerComandiPush(expoToken: string, platform?: string): Promise<void> {
  await comandiApi.post('/comandi/push/register', { expo_token: expoToken, platform });
}

export async function executeAction(token: string) {
  const { data } = await comandiApi.post('/comandi/action/execute', { confirm_token: token });
  return data as { success: boolean; executed?: boolean; already?: boolean; message?: string };
}
export async function rejectAction(token: string) {
  const { data } = await comandiApi.post('/comandi/action/reject', { confirm_token: token });
  return data as { success: boolean };
}
