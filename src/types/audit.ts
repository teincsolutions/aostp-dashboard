// Audit log types for AOSTP Logistics Management Admin Dashboard

export enum AuditAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  STATUS_CHANGE = "STATUS_CHANGE",
  EXPORT = "EXPORT",
}

export enum AuditEntityType {
  USER = "USER",
  CUSTOMER = "CUSTOMER",
  PACKAGE = "PACKAGE",
  CONTAINER = "CONTAINER",
  INVOICE = "INVOICE",
  PAYMENT = "PAYMENT",
  NOTIFICATION = "NOTIFICATION",
  EXCHANGE_RATE = "EXCHANGE_RATE",
  SHIPPING_RATE = "SHIPPING_RATE",
  OTHER = "OTHER",
}

export interface AuditLog {
  id: string;
  timestamp: string; // ISO date string
  actor: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
}
