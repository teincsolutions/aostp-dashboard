import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import {
  getConversations,
  getConversationMessages,
  sendMessage as sendMessageApi,
} from "@/services/chatService";
import type {
  SendMessagePayload,
  WebSocketMessage,
} from "@/types/chat";

export function useConversations(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: ["chatConversations", params],
    queryFn: () => getConversations(params),
  });
}

export function useMessages(
  conversationId: string | null,
  params?: { page?: number; limit?: number },
) {
  return useQuery({
    queryKey: ["chatMessages", conversationId, params],
    queryFn: () => getConversationMessages(conversationId!, params),
    enabled: !!conversationId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendMessagePayload) => sendMessageApi(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["chatMessages", data.conversationId],
      });
      queryClient.invalidateQueries({ queryKey: ["chatConversations"] });
    },
  });
}

export function useChatSocket(conversationId: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3000";

    const socket = io(wsUrl + "/chat", {
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.debug("Chat WebSocket connected");
    });

    socket.on("new-message", (message: WebSocketMessage) => {
      queryClient.invalidateQueries({ queryKey: ["chatMessages"] });
      queryClient.invalidateQueries({ queryKey: ["chatConversations"] });
    });

    socket.on("disconnect", () => {
      console.debug("Chat WebSocket disconnected");
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  return socketRef;
}
