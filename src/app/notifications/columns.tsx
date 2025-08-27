import { ColumnsType } from "antd/es/table";
import { Tag, Button, Tooltip } from "antd";
import { NotificationLog, NotificationChannel, NotificationStatus } from "@/types/notification";

export const columns: ColumnsType<NotificationLog> = [
  {
    title: "Channel",
    dataIndex: "channel",
    key: "channel",
    render: (channel: NotificationChannel) => (
      <Tag color={channel === "EMAIL" ? "blue" : channel === "SMS" ? "green" : "volcano"}>
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
    title: "Recipient",
    dataIndex: "recipient",
    key: "recipient",
    ellipsis: true,
  },
  {
    title: "Template/Event",
    dataIndex: "template",
    key: "template",
    render: (_: string, record) => (
      <span>{record.template} / {record.event}</span>
    ),
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status: NotificationStatus) => (
      <Tag color={status === "SENT" ? "green" : status === "FAILED" ? "red" : "orange"}>
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
    title: "Error Message",
    dataIndex: "errorMessage",
    key: "errorMessage",
    ellipsis: true,
    render: (msg?: string) => msg || "-",
  },
  {
    title: "Created At",
    dataIndex: "createdAt",
    key: "createdAt",
    render: (date: string) => new Date(date).toLocaleString(),
    sorter: true,
  },
  {
    title: "Actions",
    key: "actions",
    render: (_: unknown, record: NotificationLog) => null, // Handlers should be injected from parent via Table render prop
  },
];
