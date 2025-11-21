// src/types/user.ts

import { UserRole } from "./common";
import { Warehouse } from "./warehouse";

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
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  warehouse: Warehouse | null;
  warehouseId: string | null;
  isActive: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
}

export interface UserCreatePayload {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone?: string;
  password?: string; // Optional for API if generated
  role: UserRole;
  warehouseId?: string;
  isActive: boolean;
  force2FA: boolean;
}

export interface UserUpdatePayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  status?: UserStatus;
  twoFactorEnabled?: boolean;
  warehouseId?: string;
}
