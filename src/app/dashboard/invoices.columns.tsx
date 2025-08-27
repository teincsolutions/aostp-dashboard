import { ColumnsType } from "antd/es/table";
import { InvoiceRow } from "@/types/dashboard";
import { Tooltip } from "antd";

export const columns: ColumnsType<InvoiceRow> = [
  {
    title: "Invoice #",
    dataIndex: "invoiceNumber",
    key: "invoiceNumber",
    ellipsis: true,
    render: (text: string) => (
      <Tooltip title={text}>
        <span>{text}</span>
      </Tooltip>
    ),
  },
  {
    title: "Customer",
    dataIndex: "customer",
    key: "customer",
    ellipsis: true,
    render: (text: string) => (
      <Tooltip title={text}>
        <span>{text}</span>
      </Tooltip>
    ),
  },
  {
    title: "Total",
    dataIndex: "total",
    key: "total",
    render: (value: number) => value.toLocaleString(),
  },
  {
    title: "Paid",
    dataIndex: "paid",
    key: "paid",
    render: (value: number) => value.toLocaleString(),
  },
  {
    title: "Balance",
    dataIndex: "balance",
    key: "balance",
    render: (value: number) => value.toLocaleString(),
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    ellipsis: true,
    render: (text: string) => (
      <Tooltip title={text}>
        <span>{text}</span>
      </Tooltip>
    ),
  },
  {
    title: "Created At",
    dataIndex: "createdAt",
    key: "createdAt",
    ellipsis: true,
    render: (text: string) => (
      <Tooltip title={text}>
        <span>{new Date(text).toLocaleString()}</span>
      </Tooltip>
    ),
  },
];
