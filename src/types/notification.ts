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

// Notification type enum (based on sample data)
export enum NotificationType {
  PACKAGE_INTAKE = "PACKAGE_INTAKE",
  // Add other types as needed
}

// Notification metadata interface
export interface NotificationMetadata {
  packageId?: string;
  trackingCode?: string;
  [key: string]: unknown;
}

// Notification log interface
export interface NotificationLog {
  id: string;
  customerId: string;
  type: NotificationType;
  channel: NotificationChannel;
  recipient: string;
  subject: string;
  content: string;
  status: NotificationStatus;
  sentAt: string;
  failReason?: string;
  metadata: NotificationMetadata;
  createdAt: string;
}
