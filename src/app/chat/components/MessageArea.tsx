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
  Image,
  Modal,
  Checkbox,
  Popconfirm,
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
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  DeleteOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import {
  useMessages,
  useSendMessage,
  useChatSocket,
  useSignedMediaUrls,
  useRetryMessage,
  useDeleteMessages,
} from "@/hooks/useChat";
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

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return <ClockCircleOutlined className="text-yellow-500 text-[10px]" />;
    case "sent":
      return <CheckCircleOutlined className="text-green-500 text-[10px]" />;
    case "failed":
      return <ExclamationCircleOutlined className="text-red-500 text-[10px]" />;
    default:
      return null;
  }
}

function MessageBubble({
  message,
  signedUrls,
  onRetry,
  retrying,
  selected,
  selectionMode,
  onSelect,
}: {
  message: ChatMessage;
  signedUrls: Record<string, string>;
  onRetry?: (id: string) => void;
  retrying?: boolean;
  selected?: boolean;
  selectionMode?: boolean;
  onSelect?: (id: string, longPress?: boolean) => void;
}) {
  const isInbound = message.direction === "INBOUND";
  const mediaKey = message.content?.key as string | undefined;
  const mediaUrl = mediaKey && signedUrls[mediaKey]
    ? signedUrls[mediaKey]
    : (message.content?.mediaUrl as string | undefined);
  const filename = message.content?.filename as string | undefined;
  const isSystem = !isInbound && !message.repliedBy;
  const isPending = message.status === "pending";
  const isFailed = message.status === "failed";
  const senderName = message.repliedBy
    ? `${message.repliedBy.firstName}${message.repliedBy.lastName ? ` ${message.repliedBy.lastName}` : ""}`
    : "System";
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const longPressTimer = useRef<number | null>(null);

  const handlePointerDown = useCallback(() => {
    longPressTimer.current = window.setTimeout(() => {
      onSelect?.(message.id, true);
    }, 400);
  }, [message.id, onSelect]);

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current !== null) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleClick = useCallback(() => {
    if (selectionMode) {
      onSelect?.(message.id);
    }
  }, [selectionMode, message.id, onSelect]);

  const handleCheckboxChange = useCallback(() => {
    onSelect?.(message.id);
  }, [message.id, onSelect]);

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
      <div className={`flex items-center gap-2 ${isInbound ? "flex-row" : "flex-row-reverse"}`}>
        {(selectionMode || selected) && (
          <div className="flex-shrink-0">
            <Checkbox
              checked={selected}
              onChange={handleCheckboxChange}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
        <div
          className={`max-w-[75%] rounded-lg px-3 py-1.5 select-none ${
            isInbound
              ? "bg-white text-gray-900 shadow-sm border border-gray-100"
              : "bg-[#d9fdd3] text-gray-900"
          } ${isFailed ? "border border-red-200" : ""} ${
            selected ? "ring-2 ring-blue-400" : ""
          } ${selectionMode ? "cursor-pointer" : ""}`}
          onMouseDown={selectionMode ? undefined : handlePointerDown}
          onMouseUp={selectionMode ? undefined : handlePointerUp}
          onMouseLeave={selectionMode ? undefined : handlePointerUp}
          onTouchStart={selectionMode ? undefined : handlePointerDown}
          onTouchEnd={selectionMode ? undefined : handlePointerUp}
          onClick={handleClick}
        >
          {message.messageType === "image" && mediaUrl && (
            <div className="mb-1 -mx-3 -mt-1.5 overflow-hidden rounded-t-lg">
              <Image
                src={mediaUrl}
                alt={filename || "Shared image"}
                style={{ maxHeight: 300, objectFit: "contain" }}
                className="w-full"
                preview={{ mask: null }}
                placeholder={
                  <div className="flex items-center justify-center" style={{ minHeight: 80 }}>
                    <PictureOutlined className="text-gray-300 text-xl" />
                  </div>
                }
                fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='80'%3E%3Crect fill='%23f3f4f6' width='100' height='80'/%3E%3Ctext x='50' y='45' text-anchor='middle' fill='%239ca3af' font-size='14'%3EImage%3C/text%3E%3C/svg%3E"
              />
            </div>
          )}
          {message.messageType === "video" && mediaUrl && (
            <>
              <div
                className="mb-1 -mx-3 -mt-1.5 overflow-hidden rounded-t-lg relative cursor-pointer"
                style={{ maxHeight: 300 }}
                onClick={(e) => {
                  if (selectionMode) return;
                  setVideoModalOpen(true);
                }}
              >
                <video
                  src={mediaUrl}
                  className="w-full"
                  style={{ maxHeight: 300 }}
                  preload="metadata"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center">
                    <VideoCameraOutlined className="text-xl text-gray-700 ml-0.5" />
                  </div>
                </div>
              </div>
              <Modal
                title={filename || "Video"}
                open={videoModalOpen}
                onCancel={() => setVideoModalOpen(false)}
                footer={null}
                width={800}
                destroyOnClose
              >
                <video src={mediaUrl} controls className="w-full" style={{ maxHeight: "70vh" }} />
              </Modal>
            </>
          )}
          {message.messageType === "audio" && mediaUrl && (
            <audio src={mediaUrl} controls className="w-full mb-1 h-8" preload="none" />
          )}
          {message.messageType === "document" && mediaUrl && (
            <div className="text-sm text-gray-700 mb-1 flex items-center gap-1.5">
              <PaperClipOutlined />
              <span>{filename || "Document"}</span>
            </div>
          )}
          {message.messageType === "text" && message.text && (
            <div className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
              {message.text}
            </div>
          )}
          <div
            className={`text-[10px] mt-0.5 flex items-center gap-1.5 ${
              isInbound ? "text-gray-400" : "text-gray-500"
            }`}
          >
            <span>{formatDate(message.createdAt)}</span>
            {!isInbound && (
              <>
                {isPending ? (
                  <Spin size="small" style={{ fontSize: 8 }} />
                ) : (
                  <StatusIcon status={message.status} />
                )}
                {isFailed && onRetry && (
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<ReloadOutlined />}
                    loading={retrying}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRetry(message.id);
                    }}
                    className="text-[10px] h-auto p-0 leading-none"
                    style={{ fontSize: 10, height: 16, minWidth: 0 }}
                  />
                )}
              </>
            )}
          </div>
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteOpen, setDeleteOpen] = useState(false);

  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const { messages, isLoading, isFetching, hasMore, page, loadMore } =
    useMessages(activeConversationId);
  const sendMutation = useSendMessage();
  const retryMutation = useRetryMessage();
  const deleteMutation = useDeleteMessages();
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const selectionMode = selectedIds.size > 0;
  useChatSocket(activeConversationId);

  const handleRetry = useCallback(async (id: string) => {
    setRetryingId(id);
    try {
      await retryMutation.mutateAsync(id);
    } catch {
      toast.error("Failed to retry message");
    } finally {
      setRetryingId(null);
    }
  }, [retryMutation]);

  const handleSelect = useCallback((id: string, longPress?: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (longPress && next.size === 0) {
        next.add(id);
      } else if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleDelete = useCallback(async () => {
    const ids = Array.from(selectedIds);
    try {
      await deleteMutation.mutateAsync(ids);
      setSelectedIds(new Set());
      setDeleteOpen(false);
    } catch {
      toast.error("Failed to delete messages");
    }
  }, [selectedIds, deleteMutation]);

  const mediaKeys = messages
    .map((m) => {
      const key = m.content?.key as string | undefined;
      const bucket = m.content?.bucket as string | undefined;
      return key ? { key, bucket } : null;
    })
    .filter(Boolean) as { key: string; bucket?: string }[];
  const { data: signedUrlsMap = {} } = useSignedMediaUrls(mediaKeys);

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
        type: type as any,
        mediaUrl: result.url,
        filename: file.name,
        key: result.key,
        bucket: result.bucket,
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
        {selectionMode ? (
          <>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={handleClearSelection}
              className="flex-shrink-0"
            />
            <Text strong className="text-sm">
              {selectedIds.size} selected
            </Text>
            <div className="ml-auto">
              <Popconfirm
                title="Delete messages"
                description={`Delete ${selectedIds.size} message(s)?`}
                open={deleteOpen}
                onConfirm={handleDelete}
                onCancel={() => setDeleteOpen(false)}
                okText="Delete"
                okButtonProps={{ danger: true }}
                cancelText="Cancel"
              >
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  loading={deleteMutation.isPending}
                  onClick={() => setDeleteOpen(true)}
                >
                  Delete
                </Button>
              </Popconfirm>
            </div>
          </>
        ) : (
          <>
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <UserOutlined className="text-black text-sm" />
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
          </>
        )}
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
                    <MessageBubble
                      message={msg}
                      signedUrls={signedUrlsMap}
                      onRetry={handleRetry}
                      retrying={retryingId === msg.id}
                      selected={selectedIds.has(msg.id)}
                      selectionMode={selectionMode}
                      onSelect={handleSelect}
                    />
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
