// ────────────────────────────────────────────────────────────────────
// Dashboard / Financial Overview
// ────────────────────────────────────────────────────────────────────
export interface FinancialSummary {
  ventas_total: number;
  ventas_subtotal: number;
  ventas_count: number;
  compras_total: number;
  compras_count: number;
  gastos_total: number;
  gastos_count: number;
  costo_ventas: number;
  utilidad_bruta: number;
  utilidad_neta: number;
  margen_bruto_pct: number;
  margen_neto_pct: number;
  itbis_cobrado: number;
  itbis_pagado: number;
  itbis_neto: number;
  cxc_total: number;
  cxp_total: number;
  dso: number;
  dpo: number;
  period_days: number;
}

export interface MonthlySeriesPoint {
  month: string;
  ventas: number;
  compras: number;
  gastos: number;
  utilidad?: number;
}

export interface ExpenseBreakdownItem {
  category: string;
  total: number;
  count: number;
  pct?: number;
}

export interface CashFlowPoint {
  /** Fecha del bucket */
  day?: string;
  /** Compatibilidad — algunos endpoints usan 'bucket' */
  bucket?: string;
  /** Etiqueta legible */
  label?: string;
  /** Entradas (cobros) */
  entradas?: number;
  /** Salidas (pagos) */
  salidas?: number;
  /** Neto del día */
  neto?: number;
  /** Compatibilidad antigua */
  in?: number;
  out?: number;
  net?: number;
}

export interface TopProduct {
  id?: number;
  /** Nombre del item — el backend devuelve 'name' */
  name?: string;
  /** Compatibilidad */
  item_name?: string;
  category_name?: string;
  /** Cantidad vendida */
  qty?: number;
  /** Compatibilidad */
  total_quantity?: number;
  /** Ingresos generados */
  revenue?: number;
  total_revenue?: number;
  cost?: number;
  /** Utilidad neta del producto */
  profit?: number;
  margin_pct?: number;
  orders_count?: number;
}

export interface TopCustomer {
  id?: number;
  /** Nombre del cliente — el backend devuelve 'name' */
  name?: string;
  /** Compatibilidad */
  customer_name?: string;
  /** Cantidad facturada */
  total?: number;
  total_sales?: number;
  /** Número de facturas */
  invoice_count?: number;
  invoices_count?: number;
  /** % del total */
  pct?: number;
  cumulative_pct?: number;
}

export interface FinancialOverviewResponse {
  summary: FinancialSummary;
  monthly_series: MonthlySeriesPoint[];
  expense_breakdown: ExpenseBreakdownItem[];
  aging_receivable?: Record<string, number>;
  aging_payable?: Record<string, number>;
  cash_flow: CashFlowPoint[];
  cash_flow_bucket: 'day' | 'week' | 'month';
  period_span_days?: number;
  heatmap?: Array<{
    day_of_week: number;
    hour_of_day: number;
    total: number;
    invoice_count?: number;
    /** Compatibilidad — campos antiguos */
    hour?: number;
    day?: number;
    value?: number;
  }>;
  top_customers: TopCustomer[];
  top_suppliers?: unknown[];
  top_products_profit: TopProduct[];
  errors?: Record<string, string>;
}

// ────────────────────────────────────────────────────────────────────
// Sales Summary
// ────────────────────────────────────────────────────────────────────
export interface SalesSummaryCurrentPeriod {
  num_facturas: number;
  total_sales: number;
  total_cost: number;
  total_profit: number;
  total_commissions: number;
  total_box_salidas: number;
  total_real_profit: number;
  total_tips: number;
  total_taxes: number;
  total_discounts: number;
  total_shipping: number;
  total_invoiced: number;
  total_items: number;
  items_per_invoice: number;
  total_gastos: number;
  total_gastos_caja: number;
  total_gastos_factura: number;
  total_nomina: number;
  prime_cost_pct: number;
  avg_ticket: number;
  avg_tip: number;
  max_ticket: number;
  min_ticket: number;
  num_sellers: number;
  num_users: number;
  days_with_sales: number;
  avg_daily_sales: number;
  num_compras: number;
  total_compras: number;
  avg_compra: number;
  compras_vs_ventas_pct: number;
}

export interface SalesSummaryResponse {
  metadata: {
    business_unit_id: number | null;
    location_id: number | null;
    start_date: string;
    end_date: string;
    period_days: number;
    generated_at: string;
  };
  current_period: SalesSummaryCurrentPeriod;
}

export interface PaymentMethod {
  payment_type_id: number;
  payment_type_name: string;
  payment_type_icon?: string;
  payment_type_color?: string;
  payment_type_description?: string;
  num_facturas: number;
  payment_amount: number;
  payment_tip_amount: number;
  payment_tax_amount: number;
  payment_subtotal_amount: number;
  commission_percentage: number;
  commission_amount: number;
  payment_net_amount: number;
  porcentaje: number;
}

export interface PaymentsResponse {
  pagos_por_metodo: PaymentMethod[];
  credito_pendiente?: { total?: number; count?: number };
}

export interface AbcProduct {
  rank: number;
  product_id?: number;
  product_name: string;
  category_name?: string;
  quantity_sold: number;
  revenue: number;
  profit?: number;
  cumulative_pct?: number;
  abc_class?: 'A' | 'B' | 'C';
}

export interface ProductsAbcResponse {
  summary: {
    total_products?: number;
    class_a_count?: number;
    class_b_count?: number;
    class_c_count?: number;
    total_revenue?: number;
  };
  products: AbcProduct[];
}

// ────────────────────────────────────────────────────────────────────
// Trends (daily sales)
// ────────────────────────────────────────────────────────────────────
export interface DailyTrendPoint {
  date: string;
  total_sales?: number;
  num_facturas?: number;
  total_profit?: number;
  total_tips?: number;
  avg_ticket?: number;
  [key: string]: unknown;
}

export interface TrendsResponse {
  current: DailyTrendPoint[];
  previous: DailyTrendPoint[];
  purchases_current?: DailyTrendPoint[];
  purchases_previous?: DailyTrendPoint[];
}

// ────────────────────────────────────────────────────────────────────
// Losses (Cortesías + Mermas)
// ────────────────────────────────────────────────────────────────────
export interface LossesSummary {
  total_count?: number;
  total_amount?: number;
  total_cost?: number;
  pct_of_sales?: number;
  avg_amount?: number;
  [key: string]: unknown;
}

export interface LossReasonRow {
  reason?: string;
  type?: string;
  count: number;
  total: number;
  pct?: number;
  [key: string]: unknown;
}

export interface LossItemRow {
  item_name: string;
  quantity: number;
  total: number;
  [key: string]: unknown;
}

export interface LossesResponse {
  cortesias: {
    resumen?: LossesSummary;
    por_razon: LossReasonRow[];
    items_mas_cortesiados: LossItemRow[];
  };
  mermas: {
    resumen?: LossesSummary;
    por_tipo: LossReasonRow[];
    items_mas_desperdiciados: LossItemRow[];
  };
}

// ────────────────────────────────────────────────────────────────────
// Categories
// ────────────────────────────────────────────────────────────────────
export interface CategoryRow {
  category_id?: number;
  category_name: string;
  total_sales: number;
  total_quantity?: number;
  num_items?: number;
  pct?: number;
  [key: string]: unknown;
}

export type CategoriesResponse = CategoryRow[] | { categories: CategoryRow[] };

// ────────────────────────────────────────────────────────────────────
// Comparatives (vs período anterior y vs año pasado)
// ────────────────────────────────────────────────────────────────────
export interface ComparativeChange {
  sales_change?: number;
  sales_change_pct?: number;
  shipping_change?: number;
  shipping_change_pct?: number;
  profit_change?: number;
  profit_change_pct?: number;
  invoices_change?: number;
  invoices_change_pct?: number;
  purchases_change?: number;
  purchases_change_pct?: number;
  tips_change?: number;
  tips_change_pct?: number;
  [key: string]: unknown;
}

export interface ComparativesResponse {
  current?: Record<string, number>;
  previous?: Record<string, number>;
  last_year?: Record<string, number>;
  vs_previous?: ComparativeChange;
  vs_last_year?: ComparativeChange;
  [key: string]: unknown;
}

// ────────────────────────────────────────────────────────────────────
// Waiter Sales (rows YA agregadas por staff)
// ────────────────────────────────────────────────────────────────────
export interface WaiterAccountDetail {
  account_id: number;
  account_name?: string;
  table_name?: string;
  place_name?: string;
  invoice_id?: number;
  invoice_number?: string;
  invoice_ncf?: string;
  invoice_status_id?: number;
  emission_date?: string;
  subtotal_amount?: number;
  taxes_amount?: number;
  total_amount?: number;
  tip_amount?: number;
  discount_amount?: number;
  payment_type?: string;
  account_state?: string;
  is_delivery?: boolean;
  is_pickup?: boolean;
  customer_name?: string;
  has_invoice?: boolean;
  has_courtesy?: boolean;
  courtesy_amount?: number;
  courtesy_reason?: string;
  has_orders?: boolean;
  has_pending_orders?: boolean;
  pending_order_amount?: number;
  pending_orders_count?: number;
  total_account_amount?: number;
}

export interface WaiterSalesRow {
  staff_id: number;
  staff_name: string;
  staff_type?: 'waiter' | 'user' | 'unassigned' | string;
  waiter_pin?: string;
  total_accounts: number;
  total_invoices: number;
  total_courtesies?: number;
  invoiced_accounts?: number;
  courtesy_accounts?: number;
  pending_accounts?: number;
  total_subtotal: number;
  total_taxes: number;
  total_invoiced_sales: number;
  total_tips: number;
  total_discounts: number;
  total_courtesies_amount?: number;
  total_pending_orders?: number;
  total_pending_orders_count?: number;
  total_sales: number;
  average_invoice_ticket?: number;
  average_ticket?: number;
  first_account_date?: string;
  last_account_date?: string;
  currency_code?: string;
  currency_name?: string;
  accounts_details?: WaiterAccountDetail[];
}

export interface WaiterSalesSummary {
  total_staff: number;
  total_waiters: number;
  total_users: number;
  total_unassigned: number;
  total_accounts: number;
  total_invoices: number;
  total_sales?: number;
  total_tips?: number;
  [key: string]: unknown;
}

export interface WaiterSalesResponse {
  success: boolean;
  data: WaiterSalesRow[];
  summary?: WaiterSalesSummary;
}

// ────────────────────────────────────────────────────────────────────
// Tips Analysis
// ────────────────────────────────────────────────────────────────────
export interface TipsKpis {
  total_tips?: number;
  total_invoices?: number;
  invoices_with_tip?: number;
  pct_invoices_with_tip?: number;
  avg_tip_amount?: number;
  avg_tip_percentage?: number;
  max_tip?: number;
  total_sales?: number;
  tips_as_pct_of_sales?: number;
}

export interface TipsByRange {
  tip_range: string;
  count: number;
  total: number;
  pct: number;
}

export interface TipsByWaiter {
  waiter_id: number;
  waiter_name: string;
  total_tips: number;
  invoices_count: number;
  avg_tip: number;
  avg_tip_pct: number;
}

export interface TipsByShift {
  shift: string;
  total_tips: number;
  invoices_count: number;
  avg_tip: number;
}

export interface TipsByDay {
  day: string;
  day_of_week?: string;
  total_tips: number;
  invoices_count: number;
}

export interface TipsAnalysisResponse {
  metadata: {
    location_id: number | null;
    start_date: string;
    end_date: string;
    period_days: number;
    generated_at: string;
  };
  kpis_generales: TipsKpis;
  distribucion_rangos: TipsByRange[];
  tips_por_mesero: TipsByWaiter[];
  tips_por_turno: TipsByShift[];
  tips_por_dia: TipsByDay[];
}

// ────────────────────────────────────────────────────────────────────
// Profit & Loss (pl-kpis + pl-trends)
// ────────────────────────────────────────────────────────────────────
export interface PlKpisFinancial {
  ventas_brutas: number;
  descuentos: number;
  ingresos_envio: number;
  ventas_netas: number;
  itbis_cobrado: number;
  propinas: number;
  costo_ventas: number;
  ganancia_bruta: number;
  total_gastos: number;
  total_nomina: number;
  total_ocupacion: number;
  gastos_sin_nomina: number;
  cortesias_venta: number;
  mermas_costo: number;
  total_compras: number;
  num_facturas: number;
  total_comisiones: number;
  ebitda: number;
  ganancia_neta?: number;
  margen_bruto_pct?: number;
  margen_neto_pct?: number;
  margen_ebitda_pct?: number;
}

export interface PlKpisResponse {
  kpis: PlKpisFinancial;
  estado_resultados: {
    ingresos: {
      ventas_brutas: number;
      descuentos: number;
      ventas_netas: number;
      envios: number;
      itbis_cobrado: number;
      propinas: number;
      num_facturas: number;
    };
    ganancia_bruta: number;
    gastos_operativos: {
      total: number;
      nomina?: { total?: number };
    };
    perdidas: {
      cortesias?: { total?: number };
      mermas?: { total?: number };
      comisiones_pago: number;
    };
    ebitda: number;
    ganancia_neta: number;
  };
  compras: { total: number };
}

export interface PlTrendDay {
  date: string;
  ventas: number;
  gastos: number;
  utilidad: number;
}

export interface PlTrendsResponse {
  tendencia_diaria: PlTrendDay[];
  periodo_anterior?: PlKpisFinancial;
}

// ────────────────────────────────────────────────────────────────────
// Purchases & Expenses Dashboard
// ────────────────────────────────────────────────────────────────────
export interface PurchasesExpensesSummary {
  total_purchases?: number;
  total_expenses?: number;
  total_combined?: number;
  purchases_count?: number;
  expenses_count?: number;
  unclassified_expenses_total?: number;
  unclassified_pct?: number;
  total_days?: number;
  zero_egress_days?: number;
  avg_daily?: number;
}

export interface PurchasesTimePoint {
  day: string;
  purchases: number;
  expenses: number;
  purchases_count: number;
  expenses_count: number;
}

export interface ExpenseCategory {
  id?: number | null;
  code?: string;
  name: string;
  description?: string;
  is_unclassified: boolean;
  count: number;
  total: number;
  avg_amount: number;
}

export interface SupplierStat {
  id?: number;
  name: string;
  invoice_count: number;
  purchases_total: number;
  expenses_total: number;
  total: number;
}

export interface VoucherTypeStat {
  code: string;
  name: string;
  invoice_count: number;
  total: number;
}

export interface RecentInvoice {
  id: number;
  invoice_number: string;
  invoice_ncf?: string;
  emission_date: string;
  total_amount: number;
  expense_type_id?: number | null;
  expense_type_name?: string;
  entity_name?: string;
  location_name?: string;
  kind?: 'purchase' | 'expense' | string;
  needs_classification?: boolean;
}

export interface PurchasesExpensesResponse {
  summary: PurchasesExpensesSummary;
  time_series: PurchasesTimePoint[];
  expense_breakdown: ExpenseCategory[];
  top_suppliers: SupplierStat[];
  location_comparison?: Array<{
    location_id: number;
    location_name: string;
    invoice_count: number;
    purchases_total: number;
    expenses_total: number;
    total: number;
  }>;
  voucher_types: VoucherTypeStat[];
  recent: RecentInvoice[];
  errors?: Record<string, string>;
}

// ────────────────────────────────────────────────────────────────────
// Boxes (cajas)
// ────────────────────────────────────────────────────────────────────
export interface BoxAmount {
  currency_id: number;
  currency_code: string;
  amount_opened: number;
  is_closed: boolean;
  amount_closed: number | null;
}

export interface BoxEntry {
  box_entry_id: number;
  box_id: number;
  box_name: string;
  shift_code?: string;
  user_id: number;
  use_fullname: string;
  authorized_by?: string;
  open_at: string;
  close_at: string | null;
  is_open: boolean;
  boxe_entry_type_id: number;
  status: string;
  amounts: BoxAmount[] | null;
}

export interface BoxPaymentBreakdown {
  payment_type_id?: number;
  payment_type_name?: string;
  amount?: number;
  count?: number;
  currency_code?: string;
  [key: string]: unknown;
}

/** Una factura individual emitida durante el turno de caja. */
export interface BoxInvoice {
  invoice_id: number;
  invoice_number?: string;
  invoice_ncf?: string;
  emission_date?: string;
  total_amount: number;
  subtotal_amount?: number;
  taxes_amount?: number;
  invoice_tip?: number;
  discount_amount?: number;
  currency_code?: string;
  customer_name?: string;
  waiter_name?: string;
  table_name?: string;
  payment_type?: string;
  status_id?: number;
  status_name?: string;
  invoice_payments?: Array<{
    payment_type_name: string;
    amount: number;
    currency_code?: string;
  }>;
  [key: string]: unknown;
}

/** Balance/operación de una caja agrupada por moneda de salida. */
export interface BoxSalesDay {
  out_currency_id: number;
  out_currency: string;
  box_balance?: {
    initial_amount: number;
    closed_amount: number;
    sales_cash_income?: number;
    sales_card_income?: number;
    sales_credit_income?: number;
    expenses_total?: number;
    movements_total?: number;
    courtesy_total?: number;
    change_total?: number;
    [key: string]: unknown;
  };
  sales?: Array<{
    payment_type_name: string;
    payment_type_id?: number;
    invoice_total?: number;
    amount_received?: number;
    payment_currency?: string;
    count?: number;
    [key: string]: unknown;
  }>;
  movements?: Array<{
    id?: number;
    movement_type: string;
    amount: number;
    note?: string;
    created_at?: string;
    [key: string]: unknown;
  }>;
  courtesies?: Array<{
    id?: number;
    total_sale_price: number;
    utility_lost?: number;
    reason?: string;
    [key: string]: unknown;
  }>;
  changes?: Array<{
    amount_received: number;
    amount_back: number;
    change_amount_given?: number;
    invoice_total?: number;
    payment_currency?: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}
