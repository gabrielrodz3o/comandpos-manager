// ────────────────────────────────────────────────────────────────────
// Vacaciones
// ────────────────────────────────────────────────────────────────────
export type VacationStatus = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | string;

export interface VacationRequest {
  id: number;
  employee_id: number;
  employee_code?: string;
  employee_name: string;
  department_name?: string;
  period_year?: number;
  days_earned?: number;
  days_taken?: number;
  days_balance?: number;
  start_date: string;
  end_date: string;
  status: VacationStatus;
  approved_by?: number | null;
  approved_by_name?: string | null;
  created_at?: string;
  notes?: string | null;
}

// ────────────────────────────────────────────────────────────────────
// Sugerencias automáticas de compra (auto_purchase_suggestions)
// ────────────────────────────────────────────────────────────────────
export type SuggestionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | string;

/** Urgencia: 1 = más urgente, 5 = menos urgente. */
export type UrgencyLevel = 1 | 2 | 3 | 4 | 5;

export interface PurchaseSuggestion {
  id: number;
  item_id: number;
  item_name: string;
  unit_quantity?: number;
  current_stock?: number;
  original_stock_at_creation?: number;
  min_level?: number;
  max_quantity?: number;
  configured_reorder_point?: number;
  configured_safety_stock?: number;
  configured_lead_time_days?: number;
  suggested_quantity: number;
  suggested_price: number;
  base_cost_price?: number;
  estimated_stockout_date?: string;
  urgency_level: UrgencyLevel;
  reason?: string;
  status: SuggestionStatus;
  created_at?: string;
  expires_at?: string;
  suggested_supplier_id?: number | null;
  suggested_supplier_name?: string;
  location_id?: number;
  location_name?: string;
  warehouse_id?: number;
  warehouse_name?: string;
  anomaly_flags?: string[] | string | null;
  estimated_total?: number;
}
