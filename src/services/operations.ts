import { api } from '@services/apiClient';
import type {
  InventoryItem,
  Warehouse,
  EmployeeBasic,
  EmployeeDetail,
} from '@/types/operations';

// ── INVENTORY (multi-warehouse) ─────────────────────────────────
export const fetchWarehousesByLocation = async (params: {
  locationId: number;
  businessUnitId?: number;
}): Promise<Warehouse[]> => {
  const { data } = await api.post<
    | Warehouse[]
    | { success?: boolean; data?: Warehouse[]; warehouses?: Warehouse[] }
  >('/api/restaurant/warehouse/get-warehouse-by-location', params);
  if (Array.isArray(data)) return data;
  return data.data ?? data.warehouses ?? [];
};

interface MultiWarehouseRaw {
  success?: boolean;
  data?: unknown[];
  stats?: Record<string, unknown>;
  filters?: Record<string, unknown>;
}

/**
 * Trae inventario por almacén. El backend tiene un bug: cuando no se envía
 * warehouse_ids, el SQL falla por referencia a $5. Solución: SIEMPRE enviar
 * warehouse_ids con al menos un valor real (todos los IDs si "Todos").
 */
export const fetchMultiWarehouseInventory = async (params: {
  location_id: number;
  warehouse_ids: number[]; // REQUERIDO siempre — no null
  business_unit_id?: number | null;
  catalogue_id?: number | null;
  date?: string;
  include_stock_levels?: boolean;
}): Promise<MultiWarehouseRaw> => {
  const { data } = await api.post<MultiWarehouseRaw>(
    '/api/restaurant/inventory/get-multi-warehouse-inventory',
    {
      include_stock_levels: true,
      date: new Date().toISOString().split('T')[0],
      ...params,
    },
  );
  return data;
};

// ── EMPLOYEES (HR endpoint — más completo y estable) ────────────
interface HrEmployeeRaw {
  id: number;
  employee_code?: string;
  employee_fullname?: string;
  full_name?: string;
  department_id?: number;
  department_name?: string;
  job_title_id?: number;
  job_title_name?: string;
  monthly_salary?: number;
  employee_status_id?: number;
  employee_status_name?: string;
  hire_date?: string;
  business_unit_id?: number;
  business_unit_name?: string;
  location_id?: number;
  location_name?: string;
  photo?: string;
  [key: string]: unknown;
}

export const fetchBasicEmployees = async (params: {
  business_unit_id?: number;
  location_id?: number;
  search?: string;
}): Promise<EmployeeBasic[]> => {
  const qs = new URLSearchParams();
  if (params.location_id) qs.set('location_id', String(params.location_id));
  if (params.business_unit_id) qs.set('business_unit_id', String(params.business_unit_id));
  if (params.search) qs.set('search', params.search);
  qs.set('include_inactive', 'false');

  const { data } = await api.get<HrEmployeeRaw[] | { employees?: HrEmployeeRaw[]; data?: HrEmployeeRaw[] }>(
    `/api/hr/employees?${qs.toString()}`,
  );

  const list: HrEmployeeRaw[] = Array.isArray(data)
    ? data
    : (data.employees ?? data.data ?? []);

  return list.map((e) => ({
    id: e.id,
    employee_code: e.employee_code,
    full_name: (e.employee_fullname ?? e.full_name ?? '—').replace(/\s+/g, ' ').trim(),
    photo: e.photo,
    status_id: e.employee_status_id,
    department_name: e.department_name,
    department_id: e.department_id,
    job_title_name: e.job_title_name,
    job_title_id: e.job_title_id,
    monthly_salary: e.monthly_salary,
    hire_date: e.hire_date,
    employee_status_name: e.employee_status_name,
    business_unit_name: e.business_unit_name,
    business_unit_id: e.business_unit_id,
    location_name: e.location_name,
    location_id: e.location_id,
  }));
};

export const fetchEmployeeDetail = async (id: number): Promise<EmployeeDetail> => {
  const { data } = await api.get<EmployeeDetail>(`/api/hr/employees/${id}`);
  return data;
};

// ── ACCOUNTS RECEIVABLE ─────────────────────────────────────────
export const fetchARSummary = async (params: {
  location_id: number;
  start_date: string;
  end_date: string;
}) => {
  const { data } = await api.post('/api/restaurant/transactions/accounts-receivable', {
    dateRange: { start_date: params.start_date, end_date: params.end_date },
    reportType: 'summary',
    location_id: params.location_id,
  });
  return data;
};

export const fetchARAging = async (params: {
  location_id: number;
  start_date: string;
  end_date: string;
}) => {
  const { data } = await api.post('/api/restaurant/transactions/accounts-receivable', {
    dateRange: { start_date: params.start_date, end_date: params.end_date },
    reportType: 'aging',
    location_id: params.location_id,
  });
  return data;
};

// ── SHIFT CALENDAR ──────────────────────────────────────────────
export interface ShiftEmployee {
  employee_id: number;
  employee_code?: string;
  employee_name: string;
  default_shift_id?: number;
  default_shift_name?: string;
  default_shift_type?: string;
  default_is_night?: boolean;
  pay_group_id?: number;
  [key: string]: unknown;
}

export interface ShiftCalendarResponse {
  employees: ShiftEmployee[];
  assignments?: Array<{
    employee_id: number;
    date: string;
    shift_id?: number;
    shift_name?: string;
  }>;
}

export const fetchShiftCalendar = async (params: {
  startDate: string;
  endDate: string;
  pay_group_id?: number;
}): Promise<ShiftCalendarResponse> => {
  const qs = new URLSearchParams();
  qs.set('startDate', params.startDate);
  qs.set('endDate', params.endDate);
  if (params.pay_group_id) qs.set('pay_group_id', String(params.pay_group_id));
  const { data } = await api.get<ShiftCalendarResponse | { employees?: ShiftEmployee[] }>(
    `/api/hr/shift-calendar?${qs.toString()}`,
  );
  // Defensive: backend puede devolver array directo o {employees}
  if (Array.isArray(data)) {
    return { employees: data as ShiftEmployee[] };
  }
  return {
    employees: (data as ShiftCalendarResponse).employees ?? [],
    assignments: (data as ShiftCalendarResponse).assignments,
  };
};
