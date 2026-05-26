import type { FinancialOverviewResponse } from '@/types/reports';
import { fmtCurrency, fmtPct } from './format';
import { forecast, detectAnomalies } from './forecasting';

export type InsightSeverity = 'positive' | 'warning' | 'critical' | 'info';

export interface Insight {
  id: string;
  severity: InsightSeverity;
  title: string;
  description: string;
  emoji: string;
}

/**
 * Genera insights automáticos basado en análisis del overview financiero.
 * 100% client-side, sin LLM. Cuando exista endpoint /api/ai/chat, esto se
 * complementa con insights más sofisticados generados por IA.
 */
export const generateInsights = (data: FinancialOverviewResponse | null): Insight[] => {
  if (!data?.summary) return [];
  const s = data.summary;
  const out: Insight[] = [];

  // Margen neto negativo
  if (s.utilidad_neta < 0) {
    out.push({
      id: 'negative-margin',
      severity: 'critical',
      emoji: '🔴',
      title: 'Utilidad neta negativa',
      description: `El período cerró con pérdida de ${fmtCurrency(Math.abs(s.utilidad_neta))}. Revisa costos operativos y gastos.`,
    });
  } else if (s.margen_neto_pct > 25) {
    out.push({
      id: 'high-margin',
      severity: 'positive',
      emoji: '🎉',
      title: 'Margen neto excelente',
      description: `${fmtPct(s.margen_neto_pct)} de margen neto está muy por encima del promedio del sector (~10-15%).`,
    });
  } else if (s.margen_neto_pct < 5 && s.margen_neto_pct >= 0) {
    out.push({
      id: 'low-margin',
      severity: 'warning',
      emoji: '⚠️',
      title: 'Margen neto bajo',
      description: `Solo ${fmtPct(s.margen_neto_pct)} de margen. Sector recomienda 10-15%. Revisa precios o costos.`,
    });
  }

  // Gastos altos vs ventas
  if (s.ventas_total > 0) {
    const gastosPct = (s.gastos_total / s.ventas_total) * 100;
    if (gastosPct > 40) {
      out.push({
        id: 'high-expenses',
        severity: 'warning',
        emoji: '💸',
        title: 'Gastos operativos altos',
        description: `Los gastos representan ${fmtPct(gastosPct)} de las ventas. Sector saludable: <35%.`,
      });
    }
  }

  // Tendencia ventas
  if (data.monthly_series?.length >= 3) {
    const last = data.monthly_series.slice(-3).map((m) => Number(m.ventas) || 0);
    const f = forecast(last, 1);
    if (f && f.trend === 'up' && f.changePct > 10) {
      out.push({
        id: 'sales-up',
        severity: 'positive',
        emoji: '📈',
        title: 'Ventas en crecimiento',
        description: `Proyección sugiere +${fmtPct(f.changePct)} el próximo período. Aprovecha el momento.`,
      });
    } else if (f && f.trend === 'down' && f.changePct < -10) {
      out.push({
        id: 'sales-down',
        severity: 'critical',
        emoji: '📉',
        title: 'Ventas en descenso',
        description: `Proyección sugiere ${fmtPct(f.changePct)} el próximo período. Acción recomendada.`,
      });
    }
  }

  // Cartera vencida
  if (s.cxc_total > 0 && s.dso > 60) {
    out.push({
      id: 'high-dso',
      severity: 'warning',
      emoji: '⏰',
      title: 'Cobranza lenta',
      description: `Tiempo promedio de cobro: ${Math.round(s.dso)} días. Considera políticas de cobranza más agresivas.`,
    });
  }

  // Concentración de clientes
  if (data.top_customers?.length >= 3) {
    const top3Total = data.top_customers
      .slice(0, 3)
      .reduce((sum, c) => sum + Number(c.total ?? c.total_sales ?? 0), 0);
    const concentration = s.ventas_total > 0 ? (top3Total / s.ventas_total) * 100 : 0;
    if (concentration > 50) {
      out.push({
        id: 'customer-concentration',
        severity: 'warning',
        emoji: '🎯',
        title: 'Concentración de clientes alta',
        description: `Tus 3 mejores clientes representan ${fmtPct(concentration)} de las ventas. Diversifica para reducir riesgo.`,
      });
    }
  }

  // Anomalías en flujo
  if (data.cash_flow?.length >= 5) {
    const net = data.cash_flow.map((c) => {
      const entradas = Number(c.entradas ?? c.in ?? 0);
      const salidas = Number(c.salidas ?? c.out ?? 0);
      return Number(c.neto ?? c.net ?? entradas - salidas) || 0;
    });
    const anomalies = detectAnomalies(net);
    if (anomalies.length > 0) {
      const lastAnomaly = anomalies[anomalies.length - 1];
      out.push({
        id: 'cash-anomaly',
        severity: 'info',
        emoji: '🔍',
        title: 'Anomalía detectada en flujo',
        description: `Se detectó un valor inusual (${fmtCurrency(lastAnomaly.value)}). Revisa esa fecha por si hay error de registro.`,
      });
    }
  }

  // Si no hay nada, mensaje positivo
  if (out.length === 0) {
    out.push({
      id: 'all-good',
      severity: 'positive',
      emoji: '✅',
      title: 'Todo en orden',
      description: 'Los indicadores principales se ven saludables. Continúa monitoreando regularmente.',
    });
  }

  return out;
};
