"use client";
import { useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import ConversationList from "@/app/chat/components/ConversationList";
import MessageArea from "@/app/chat/components/MessageArea";
import { useConversations } from "@/hooks/useChat";
import { useChatStore } from "@/store/chatStore";

const AUTHORIZED_ROLES = ["SUPER_ADMIN", "FINANCE_MANAGER", "OPERATIONS_CLERK"];

export default function ChatPage() {
  const { data: convData } = useConversations();
  const activeConversationId = useChatStore((s) => s.activeConversationId);

  const activeConversation = useMemo(() => {
    if (!activeConversationId || !convData?.conversations) return null;
    return (
      convData.conversations.find(
        (c) => c.conversationId === activeConversationId,
      ) || null
    );
  }, [activeConversationId, convData?.conversations]);

  return (
    <AuthGuard requiredRoles={AUTHORIZED_ROLES}>
      <AppLayout>
        <div className="h-[calc(100vh-8rem)] flex rounded-lg overflow-hidden border border-gray-200 bg-white">
          <div className="w-80 flex-shrink-0">
            <ConversationList />
          </div>
          <div className="flex-1">
            <MessageArea conversation={activeConversation} />
          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
