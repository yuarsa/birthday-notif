export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T | T[];
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error: {
    code: string;
    details?: string;
    trace_id?: string;
    errors?: ValidationError[];
  };
}

export interface ValidationError {
  field: string;
  message: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
