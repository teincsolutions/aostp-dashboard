import { apiService } from "@/services/api";
import type {
  PaginatedConversations,
  PaginatedMessages,
  SendMessagePayload,
  SendMessageResponse,
} from "@/types/chat";

export const getConversations = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<PaginatedConversations> => {
  const res = await apiService.get<PaginatedConversations>("/chat/conversations", {
    params,
  });
  return res.data;
};

export const getConversationMessages = async (
  conversationId: string,
  params?: {
    page?: number;
    limit?: number;
  },
): Promise<PaginatedMessages> => {
  const res = await apiService.get<PaginatedMessages>(
    `/chat/conversations/${conversationId}/messages`,
    { params },
  );
  return res.data;
};

export const sendMessage = async (
  payload: SendMessagePayload,
): Promise<SendMessageResponse> => {
  const res = await apiService.post<SendMessageResponse>("/chat/send", payload);
  return res.data;
};

export const getUnreadCount = async (): Promise<{ total: number }> => {
  const res = await apiService.get<{ total: number }>("/chat/unread-count");
  return res.data;
};

export const uploadChatMedia = async (
  file: File,
): Promise<{ url: string; key: string; bucket: string; size: number }> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", "chat-media");
  const res = await apiService.post<{
    url: string;
    key: string;
    bucket: string;
    size: number;
  }>("/uploads/generic", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};
