"use client";
import { Input, Badge, List, Typography, Spin } from "antd";
import { SearchOutlined, UserOutlined } from "@ant-design/icons";
import { useConversations } from "@/hooks/useChat";
import { useChatStore } from "@/store/chatStore";
import type { ChatConversation } from "@/types/chat";

const { Text } = Typography;

export default function ConversationList() {
  const { searchQuery, setSearchQuery, activeConversationId, setActiveConversationId } = useChatStore();
  const { data, isLoading } = useConversations({ search: searchQuery || undefined });

  return (
    <div className="flex flex-col h-full border-r border-gray-200">
      <div className="p-3 border-b border-gray-200">
        <Input
          prefix={<SearchOutlined />}
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          allowClear
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spin />
          </div>
        ) : (
          <List
            dataSource={data?.conversations || []}
            locale={{ emptyText: "No conversations found" }}
            renderItem={(conv: ChatConversation) => (
              <div
                onClick={() => setActiveConversationId(conv.conversationId)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                  activeConversationId === conv.conversationId ? "bg-blue-50 border-r-2 border-blue-500" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <UserOutlined className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <Text strong className="truncate">
                      {conv.customerName || conv.phoneNumber}
                    </Text>
                    {conv.lastMessageAt && (
                      <Text type="secondary" className="text-xs flex-shrink-0 ml-2">
                        {new Date(conv.lastMessageAt).toLocaleDateString()}
                      </Text>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <Text type="secondary" className="text-sm truncate">
                      {conv.lastMessage || "No messages yet"}
                    </Text>
                    {conv.unreadCount > 0 && (
                      <Badge
                        count={conv.unreadCount}
                        size="small"
                        className="flex-shrink-0 ml-2"
                      />
                    )}
                  </div>
                  {conv.customerCode && (
                    <Text type="secondary" className="text-xs">
                      Code: {conv.customerCode}
                    </Text>
                  )}
                </div>
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
}
