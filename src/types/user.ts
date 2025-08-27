// src/types/user.ts

export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  FINANCE_MANAGER = "FINANCE_MANAGER",
  OPERATIONS_CLERK = "OPERATIONS_CLERK",
  PAYMENT_CLERK = "PAYMENT_CLERK",
  CUSTOMER = "CUSTOMER",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export interface User {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  status: UserStatus;
  createdAt: string;
  twoFactorEnabled?: boolean;
  avatarUrl?: string; // Profile picture URL
}

export interface UserCreatePayload {
  email: string;
  name: string;
  password: string;
  roles: Role[];
  status?: UserStatus;
  twoFactorEnabled?: boolean;
}

export interface UserUpdatePayload {
  email?: string;
  name?: string;
  password?: string;
  roles?: Role[];
  status?: UserStatus;
  twoFactorEnabled?: boolean;
}
