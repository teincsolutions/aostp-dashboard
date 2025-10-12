// Audit Log Table Columns

import { ColumnsType } from "antd/es/table";
import { Tooltip, Popover } from "antd";
import { AuditLog } from "@/types/audit";
import dayjs from "dayjs";

function renderJson(data: Record<string, unknown> | null) {
  if (!data) return "-";
  const jsonStr = JSON.stringify(data, null, 2);
  return (
    <Popover content={<pre className="max-w-xs whitespace-pre-wrap">{jsonStr}</pre>} title="Details">
      <span className="truncate max-w-[160px] block cursor-pointer" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {jsonStr}
      </span>
    </Popover>
  );
}

export const auditLogColumns: ColumnsType<AuditLog> = [
  {
    title: "Timestamp",
    dataIndex: "timestamp",
    key: "timestamp",
    render: (value: string) => dayjs(value).format("YYYY-MM-DD HH:mm:ss"),
    sorter: true,
    width: 160,
  },
  {
    title: "Actor",
    dataIndex: "actor",
    key: "actor",
    render: (actor: AuditLog["actor"]) =>
      !actor ? "-" :
      <Tooltip title={`${actor.name} (${actor.email})`}>
        <span>{actor.name}</span>
      </Tooltip>,
    width: 140,
  },
  {
    title: "Entity",
    dataIndex: "entity",
    key: "entity",
    width: 120,
    filters: [
      { text: "User", value: "USER" },
      { text: "Customer", value: "CUSTOMER" },
      { text: "Package", value: "PACKAGE" },
      { text: "Container", value: "CONTAINER" },
      { text: "Invoice", value: "INVOICE" },
      { text: "Payment", value: "PAYMENT" },
      { text: "Notification", value: "NOTIFICATION" },
      { text: "Exchange Rate", value: "EXCHANGE_RATE" },
      { text: "Shipping Rate", value: "SHIPPING_RATE" },
      { text: "Other", value: "OTHER" },
    ],
  },
  {
    title: "Action",
    dataIndex: "action",
    key: "action",
    width: 120,
    filters: [
      { text: "Create", value: "CREATE" },
      { text: "Update", value: "UPDATE" },
      { text: "Delete", value: "DELETE" },
      { text: "Status Change", value: "STATUS_CHANGE" },
      { text: "Export", value: "EXPORT" },
    ],
  },
  {
    title: "Before",
    dataIndex: "before",
    key: "before",
    render: renderJson,
    width: 180,
  },
  {
    title: "After",
    dataIndex: "after",
    key: "after",
    render: renderJson,
    width: 180,
  },
  {
    title: "Metadata",
    dataIndex: "metadata",
    key: "metadata",
    render: renderJson,
    width: 180,
  },
];
