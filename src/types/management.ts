// ────────────────────────────────────────────────────────────────────
// Meseros
// ────────────────────────────────────────────────────────────────────
export interface Waiter {
  id: number;
  name: string;
  pin?: string;
  status_id?: number;
  location_id?: number;
}

// ────────────────────────────────────────────────────────────────────
// Mesas / Áreas
// ────────────────────────────────────────────────────────────────────
export interface Place {
  place_id: number;
  place_name: string;
  is_visible?: boolean;
  use_map_view?: boolean;
  map_width?: number;
  map_height?: number;
  map_background_url?: string;
}

export interface RestaurantTable {
  id: number;
  table_name: string;
  table_state_id?: number;
  table_type_id?: number;
  table_type_name?: string;
  place_name?: string;
  place_id?: number;
  chairs?: number;
  pos_x?: number;
  pos_y?: number;
  width?: number;
  height?: number;
  shape?: string;
  rotation?: number;
  public_token?: string;
  qr_label?: string;
}

// ────────────────────────────────────────────────────────────────────
// Facturas / Ventas
// ────────────────────────────────────────────────────────────────────
export interface InvoiceItem {
  id?: number;
  item_id?: number;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  tax_type_id?: number;
  tax_amount?: number;
  discount_amount?: number;
  tax_type_name?: string;
  tax_percentage?: number;
}

export interface InvoiceSearchResult {
  id: number;
  invoice_id?: number;
  invoice_number: string;
  invoice_ncf?: string;
  emission_date?: string;
  total_amount: number;
  subtotal_amount?: number;
  taxes_amount?: number;
  invoice_tip?: number;
  discount_amount?: number;
  status_id?: number;
  status_name?: string;
  entity_id?: number;
  customer_name?: string;
  client_name?: string;
  client_rnc?: string;
  client_address?: string;
  client_phone?: string;
  client_email?: string;
  payment_type?: string;
  location_id?: number;
  location_name?: string;
  location_description?: string;
  currency_id?: number;
  currency_code?: string;
  invoice_type_id?: number;
  items?: InvoiceItem[];
}

export interface InvoicePagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface InvoiceSearchResponse {
  success?: boolean;
  data?: InvoiceSearchResult[];
  invoices?: InvoiceSearchResult[];
  total?: number;
  pagination?: InvoicePagination;
}
