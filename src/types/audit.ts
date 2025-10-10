// Audit log types for AOSTP Logistics Management Admin Dashboard

export enum AuditAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  STATUS_CHANGE = "STATUS_CHANGE",
  EXPORT = "EXPORT",
}

export enum AuditEntityType {
  USER = "User",
  CUSTOMER = "Customer",
  PACKAGE = "Package",
  CONTAINER = "Container",
  INVOICE = "Invoice",
  PAYMENT = "Payment",
  NOTIFICATION = "Notification",
  EXCHANGE_RATE = "ExchangeRate",
  WAREHOUSE = "Warehouse",
  SHIPPING_RATE = "ShippingRate",
  PACKING_LIST = "PackingList",
  PACKAGE_DELIVERY = "PackageDelivery",
  OTHER = "Other",
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
