"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Input,
  Button,
  Spin,
  Typography,
  Upload,
  Space,
  Tooltip,
} from "antd";
import {
  SendOutlined,
  PaperClipOutlined,
  PictureOutlined,
  AudioOutlined,
  VideoCameraOutlined,
  UserOutlined,
  RobotOutlined,
  LoadingOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { useMessages, useSendMessage, useChatSocket } from "@/hooks/useChat";
import { useChatStore } from "@/store/chatStore";
import { uploadChatMedia } from "@/services/chatService";
import LazyImage from "@/app/chat/components/LazyImage";
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
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
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
  return (
    d.toLocaleDateString([], { month: "short", day: "numeric" }) +
    " " +
    formatTime(dateStr)
  );
}

function DayDivider({ dateStr }: { dateStr: string }) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let label: string;
  if (d.toDateString() === today.toDateString()) {
    label = "Today";
  } else if (d.toDateString() === yesterday.toDateString()) {
    label = "Yesterday";
  } else {
    label = d.toLocaleDateString([], {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="flex items-center justify-center my-3">
      <span className="px-3 py-1 bg-white rounded-full text-xs text-gray-500 shadow-sm border border-gray-100">
        {label}
      </span>
    </div>
  );
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
    <div className={`flex flex-col ${isInbound ? "items-start" : "items-end"} mb-1.5 px-3`}>
      {!isInbound && (
        <div className="flex items-center gap-1 mb-0.5 px-1">
          {isSystem ? (
            <RobotOutlined className="text-gray-400 text-[10px]" />
          ) : (
            <UserOutlined className="text-blue-400 text-[10px]" />
          )}
          <Text type="secondary" className="text-[10px] leading-none">{senderName}</Text>
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-lg px-3 py-1.5 ${
          isInbound
            ? "bg-white text-gray-900 shadow-sm border border-gray-100"
            : "bg-[#d9fdd3] text-gray-900"
        }`}
      >
        {message.messageType === "image" && mediaUrl && (
          <LazyImage
            src={mediaUrl}
            alt={filename || "Shared image"}
            className="mb-1 -mx-3 -mt-1.5 rounded-t-lg"
            style={{ maxHeight: 300, minWidth: 180, borderRadius: 0 }}
            onClick={() => window.open(mediaUrl, "_blank")}
          />
        )}
        {message.messageType === "video" && mediaUrl && (
          <video
            src={mediaUrl}
            controls
            className="max-w-full rounded mb-1 -mx-3 -mt-1.5"
            style={{ maxHeight: 300 }}
            preload="metadata"
          />
        )}
        {message.messageType === "audio" && mediaUrl && (
          <audio src={mediaUrl} controls className="w-full mb-1 h-8" preload="none" />
        )}
        {message.messageType === "document" && mediaUrl && (
          <a
            href={mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline text-sm block mb-1"
          >
            {filename || "View document"}
          </a>
        )}
        {message.text && (
          <div className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
            {message.text}
          </div>
        )}
        <div
          className={`text-[10px] mt-0.5 flex items-center gap-1 ${
            isInbound ? "text-gray-400" : "text-gray-500"
          }`}
        >
          <span>{formatDate(message.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

function PendingMediaBubble({ media }: { media: PendingMedia }) {
  return (
    <div className="flex flex-col items-end mb-1.5 px-3">
      <div className="flex items-center gap-1 mb-0.5 px-1">
        <UserOutlined className="text-blue-400 text-[10px]" />
        <Text type="secondary" className="text-[10px]">Sending...</Text>
      </div>
      <div className="max-w-[75%] rounded-lg px-3 py-1.5 bg-[#d9fdd3] text-gray-500">
        {media.type === "image" && media.blobUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={media.blobUrl}
            alt={media.filename}
            className="max-w-full rounded mb-1 -mx-3 -mt-1.5 opacity-60"
            style={{ maxHeight: 200 }}
          />
        )}
        {media.type === "video" && media.blobUrl && (
          <video
            src={media.blobUrl}
            controls
            className="max-w-full rounded mb-1 -mx-3 -mt-1.5 opacity-60"
            style={{ maxHeight: 200 }}
          />
        )}
        {media.type === "document" && (
          <Text className="text-sm">{media.filename}</Text>
        )}
        <div className="text-[10px] mt-1 flex items-center gap-1">
          <LoadingOutlined /> Sending...
        </div>
      </div>
    </div>
  );
}

export default function MessageArea({ conversation }: MessageAreaProps) {
  const [text, setText] = useState("");
  const [pendingMedia, setPendingMedia] = useState<PendingMedia | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [initialScrollDone, setInitialScrollDone] = useState(false);

  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const { messages, isLoading, isFetching, hasMore, page, loadMore } =
    useMessages(activeConversationId);
  const sendMutation = useSendMessage();
  useChatSocket(activeConversationId);

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const atBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setAutoScroll(atBottom);

    if (el.scrollTop < 80 && hasMore && !isFetching) {
      loadMore();
    }
  }, [hasMore, isFetching, loadMore]);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  useEffect(() => {
    if (!isLoading && messages.length > 0 && !initialScrollDone) {
      requestAnimationFrame(() => {
        scrollToBottom(false);
        setInitialScrollDone(true);
      });
    }
  }, [isLoading, messages.length, initialScrollDone, scrollToBottom]);

  useEffect(() => {
    if (autoScroll && messages.length > 0 && initialScrollDone) {
      scrollToBottom(true);
    }
  }, [messages.length, autoScroll, initialScrollDone, scrollToBottom]);

  const handleSend = async () => {
    if (!text.trim() || !activeConversationId) return;
    setPendingMedia({
      id: "pending-text",
      type: "text",
      mediaUrl: "",
      filename: "",
    });
    setAutoScroll(true);
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

    const blobUrl =
      type === "image" || type === "video"
        ? URL.createObjectURL(file)
        : undefined;

    setPendingMedia({
      id: `pending-${Date.now()}`,
      type,
      mediaUrl: "",
      filename: file.name,
      blobUrl,
    });
    setAutoScroll(true);

    try {
      const result = await uploadChatMedia(file);
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
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center text-gray-400">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-200 flex items-center justify-center">
            <MessageOutlined style={{ fontSize: 28 }} />
          </div>
          <p className="text-sm">Select a conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="px-4 py-2.5 border-b border-gray-200 bg-white flex items-center gap-3 flex-shrink-0 shadow-sm z-10">
        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
          <UserOutlined className="text-gray-500 text-sm" />
        </div>
        <div className="min-w-0">
          <Text strong className="text-sm block truncate">
            {conversation.customerName || conversation.phoneNumber}
          </Text>
          {conversation.customerCode && (
            <Text type="secondary" className="text-[11px]">
              {conversation.customerCode}
            </Text>
          )}
        </div>
      </div>

      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
        style={{ background: "#efeae2" }}
      >
        <div className="py-3">
          {isFetching && page > 1 && (
            <div className="flex justify-center py-2">
              <Spin size="small" />
            </div>
          )}

          {hasMore && messages.length > 0 && (
            <div className="flex justify-center py-2">
              <Button
                type="text"
                size="small"
                loading={isFetching}
                onClick={() => loadMore()}
                className="text-gray-400 text-xs"
              >
                Load older messages
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spin />
            </div>
          ) : messages.length === 0 && !pendingMedia ? (
            <div className="text-center text-gray-400 py-8 px-4">
              <MessageOutlined style={{ fontSize: 32 }} className="mb-2" />
              <p className="text-sm">No messages yet.</p>
              <p className="text-xs mt-1">Send a message to start the conversation.</p>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => {
                const showDay =
                  idx === 0 ||
                  new Date(msg.createdAt).toDateString() !==
                    new Date(messages[idx - 1].createdAt).toDateString();
                return (
                  <div key={msg.id}>
                    {showDay && <DayDivider dateStr={msg.createdAt} />}
                    <MessageBubble message={msg} />
                  </div>
                );
              })}
              {pendingMedia && <PendingMediaBubble media={pendingMedia} />}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="px-3 py-2.5 border-t border-gray-200 bg-white flex-shrink-0">
        <Space.Compact className="w-full">
          <div className="flex items-center gap-0.5 mr-1.5">
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
                <Button
                  icon={<PictureOutlined />}
                  type="text"
                  size="small"
                  disabled={!!pendingMedia}
                />
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
                <Button
                  icon={<PaperClipOutlined />}
                  type="text"
                  size="small"
                  disabled={!!pendingMedia}
                />
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
                <Button
                  icon={<AudioOutlined />}
                  type="text"
                  size="small"
                  disabled={!!pendingMedia}
                />
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
                <Button
                  icon={<VideoCameraOutlined />}
                  type="text"
                  size="small"
                  disabled={!!pendingMedia}
                />
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
            className="text-sm"
            style={{ flex: 1, borderRadius: 8 }}
          />
          <Button
            type="primary"
            shape="circle"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={!!pendingMedia}
            disabled={!text.trim() || !!pendingMedia}
            style={{ marginLeft: 4 }}
          />
        </Space.Compact>
      </div>
    </div>
  );
}
