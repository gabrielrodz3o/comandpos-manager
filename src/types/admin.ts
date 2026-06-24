// ────────────────────────────────────────────────────────────────────
// Tipos de los reportes ADMINISTRATIVOS portados de la web.
// Reflejan EXACTAMENTE lo que devuelven los endpoints /api/restaurant/reports/*.
// ────────────────────────────────────────────────────────────────────

// ── Posición de Efectivo / Tesorería ────────────────────────────────
// GET /api/restaurant/transactions/cash-position?business_unit_id=&location_id=
//   → { success, data: CashPositionData }
export interface CashBox {
  entry_id: number;
  box_name: string;
  location_name?: string;
  open_at?: string;
  shift_code?: string;
  currency_code: string;
  opening_amount: number;
  invoices_total: number;
  manual_entries: number;
  manual_exits: number;
  current_balance: number;
  expected_balance: number;
}
export interface CashByCurrency {
  currency_code: string;
  total: number;
  box_count: number;
}
export interface CashByLocation {
  location_id: number;
  location_name: string;
  business_unit_name?: string;
  currency_code: string;
  total: number;
  box_count: number;
}
export interface CashPositionData {
  boxes: CashBox[];
  by_location: CashByLocation[];
  by_currency: CashByCurrency[];
  open_count: number;
}

// GET /api/restaurant/treasury/accounts → { success, data: { accounts: TreasuryAccount[] } }
export interface TreasuryAccount {
  id: string;
  type: 'PRINCIPAL' | 'BOVEDA' | string;
  name: string;
  location_name?: string;
  business_unit_name?: string;
  current_balance: number;
  currency_code: string;
}

// POST /api/restaurant/banks/get-accounts { business_unit_id } → BankAccount[]
export interface BankAccount {
  account_id: number;
  account_name: string;
  bank_name?: string;
  balance: number;
  currency_code: string;
}

// ── Análisis de Costos ──────────────────────────────────────────────
// POST /api/restaurant/reports/cost-analysis { date_from, date_to, location_id }
export interface CostKpis {
  total_ventas: number;
  total_costo_ventas: number;
  margen_bruto: number;
  food_cost_percentage: number;
  theoretical_cost_percentage: number;
  margen_percentage: number;
  total_compras: number;
  total_mermas: number;
  num_mermas: number;
  total_costo_cortesias: number;
  num_cortesias: number;
  inventory_variance: number;
}
export interface CostCategory {
  category_id: number;
  category_name: string;
  ventas_totales: number;
  costo_total: number;
  cost_percentage: number;
  margen_bruto: number;
  margen_percentage: number;
}
export interface CostItem {
  item_id: number;
  item_name: string;
  category_name?: string;
  ventas_totales?: number;
  cost_percentage?: number;
  theoretical_cost_percentage?: number;
  margen_total?: number;
  margen_percentage?: number;
}
export interface CostAnalysisResponse {
  kpis: CostKpis;
  costos_por_categoria: CostCategory[];
  top_items_ventas: CostItem[];
  items_alto_costo: CostItem[];
  items_mas_rentables: CostItem[];
}

// ── Cuentas por Pagar (CxP) ─────────────────────────────────────────
// POST /api/restaurant/reports/accounts-payable  body: { location_id, entity_id? }
export interface PayableKpis {
  total_por_pagar: number;
  total_facturas: number;
  total_proveedores: number;
  proveedores_vencidos: number;
  prioridad_alta: number;
  al_dia: number;
  vencido_30: number;
  vencido_60: number;
  vencido_90: number;
  vencido_mas_90: number;
  dias_promedio_vencimiento: number;
}

export interface PayableAgingBucket {
  aging_category: string; // 'AL DIA' | '1-30 DIAS' | '31-60 DIAS' | '61-90 DIAS' | 'MAS DE 90 DIAS'
  num_proveedores: number;
  num_facturas: number;
  monto_total: number;
  porcentaje_del_total: number;
}

export interface PayableSupplier {
  entity_id: number;
  entity_name: string;
  entity_document_id?: string;
  num_facturas: number;
  total_pendiente: number;
  max_dias_vencidos: number;
  prioridad_maxima?: string; // 'ALTA' | 'MEDIA' | 'BAJA'
  proximo_vencimiento?: string;
}

export interface PayableInvoice {
  invoice_id: number;
  invoice_number: string;
  supplier_invoice_number?: string;
  emission_date?: string;
  expire_at?: string;
  entity_id: number;
  entity_name: string;
  total_amount_dop: number;
  monto_pagado: number;
  monto_pendiente: number;
  dias_vencidos: number;
  prioridad?: string;
}

export interface AccountsPayableResponse {
  kpis: PayableKpis;
  aging_analysis: PayableAgingBucket[];
  top_proveedores_deuda: PayableSupplier[];
  resumen_por_proveedor: PayableSupplier[];
  facturas_vencidas: PayableSupplier[];
  detalle_facturas: PayableInvoice[];
}

// ── Control / Auditoría (rango de fechas YYYY-MM-DD) ────────────────

// POST /api/restaurant/reports/courtesies  { date_from, date_to, location_id } → Courtesy[]
export interface Courtesy {
  id: number;
  table_name?: string;
  authorized_by_fullname?: string;
  authorized_at?: string;
  waiter_name?: string;
  waiter_fullname?: string;
  reason?: string;
  reason_name?: string;
  note?: string;
  total_sale_price: number;
  utility_lost: number;
}

// GET /api/restaurant/reports/discounts  params { startDate, endDate, businessUnitId, locationId }
// → { success, data: DiscountRow[], totals: DiscountTotals }
export interface DiscountRow {
  id: number;
  invoice_number: string;
  invoice_date?: string;
  customer_name?: string;
  authorized_by_fullname?: string;
  authorized_at?: string;
  subtotal_amount: number;
  discount_amount: number;
  total_amount: number;
  discount_percentage: number;
  items_with_discount?: number;
  note?: string;
}

export interface DiscountTotals {
  total_invoices: number;
  total_discount_amount: number;
  total_subtotal_amount: number;
  average_discount_percentage: number;
  promotion_discounts: number;
  manual_discounts: number;
  promotion_count: number;
  manual_count: number;
}

export interface DiscountsResponse {
  data: DiscountRow[];
  totals: DiscountTotals;
}

// POST /api/restaurant/reports/deleted-items  { date_from, date_to, location_id } → DeletedItem[]
export interface DeletedItem {
  id: number;
  order_code?: string;
  item_name: string;
  quantity: number;
  order_price: number;
  total_amount: number;
  production_center_name?: string;
  location_name?: string;
  deleted_by?: string;
  deleted_at?: string;
  order_state?: string;
  reason?: string;
  item_note?: string;
  inventory_returned?: boolean;
}

// POST /api/restaurant/reports/price-changes  { date_from, date_to, location_id } → PriceChange[]
export interface PriceChange {
  id: number;
  order_code?: string;
  item_name: string;
  change_type?: string; // 'PRICE' | 'QUANTITY' | 'BOTH'
  old_quantity: number;
  new_quantity: number;
  old_price: number;
  new_price: number;
  price_difference: number;
  changed_by?: string;
  changed_at?: string;
  authorization_profile_name?: string | null;
  reason?: string;
}

// POST /api/restaurant/reports/audit-trail → { kpis, audit_trail_list, ... }
export interface AuditKpis {
  total_changes: number;
  high_severity: number;
  medium_severity: number;
  low_severity: number;
  unique_users: number;
  delete_actions: number;
  void_actions: number;
}

export interface AuditEvent {
  entity_type: string;
  entity_id: number;
  entity_reference?: string;
  action_type: string;
  user_name: string;
  action_timestamp: string;
  severity: string; // 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface AuditTrailResponse {
  kpis: AuditKpis;
  audit_trail_list: AuditEvent[];
  high_severity_changes: AuditEvent[];
}
