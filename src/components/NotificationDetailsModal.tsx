"use client";

import React from "react";
import { Modal, Button, Descriptions, Tag, message, Space } from "antd";
import { toast } from "sonner";
import { NotificationOutlined, CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import { useRetryNotification } from "@/hooks/useNotifications";

interface NotificationDetailsModalProps {
  visible: boolean;
  onCancel: () => void;
  notification?: {
    id: string;
    customerId?: string;
    customer?: {
      firstName: string;
      lastName: string;
      phoneNumber: string;
      email?: string;
    };
    channel: string;
    content: string;
    status: string;
    createdAt: string;
    sentAt?: string;
    readAt?: string;
    errorMessage?: string;
  };
}

export const NotificationDetailsModal: React.FC<NotificationDetailsModalProps> = ({
  visible,
  onCancel,
  notification,
}) => {
  const { mutateAsync: retryNotification, isPending: isRetrying } = useRetryNotification();

  if (!notification) return null;

  const handleRetry = async () => {
    try {
      await retryNotification(notification.id);
      toast.success("Notification retry initiated successfully");
      onCancel();
    } catch (error) {
      toast.error("Failed to retry notification");
    }
  };

  const getStatusTag = (status: string) => {
    const statusConfig = {
      SENT: { color: "green", icon: <CheckCircleOutlined /> },
      FAILED: { color: "red", icon: <CloseCircleOutlined /> },
      PENDING: { color: "orange", icon: <NotificationOutlined /> },
      READ: { color: "blue", icon: <CheckCircleOutlined /> },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { color: "default", icon: <NotificationOutlined /> };

    return (
      <Tag color={config.color}>
        {config.icon}
        <span style={{ marginLeft: 4 }}>{status}</span>
      </Tag>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <NotificationOutlined />
          Notification Details
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Close
        </Button>,
        notification?.status === "FAILED" && (
          <Button
            key="retry"
            type="primary"
            icon={<ReloadOutlined />}
            loading={isRetrying}
            onClick={handleRetry}
          >
            Retry
          </Button>
        ),
      ].filter(Boolean)}
      width={800}
    >
      <Descriptions
        bordered
        column={2}
        size="small"
      >
        <Descriptions.Item label="ID" span={2}>
          <code>{notification.id}</code>
        </Descriptions.Item>

        {notification.customer && (
          <>
            <Descriptions.Item label="Customer Name">
              {notification.customer.firstName} {notification.customer.lastName}
            </Descriptions.Item>
            <Descriptions.Item label="Customer Phone">
              {notification.customer.phoneNumber}
            </Descriptions.Item>
            <Descriptions.Item label="Customer Email">
              {notification.customer.email || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Customer ID">
              <code>{notification.customerId}</code>
            </Descriptions.Item>
          </>
        )}

        <Descriptions.Item label="Channel">
          <Tag color="blue">{notification.channel.toUpperCase()}</Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Status">
          {getStatusTag(notification.status)}
        </Descriptions.Item>

        <Descriptions.Item label="Created At">
          {new Date(notification.createdAt).toLocaleString()}
        </Descriptions.Item>

        <Descriptions.Item label="Sent At">
          {notification.sentAt ? new Date(notification.sentAt).toLocaleString() : "Not sent"}
        </Descriptions.Item>

        <Descriptions.Item label="Read At">
          {notification.readAt ? new Date(notification.readAt).toLocaleString() : "Not read"}
        </Descriptions.Item>

        <Descriptions.Item label="Content" span={2}>
          <div style={{
            maxHeight: '200px',
            overflow: 'auto',
            padding: '8px',
            background: '#fafafa',
            borderRadius: '4px',
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace'
          }}>
            {notification.content}
          </div>
        </Descriptions.Item>

        {notification.errorMessage && (
          <Descriptions.Item label="Error Message" span={2}>
            <div style={{
              padding: '8px',
              background: '#fff2f0',
              border: '1px solid #ffccc7',
              borderRadius: '4px',
              color: '#ff4d4f'
            }}>
              {notification.errorMessage}
            </div>
          </Descriptions.Item>
        )}
      </Descriptions>
    </Modal>
  );
};
