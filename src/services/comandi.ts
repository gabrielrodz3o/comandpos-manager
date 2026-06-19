// Cliente HTTP del servicio Comandi (IA del negocio). Distinto del API del core:
// apunta a services.comandpos.com y manda el MISMO JWT del usuario (Comandi lo
// valida con el secreto compartido y aplica RBAC). En nativo no hay CORS.
import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

// Configurable por entorno (en dev, si Comandi corre en tu LAN: http://192.168.x.x:4080).
export const COMANDI_BASE_URL =
  process.env.EXPO_PUBLIC_COMANDI_URL?.trim() || 'https://services.comandpos.com';

export const comandiApi = axios.create({
  baseURL: COMANDI_BASE_URL,
  timeout: 120_000, // la IA puede tardar; no cortar a los 30s
});

comandiApi.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});
