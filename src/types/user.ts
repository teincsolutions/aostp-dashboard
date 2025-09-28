// src/types/user.ts

import { UserRole } from "./common";

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
  firstName: string;
  lastName: string;
  name?: string; // computed
  email: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
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
