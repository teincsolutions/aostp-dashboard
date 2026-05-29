export interface ChatMessage {
  id: string;
  conversationId: string;
  fromNumber: string;
  toNumber: string;
  direction: 'INBOUND' | 'OUTBOUND';
  messageType: string;
  text: string | null;
  content?: Record<string, unknown>;
  status: string;
  waMessageId: string | null;
  readAt: string | null;
  createdAt: string;
  repliedBy: { id: string; firstName: string; lastName: string } | null;
}

export type SendMessageResponse = ChatMessage;

export interface ChatConversation {
  conversationId: string;
  phoneNumber: string;
  customerName: string | null;
  customerCode: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  lastDirection: string | null;
  unreadCount: number;
}

export interface PaginatedConversations {
  conversations: ChatConversation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedMessages {
  messages: ChatMessage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SendMessagePayload {
  to: string;
  text?: string;
  type?: 'text' | 'image' | 'document' | 'audio' | 'video';
  mediaUrl?: string;
  filename?: string;
  key?: string;
  bucket?: string;
}

export interface WebSocketMessage {
  id: string;
  conversationId: string;
  fromNumber: string;
  toNumber: string;
  direction: 'INBOUND' | 'OUTBOUND';
  text: string | null;
  content?: Record<string, unknown>;
  messageType: string;
  status: string;
  createdAt: string;
  repliedBy: { id: string; firstName: string; lastName: string } | null;
}
