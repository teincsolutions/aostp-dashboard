import { ColumnsType } from "antd/es/table";
import { AgingPackageRow } from "@/types/dashboard";
import { Tooltip } from "antd";

export const columns: ColumnsType<AgingPackageRow> = [
  {
    title: "Tracking #",
    dataIndex: "trackingNumber",
    key: "trackingNumber",
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
    title: "Days In Warehouse",
    dataIndex: "daysInWarehouse",
    key: "daysInWarehouse",
    render: (value: number) => value,
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
