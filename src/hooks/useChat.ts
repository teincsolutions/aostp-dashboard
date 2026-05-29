import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import {
  getConversations,
  getConversationMessages,
  getUnreadCount,
  getSignedMediaUrls,
  sendMessage as sendMessageApi,
} from "@/services/chatService";
import type {
  ChatMessage,
  SendMessagePayload,
  WebSocketMessage,
} from "@/types/chat";

const MESSAGES_PER_PAGE = 50;

export function useConversations(params?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: ["chatConversations", params],
    queryFn: () => getConversations(params),
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useMessages(conversationId: string | null) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const query = useQuery({
    queryKey: ["chatMessages", conversationId, page],
    queryFn: () =>
      getConversationMessages(conversationId!, {
        page,
        limit: MESSAGES_PER_PAGE,
      }),
    enabled: !!conversationId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    if (!query.data) return;
    const newMsgs = [...query.data.messages].reverse();
    if (page === 1) {
      setAllMessages(newMsgs);
    } else {
      setAllMessages((prev) => [...newMsgs, ...prev]);
    }
    setHasMore(query.data.page < query.data.totalPages);
  }, [query.data, page]);

  useEffect(() => {
    setPage(1);
    setAllMessages([]);
    setHasMore(true);
  }, [conversationId]);

  useEffect(() => {
    if (query.data) {
      queryClient.invalidateQueries({ queryKey: ["chatConversations"] });
    }
  }, [query.data, queryClient]);

  const loadMore = useCallback(() => {
    if (!hasMore || query.isFetching) return;
    setPage((p) => p + 1);
  }, [hasMore, query.isFetching]);

  return {
    messages: allMessages,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    hasMore,
    loadMore,
    page,
    refetch: query.refetch,
  };
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

export function useUnreadCount() {
  return useQuery({
    queryKey: ["chatUnreadCount"],
    queryFn: getUnreadCount,
    refetchInterval: 30_000,
    staleTime: 10_000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useUnreadCountSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3000";

    const socket = io(wsUrl + "/chat", {
      transports: ["websocket", "polling"],
    });

    socket.on("unread-count", (data: { total: number }) => {
      queryClient.setQueryData(["chatUnreadCount"], { total: data.total });
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);
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

    socket.on("new-message", (message: WebSocketMessage) => {
      queryClient.invalidateQueries({ queryKey: ["chatMessages"] });
      queryClient.invalidateQueries({ queryKey: ["chatConversations"] });
    });

    socket.on("unread-count", (data: { total: number }) => {
      queryClient.setQueryData(["chatUnreadCount"], { total: data.total });
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  return socketRef;
}

export function useSignedMediaUrls(
  items: { key: string; bucket?: string }[],
) {
  const keyString = JSON.stringify(items);
  return useQuery({
    queryKey: ["signedMediaUrls", keyString],
    queryFn: () => getSignedMediaUrls(items),
    enabled: items.length > 0,
    staleTime: 25 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
