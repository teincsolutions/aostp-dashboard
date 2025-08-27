import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  getCustomerNotifications,
  retryNotification,
  retryFailedNotifications,
  NotificationQueryParams,
} from "@/services/notificationService";
import { NotificationLog } from "@/types/notification";

// Query: notifications list
export function useNotifications(params: NotificationQueryParams) {
  return useQuery({
    queryKey: ["notifications", params],
    queryFn: () => getNotifications(params),
  });
}

// Query: customer notifications
export function useCustomerNotifications(customerId: string, params: Omit<NotificationQueryParams, "customerId">) {
  return useQuery({
    queryKey: ["customerNotifications", customerId, params],
    queryFn: () => getCustomerNotifications(customerId, params),
    enabled: !!customerId,
  });
}

// Mutation: retry single notification
export function useRetryNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => retryNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["customerNotifications"] });
    },
  });
}

// Mutation: bulk retry failed notifications (last 24h)
export function useRetryFailedNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => retryFailedNotifications(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["customerNotifications"] });
    },
  });
}
