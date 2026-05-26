/**
 * Forecasting client-side simple.
 * Usa regresión lineal de mínimos cuadrados sobre los últimos N puntos
 * y proyecta los próximos M puntos. Sin dependencias externas.
 *
 * No reemplaza modelos ML reales — útil para tendencias rápidas en UI.
 */

export interface SeriesPoint {
  x: number; // índice temporal (0, 1, 2, ...)
  y: number; // valor
}

export interface ForecastResult {
  slope: number; // pendiente diaria
  intercept: number;
  r2: number; // coeficiente de determinación (calidad del ajuste)
  forecast: SeriesPoint[]; // próximos puntos proyectados
  trend: 'up' | 'down' | 'flat';
  changePct: number; // % cambio proyectado vs período actual
}

/**
 * Calcula regresión lineal y forecast.
 * @param values valores históricos (oldest first)
 * @param horizon cuántos puntos hacia adelante proyectar
 */
export const forecast = (values: number[], horizon = 7): ForecastResult | null => {
  const valid = values.filter((v) => Number.isFinite(v));
  if (valid.length < 3) return null;

  const n = valid.length;
  const xs = valid.map((_, i) => i);
  const ys = valid;

  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  if (den === 0) return null;

  const slope = num / den;
  const intercept = meanY - slope * meanX;

  // R²
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const yHat = slope * xs[i] + intercept;
    ssRes += (ys[i] - yHat) ** 2;
    ssTot += (ys[i] - meanY) ** 2;
  }
  const r2 = ssTot === 0 ? 0 : Math.max(0, 1 - ssRes / ssTot);

  // Forecast
  const forecastPoints: SeriesPoint[] = [];
  for (let i = 1; i <= horizon; i++) {
    const x = n - 1 + i;
    forecastPoints.push({ x, y: Math.max(0, slope * x + intercept) });
  }

  const currentSum = ys.slice(-horizon).reduce((a, b) => a + b, 0);
  const forecastSum = forecastPoints.reduce((a, b) => a + b.y, 0);
  const changePct = currentSum > 0 ? ((forecastSum - currentSum) / currentSum) * 100 : 0;
  const trend: 'up' | 'down' | 'flat' =
    Math.abs(changePct) < 2 ? 'flat' : changePct > 0 ? 'up' : 'down';

  return { slope, intercept, r2, forecast: forecastPoints, trend, changePct };
};

/**
 * Detecta anomalías simples: valores que se desvían >2σ de la media.
 */
export const detectAnomalies = (
  values: number[],
): Array<{ index: number; value: number; deviation: number }> => {
  const valid = values.filter((v) => Number.isFinite(v));
  if (valid.length < 4) return [];

  const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
  const variance =
    valid.reduce((a, b) => a + (b - mean) ** 2, 0) / valid.length;
  const std = Math.sqrt(variance);
  if (std === 0) return [];

  return values
    .map((v, i) => ({ index: i, value: v, deviation: (v - mean) / std }))
    .filter((p) => Math.abs(p.deviation) > 2);
};
