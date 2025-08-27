// Notification channel enum
export enum NotificationChannel {
  EMAIL = "EMAIL",
  SMS = "SMS",
  WHATSAPP = "WHATSAPP",
}

// Notification status enum
export enum NotificationStatus {
  SENT = "SENT",
  FAILED = "FAILED",
  PENDING = "PENDING",
}

// Notification log interface
export interface NotificationLog {
  id: string;
  channel: NotificationChannel;
  recipient: string;
  customerId: string;
  customerName?: string;
  template: string;
  event: string;
  status: NotificationStatus;
  errorMessage?: string;
  createdAt: string;
  payload: Record<string, unknown>;
}
