export interface ApiSuccess<T> {
  success: true;
  message?: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  statusCode?: number;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface ReportQueryBody {
  business_unit_id: number;
  start_date: string;
  end_date: string;
  location_id?: number;
  location_ids?: number[];
}
