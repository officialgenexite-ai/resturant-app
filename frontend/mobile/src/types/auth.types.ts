export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  isEmailVerified?: boolean;
  role?: "customer" | "admin";
}

export interface AuthResponseData {
  user: User;
  token: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string> | null;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone: string;
  address?: string;
}

export interface VerifyEmailPayload {
  email: string;
  code: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
export interface ResendVerificationPayload {
  email: string;
}
