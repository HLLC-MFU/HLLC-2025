export interface Province {
  id: number;
  name_th: string;
  name_en: string;
  geography_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: null;
}

export interface ApiError {
  message: string;
  statusCode?: number;
}

export interface RegisterData {
  username: string;
  password: string;
  confirmPassword: string;
  secret: string;
} 