import { apiService } from "@/services/api";
import { NotificationLog, NotificationChannel, NotificationStatus } from "@/types/notification";

export interface NotificationQueryParams {
  page?: number;
  limit?: number;
  channel?: NotificationChannel;
  status?: NotificationStatus;
  dateFrom?: string;
  dateTo?: string;
  customerId?: string;
  recipient?: string;
  search?: string;
}

export const getNotifications = async (params: NotificationQueryParams) => {
  const res = await apiService.get<{ data: NotificationLog[]; total: number }>("/notifications", { params });
  return res.data;
};

export const getCustomerNotifications = async (
  customerId: string,
  params: Omit<NotificationQueryParams, "customerId">
) => {
  const res = await apiService.get<{ data: NotificationLog[]; total: number }>(
    `/notifications/customer/${customerId}`,
    { params }
  );
  return res.data;
};

export const retryNotification = async (id: string) => {
  const res = await apiService.post(`/notifications/${id}/retry`);
  return res.data;
};

export const retryFailedNotifications = async () => {
  const res = await apiService.post("/notifications/retry-failed");
  return res.data;
};
