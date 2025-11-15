import { ColumnsType } from "antd/es/table";
import { Tag, Button, Tooltip } from "antd";
import {
  NotificationLog,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
} from "@/types/notification";
import lodash from "lodash";

export const columns: ColumnsType<NotificationLog> = [
  {
    title: "Channel",
    dataIndex: "channel",
    key: "channel",
    render: (channel: NotificationChannel) => (
      <Tag
        color={
          channel === "EMAIL" ? "blue" : channel === "SMS" ? "green" : "volcano"
        }
      >
        {channel}
      </Tag>
    ),
    filters: [
      { text: "Email", value: NotificationChannel.EMAIL },
      { text: "SMS", value: NotificationChannel.SMS },
      { text: "WhatsApp", value: NotificationChannel.WHATSAPP },
    ],
  },
  {
    title: "Type",
    dataIndex: "type",
    key: "type",
    render: (type: NotificationType) => (
      <Tag>{lodash.startCase(type.replace("_", " ").toLowerCase())}</Tag>
    ),
    filters: [
      { text: "Package Intake", value: NotificationType.PACKAGE_INTAKE },
      // Add other types as needed
    ],
  },
  {
    title: "Recipient",
    dataIndex: "recipient",
    key: "recipient",
    ellipsis: true,
  },
  {
    title: "Subject",
    dataIndex: "subject",
    key: "subject",
    ellipsis: true,
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status: NotificationStatus) => (
      <Tag
        color={
          status === "SENT" ? "green" : status === "FAILED" ? "red" : "orange"
        }
      >
        {status}
      </Tag>
    ),
    filters: [
      { text: "Sent", value: NotificationStatus.SENT },
      { text: "Failed", value: NotificationStatus.FAILED },
      { text: "Pending", value: NotificationStatus.PENDING },
    ],
  },
  {
    title: "Sent At",
    dataIndex: "sentAt",
    key: "sentAt",
    render: (date: string) => new Date(date).toLocaleString(),
    sorter: true,
  },
  {
    title: "Created At",
    dataIndex: "createdAt",
    key: "createdAt",
    render: (date: string) => new Date(date).toLocaleString(),
    sorter: true,
  },
  {
    title: "Fail Reason",
    dataIndex: "failReason",
    key: "failReason",
    width: 200,
    ellipsis: true,
    render: (msg?: string) => msg || "-",
  },
  {
    title: "Actions",
    key: "actions",
    render: (_: unknown, record: NotificationLog) => null, // Handlers should be injected from parent via Table render prop
  },
];
