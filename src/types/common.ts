// Common types used throughout the application

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface PaginationMeta {
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  pageSize?: number;
  total?: number;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

export type UserRole =
  | "SUPER_ADMIN"
  | "FINANCE_MANAGER"
  | "PAYMENT_CLERK"
  | "OPERATIONS_CLERK"
  | "CUSTOMER";

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  avatar: string;
  twoFactorEnabled?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
  requiresTwoFactor?: boolean;
}

export interface TwoFactorLoginRequest {
  email: string;
  password: string;
  token: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface TwoFactorVerifyRequest {
  token: string;
}

export interface TwoFactorDisableRequest {
  token: string;
}

export interface MenuItem {
  key: string;
  label: string;
  icon?: React.ComponentType;
  path?: string;
  children?: MenuItem[];
}

// Generic table column type
export interface TableColumn<T = Record<string, unknown>> {
  title: string;
  dataIndex: keyof T;
  key: string;
  sorter?: boolean;
  render?: (value: unknown, record: T) => React.ReactNode;
}
