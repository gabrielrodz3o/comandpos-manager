import { api } from './apiClient';
import { logger } from '@utils/logger';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatRequest {
  message: string;
  context?: {
    business_unit_id?: number;
    location_id?: number;
    start_date?: string;
    end_date?: string;
  };
  history?: { role: 'user' | 'assistant'; content: string }[];
}

interface ChatResponse {
  reply: string;
  data?: Record<string, unknown>;
}

/**
 * Llama al endpoint de IA del backend. Si no existe, retorna un fallback
 * generado client-side basado en patrones simples del mensaje.
 *
 * Endpoint esperado: POST /api/ai/chat
 * Body: { message, context, history }
 * Response: { reply, data? }
 */
export const chatWithAi = async (req: ChatRequest): Promise<ChatResponse> => {
  try {
    const { data } = await api.post<ChatResponse>('/api/ai/chat', req, {
      skipErrorToast: true,
    });
    return data;
  } catch (e) {
    logger.warn('[ai-chat]', 'endpoint not available, using fallback');
    return generateFallback(req.message);
  }
};

/**
 * Fallback inteligente sin LLM real. Reconoce intents básicos.
 */
const generateFallback = (message: string): ChatResponse => {
  const lower = message.toLowerCase().trim();

  if (lower.includes('venta') && (lower.includes('hoy') || lower.includes('ayer'))) {
    return {
      reply:
        '📊 Para ver las ventas del día, abre el tab "Hoy" — verás el total en vivo + facturas + ticket promedio + propinas, con auto-refresh cada 60 segundos.',
    };
  }
  if (lower.includes('mejor') && (lower.includes('mesero') || lower.includes('vendedor'))) {
    return {
      reply:
        '🏆 Ve a Reportes → Por Mesero. Ahí encontrarás el ranking completo de tu equipo con ventas, propinas, # mesas y ticket promedio.',
    };
  }
  if (lower.includes('stock') || lower.includes('inventario') || lower.includes('bajo')) {
    return {
      reply:
        '📦 Ve a Operaciones → Inventario. Te muestra productos críticos, sin stock y bajo, con filtros por almacén y status.',
    };
  }
  if (lower.includes('cobrar') || lower.includes('cxc') || lower.includes('deud')) {
    return {
      reply:
        '💳 Ve a Operaciones → Cuentas por Cobrar. Verás el total pendiente, % cobranza y listado por cliente con días de atraso.',
    };
  }
  if (lower.includes('vacacion')) {
    return {
      reply:
        '🌴 Ve a Operaciones → Vacaciones. Las solicitudes pendientes se aprueban/rechazan con un tap.',
    };
  }
  if (lower.includes('utilidad') || lower.includes('gan') || lower.includes('p&l') || lower.includes('pl')) {
    return {
      reply:
        '💎 Ve a Reportes → Estado de Resultados. Tienes el P&L completo línea por línea con EBITDA y ganancia neta.',
    };
  }

  return {
    reply:
      `Buena pregunta. Por ahora puedo guiarte:\n\n• 📊 "ventas de hoy" → tab Hoy\n• 🏆 "mejor mesero" → Reportes → Por Mesero\n• 📦 "stock bajo" → Operaciones → Inventario\n• 💳 "cuentas por cobrar" → Operaciones → CxC\n• 💎 "utilidad" → Reportes → Estado de Resultados\n\nCuando se conecte el módulo de IA del backend, podré responder preguntas más complejas con datos en vivo.`,
  };
};
