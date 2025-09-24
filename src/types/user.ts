// src/types/user.ts

import { UserRole } from "./common";

export enum Role {
  SUPER_ADMIN = "SUPER ADMIN",
  FINANCE_MANAGER = "FINANCE MANAGER",
  OPERATIONS_CLERK = "OPERATIONS CLERK",
  PAYMENT_CLERK = "PAYMENT CLERK",
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
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  twoFactorEnabled?: boolean;
  avatarUrl?: string; // Profile picture URL
}

export interface UserCreatePayload {
  email: string;
  name: string;
  password: string;
  role: UserRole;
  status?: UserStatus;
  twoFactorEnabled?: boolean;
}

export interface UserUpdatePayload {
  email?: string;
  name?: string;
  password?: string;
  role?: UserRole;
  status?: UserStatus;
  twoFactorEnabled?: boolean;
}
