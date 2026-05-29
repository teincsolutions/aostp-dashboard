"use client";
import { useState, useRef, useEffect } from "react";
import {
  Input,
  Button,
  Spin,
  Typography,
  Upload,
  Space,
  Tooltip,
  Tag,
} from "antd";
import {
  SendOutlined,
  PaperClipOutlined,
  PictureOutlined,
  AudioOutlined,
  VideoCameraOutlined,
  UserOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import { useMessages, useSendMessage, useChatSocket } from "@/hooks/useChat";
import { useChatStore } from "@/store/chatStore";
import { uploadChatMedia } from "@/services/chatService";
import { toast } from "sonner";
import type { ChatMessage, ChatConversation } from "@/types/chat";

const { Text } = Typography;
const { TextArea } = Input;

interface MessageAreaProps {
  conversation: ChatConversation | null;
}

interface PendingMedia {
  id: string;
  type: string;
  mediaUrl: string;
  filename: string;
  blobUrl?: string;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) {
    return formatTime(dateStr);
  }
  if (d.toDateString() === yesterday.toDateString()) {
    return `Yesterday ${formatTime(dateStr)}`;
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + formatTime(dateStr);
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isInbound = message.direction === "INBOUND";
  const mediaUrl = message.content?.mediaUrl as string | undefined;
  const filename = message.content?.filename as string | undefined;
  const isSystem = !isInbound && !message.repliedBy;
  const senderName = message.repliedBy
    ? `${message.repliedBy.firstName}${message.repliedBy.lastName ? ` ${message.repliedBy.lastName}` : ""}`
    : "System";

  return (
    <div className={`flex flex-col ${isInbound ? "items-start" : "items-end"} mb-3`}>
      {!isInbound && (
        <div className="flex items-center gap-1 mb-0.5 px-1">
          {isSystem ? (
            <RobotOutlined className="text-gray-400 text-xs" />
          ) : (
            <UserOutlined className="text-blue-400 text-xs" />
          )}
          <Text type="secondary" className="text-xs">{senderName}</Text>
        </div>
      )}
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isInbound
            ? "bg-gray-100 text-gray-900"
            : "bg-blue-500 text-white"
        }`}
      >
        {message.messageType === "image" && mediaUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl}
            alt="Shared image"
            className="max-w-full rounded mb-1 cursor-pointer"
            style={{ maxHeight: 200 }}
            onClick={() => window.open(mediaUrl, "_blank")}
          />
        )}
        {message.messageType === "video" && mediaUrl && (
          <video
            src={mediaUrl}
            controls
            className="max-w-full rounded mb-1"
            style={{ maxHeight: 200 }}
          />
        )}
        {message.messageType === "audio" && mediaUrl && (
          <audio
            src={mediaUrl}
            controls
            className="w-full mb-1"
          />
        )}
        {message.messageType === "document" && mediaUrl && (
          <a
            href={mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={isInbound ? "text-blue-600 underline" : "text-white underline"}
          >
            {filename || "View document"}
          </a>
        )}
        {message.text && <div>{message.text}</div>}
        <div
          className={`text-xs mt-1 ${isInbound ? "text-gray-500" : "text-blue-100"}`}
        >
          {formatDate(message.createdAt)}
        </div>
      </div>
    </div>
  );
}

function PendingMediaBubble({ media }: { media: PendingMedia }) {
  return (
    <div className="flex flex-col items-end mb-3">
      <div className="flex items-center gap-1 mb-0.5 px-1">
        <UserOutlined className="text-blue-400 text-xs" />
        <Text type="secondary" className="text-xs">Sending...</Text>
      </div>
      <div className="max-w-[70%] rounded-lg px-4 py-2 bg-blue-200 text-gray-500">
        {media.type === "image" && media.blobUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={media.blobUrl}
            alt={media.filename}
            className="max-w-full rounded mb-1 opacity-60"
            style={{ maxHeight: 200 }}
          />
        )}
        {media.type === "video" && (
          <video
            src={media.blobUrl || media.mediaUrl}
            controls
            className="max-w-full rounded mb-1 opacity-60"
            style={{ maxHeight: 200 }}
          />
        )}
        {media.type === "audio" && (
          <audio
            src={media.mediaUrl}
            controls
            className="w-full mb-1 opacity-60"
          />
        )}
        {media.type === "document" && (
          <Text>{media.filename}</Text>
        )}
        <div className="text-xs mt-1">
          <Spin size="small" /> Sending...
        </div>
      </div>
    </div>
  );
}

export default function MessageArea({ conversation }: MessageAreaProps) {
  const [text, setText] = useState("");
  const [pendingMedia, setPendingMedia] = useState<PendingMedia | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const { data, isLoading } = useMessages(activeConversationId);
  const sendMutation = useSendMessage();
  useChatSocket(activeConversationId);

  const messages = data?.messages || [];
  const reversedMessages = [...messages].reverse();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, pendingMedia]);

  const handleSend = async () => {
    if (!text.trim() || !activeConversationId) return;
    setPendingMedia({
      id: "pending-text",
      type: "text",
      mediaUrl: "",
      filename: "",
    });
    try {
      await sendMutation.mutateAsync({
        to: activeConversationId,
        text: text.trim(),
        type: "text",
      });
      setText("");
    } catch {
      toast.error("Failed to send message");
    } finally {
      setPendingMedia(null);
    }
  };

  const handleMediaUpload = async (file: File, type: string) => {
    if (!activeConversationId) return;

    const blobUrl = type === "image" || type === "video"
      ? URL.createObjectURL(file)
      : undefined;

    setPendingMedia({
      id: `pending-${Date.now()}`,
      type,
      mediaUrl: "",
      filename: file.name,
      blobUrl,
    });

    try {
      const result = await uploadChatMedia(file);
      setPendingMedia((prev) => prev ? { ...prev, mediaUrl: result.url, blobUrl: undefined } : null);
      await sendMutation.mutateAsync({
        to: activeConversationId,
        text: file.name,
        type: type as any,
        mediaUrl: result.url,
        filename: file.name,
      });
    } catch {
      toast.error("Failed to upload or send media");
    } finally {
      setPendingMedia(null);
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    }
  };

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-400">
          <UserOutlined style={{ fontSize: 48 }} />
          <p className="mt-2">Select a conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center gap-3 flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
          <UserOutlined className="text-gray-500" />
        </div>
        <div>
          <Text strong>
            {conversation.customerName || conversation.phoneNumber}
          </Text>
          {conversation.customerCode && (
            <Text type="secondary" className="block text-xs">
              {conversation.customerCode} · {conversation.phoneNumber}
            </Text>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spin />
          </div>
        ) : reversedMessages.length === 0 && !pendingMedia ? (
          <div className="text-center text-gray-400 py-8">
            No messages yet. Send a message to start the conversation.
          </div>
        ) : (
          <>
            {reversedMessages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {pendingMedia && <PendingMediaBubble media={pendingMedia} />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="px-4 py-3 border-t border-gray-200 bg-white flex-shrink-0">
        <Space.Compact className="w-full">
          <div className="flex items-center gap-1 mr-2">
            <Tooltip title="Send image">
              <Upload
                accept="image/*"
                showUploadList={false}
                disabled={!!pendingMedia}
                beforeUpload={(file) => {
                  handleMediaUpload(file, "image");
                  return false;
                }}
              >
                <Button icon={<PictureOutlined />} type="text" disabled={!!pendingMedia} />
              </Upload>
            </Tooltip>
            <Tooltip title="Send document">
              <Upload
                showUploadList={false}
                disabled={!!pendingMedia}
                beforeUpload={(file) => {
                  handleMediaUpload(file, "document");
                  return false;
                }}
              >
                <Button icon={<PaperClipOutlined />} type="text" disabled={!!pendingMedia} />
              </Upload>
            </Tooltip>
            <Tooltip title="Send audio">
              <Upload
                accept="audio/*"
                showUploadList={false}
                disabled={!!pendingMedia}
                beforeUpload={(file) => {
                  handleMediaUpload(file, "audio");
                  return false;
                }}
              >
                <Button icon={<AudioOutlined />} type="text" disabled={!!pendingMedia} />
              </Upload>
            </Tooltip>
            <Tooltip title="Send video">
              <Upload
                accept="video/*"
                showUploadList={false}
                disabled={!!pendingMedia}
                beforeUpload={(file) => {
                  handleMediaUpload(file, "video");
                  return false;
                }}
              >
                <Button icon={<VideoCameraOutlined />} type="text" disabled={!!pendingMedia} />
              </Upload>
            </Tooltip>
          </div>
          <TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            autoSize={{ minRows: 1, maxRows: 4 }}
            disabled={!!pendingMedia}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            style={{ flex: 1 }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={!!pendingMedia}
          />
        </Space.Compact>
      </div>
    </div>
  );
}
