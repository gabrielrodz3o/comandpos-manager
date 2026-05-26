// ────────────────────────────────────────────────────────────────────
// Inventario — Multi-warehouse
// ────────────────────────────────────────────────────────────────────
export type StockStatus =
  | 'SIN_STOCK'
  | 'CRITICAL'
  | 'LOW'
  | 'OK'
  | 'EXCESS'
  | 'NOT_CONFIGURED';

export interface InventoryItem {
  item_id: number;
  item_name: string;
  unit_quantity?: number;
  unit_name?: string;
  unit_abbreviation?: string;
  item_type_name?: string;
  /** Total acumulado en todos los almacenes (o filtrados) */
  quantity: number;
  cost_price?: number;
  sale_price?: number;
  category_name?: string;
  /** Almacenes donde existe — para mostrar detalle expandible */
  warehouses: Array<{
    warehouse_id: number;
    warehouse_name: string;
    is_general?: boolean;
    quantity: number;
    min_quantity?: number | null;
    max_quantity?: number | null;
    reorder_point?: number | null;
    reorder_quantity?: number | null;
    stock_status?: StockStatus;
  }>;
  /** Status global (peor de todos sus almacenes) */
  stock_status?: StockStatus;
  /** # de almacenes donde aparece */
  warehouses_count: number;
}

export interface Warehouse {
  id: number;
  name: string;
  is_general?: boolean;
  location_id?: number;
}

// ────────────────────────────────────────────────────────────────────
// Empleados (versión simple)
// ────────────────────────────────────────────────────────────────────
export interface EmployeeBasic {
  id: number;
  employee_code?: string;
  full_name: string;
  firstname?: string;
  lastname?: string;
  photo?: string;
  status_id?: number;
  department_name?: string;
  department_id?: number;
  job_title_name?: string;
  job_title_id?: number;
  monthly_salary?: number;
  hire_date?: string;
  employee_status_name?: string;
  business_unit_name?: string;
  business_unit_id?: number;
  location_name?: string;
  location_id?: number;
}

export interface EmployeeDetail {
  id: number;
  employee_code?: string;
  nss?: string;
  fecha_afiliacion_tss?: string;
  status_id?: number;
  person_id?: number;
  firstname?: string;
  middle_name?: string;
  lastname?: string;
  second_last_name?: string;
  fullname?: string;
  birthdate?: string;
  photo?: string;
  gender?: string;
  nationality?: string;
  marital_status?: string;
  religion?: string;
  company_name?: string;
  business_unit_name?: string;
  location_name?: string;
  department_name?: string;
  job_title_name?: string;
  employee_type_name?: string;
  employee_category_name?: string;
  employee_status_name?: string;
  shift_name?: string;
  monthly_salary?: number;
  pay_group_name?: string;
  pay_frequency_name?: string;
  action_date?: string;
  hire_date?: string;
  original_hire_date?: string | null;
  termination_date?: string | null;
  is_terminated?: boolean;
  [key: string]: unknown;
}

// ────────────────────────────────────────────────────────────────────
// Cuentas por Cobrar — aging
// ────────────────────────────────────────────────────────────────────
export interface ARSummary {
  total_collected?: number;
  paid_invoices?: number;
  total_pending?: number;
  pending_invoices?: number;
  avg_collection_days?: number;
}

export interface ARAgingInvoice {
  invoice_id?: number;
  invoice_number?: string;
  invoice_ncf?: string;
  emission_date?: string;
  customer_name?: string;
  total_amount?: number;
  paid_amount?: number;
  pending_amount?: number;
  days_overdue?: number;
  aging_bucket?: string;
  [key: string]: unknown;
}
