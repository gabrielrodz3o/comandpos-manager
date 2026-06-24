// ─────────────────────────────────────────────────────────────────────
// Normalización del balance de caja — espejo de la web (reports/boxes/[id].vue).
//
// El backend (`finances.get_box_shift_payments_new`) YA entrega expected_balance,
// difference y status. Aun así recalculamos en el cliente por dos motivos:
//   1) Robustez: si una sucursal corre una versión vieja de la SP donde el
//      `expected_balance` restaba las cortesías (utilidad perdida, NO efectivo),
//      el FALTANTE saldría falso. Aquí las ignoramos siempre.
//   2) Estado ABIERTA: la SP usa SIN_CERRAR; el cliente distingue caja abierta.
//
// La regla correcta es:
//   esperado   = apertura + ventas_efectivo + entradas_manuales
//                         − compras_efectivo − salidas_manuales
//   diferencia = físico_declarado − esperado
// (La versión anterior de la app hacía `closed - initial`, ignorando ventas y
//  movimientos → de ahí los montos "raros".)
// ─────────────────────────────────────────────────────────────────────

import type { BoxBalance } from '@/types/reports';

export type BoxBalanceStatus =
  | 'CUADRADA'
  | 'SOBRANTE'
  | 'FALTANTE'
  | 'ABIERTA'
  | 'SIN_CERRAR';

export interface NormalizedBoxBalance {
  initial_amount: number;
  sales_cash_income: number;
  manual_entries: number;
  purchases_cash_outcome: number;
  manual_exits: number;
  courtesies_amount: number;
  closed_amount: number | null;
  total_income: number;
  total_outcome: number;
  expected_balance: number;
  difference: number | null;
  is_balanced: boolean | null;
  status: BoxBalanceStatus;
}

export const normalizeBoxBalance = (
  b: BoxBalance | null | undefined,
): NormalizedBoxBalance | null => {
  if (!b) return null;

  const initial = Number(b.initial_amount || 0);
  const cashIn = Number(b.sales_cash_income || 0);
  const manualIn = Number(b.manual_entries || 0);
  const cashOut = Number(b.purchases_cash_outcome || 0);
  const manualOut = Number(b.manual_exits || 0);
  const courtesies = Number(b.courtesies_amount || 0);
  const closed = b.closed_amount == null ? null : Number(b.closed_amount);

  const totalIncome = cashIn + manualIn;
  const totalOutcome = cashOut + manualOut;
  const expected = initial + cashIn + manualIn - cashOut - manualOut;
  const difference = closed == null ? null : closed - expected;

  let status: BoxBalanceStatus;
  if (b.is_closed === false) status = 'ABIERTA';
  else if (closed == null) status = 'SIN_CERRAR';
  else if (Math.abs(closed - expected) < 0.01) status = 'CUADRADA';
  else if (closed > expected) status = 'SOBRANTE';
  else status = 'FALTANTE';

  return {
    initial_amount: initial,
    sales_cash_income: cashIn,
    manual_entries: manualIn,
    purchases_cash_outcome: cashOut,
    manual_exits: manualOut,
    courtesies_amount: courtesies,
    closed_amount: closed,
    total_income: totalIncome,
    total_outcome: totalOutcome,
    expected_balance: expected,
    difference,
    is_balanced: difference == null ? null : Math.abs(difference) < 0.01,
    status,
  };
};

/** ¿Un tipo de movimiento manual es entrada de efectivo? (espejo de la web) */
export const isMovementEntry = (t?: string): boolean =>
  [
    'ENTRADA_MANUAL',
    'RETIRO_BANCO',
    'CAMBIO_DIVISA',
    'COBRO_CXC',
    'FONDO_PROVISTO',
    'TRANSFERENCIA_CAJAS',
    'REINTEGRO_FONDO_DELIVERY',
  ].includes(t ?? '');

const MOVEMENT_LABELS: Record<string, string> = {
  ENTRADA_MANUAL: 'Entrada Manual',
  SALIDA_MANUAL: 'Salida Manual',
  CAMBIO_DIVISA: 'Cambio Divisa',
  GASTOS_MENORES: 'Gastos Menores',
  DEPOSITO_BANCO: 'Depósito Banco',
  RETIRO_BANCO: 'Retiro Banco',
  PROPINA_EMPLEADOS: 'Propinas',
  DEVOLUCION_CLIENTE: 'Devolución',
  COBRO_CXC: 'Cobro CxC',
  PAGO_CXP: 'Pago CxP',
  ANTICIPO_EMPLEADO: 'Anticipo',
  TRANSFERENCIA_CAJAS: 'Transfer. Cajas',
  FONDO_PROVISTO: 'Fondo Provisto',
  REINTEGRO_FONDO: 'Reintegro Fondo',
  FONDO_DELIVERY: 'Fondo a Motorizado',
  REINTEGRO_FONDO_DELIVERY: 'Reintegro Motorizado',
};

export const movementLabel = (t?: string): string =>
  (t && MOVEMENT_LABELS[t]) || t || 'Movimiento';

/** Limpia decimales feos del concepto (12.349999 → 12.34). */
export const cleanConcept = (concept?: string): string =>
  (concept ?? '').replace(/(\d+\.\d{2})\d+/g, '$1');
