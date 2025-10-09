// src/app/package-intake/columns.tsx

import { ColumnsType } from "antd/es/table";
import { PackageIntake, Receipt } from "@/types/package";
import { Button } from "antd";
import dayjs from "dayjs";

export const packageIntakeColumns: ColumnsType<PackageIntake> = [
  {
    title: "Warehouse",
    dataIndex: "warehouseLocation",
    key: "warehouseLocation",
    width: 120,
    render: (value: string) => value || "Not Assigned",
  },
  {
    title: "Photos",
    key: "photos",
    width: 90,
    render: (_: any, record: PackageIntake) =>
      record.photos?.length ? `${record.photos.length} photo${record.photos.length > 1 ? 's' : ''}` : "No photos",
  },
  {
    title: "Customer",
    key: "customer",
    width: 180,
    ellipsis: true,
    render: (_, record) =>
      record.customer ? `${record.customer.firstName} ${record.customer.lastName}` : "N/A",
  },
  {
    title: "Weight",
    dataIndex: "weight",
    key: "weight",
    width: 90,
    render: (value: number) => `${value} kg`,
  },
  {
    title: "CBM",
    dataIndex: "cbm",
    key: "cbm",
    width: 90,
    render: (value: number) => value?.toFixed(2),
  },
  {
    title: "Shipping Mode",
    dataIndex: "shippingMode",
    key: "shippingMode",
    width: 120,
    render: (_: any, record) =>
      record.shippingMode === "AIR"
        ? `AIR (${record.airShippingType})`
        : "SEA",
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    width: 110,
    render: (value: string) => value,
  },
  {
    title: "Created At",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 160,
    render: (value: string) => dayjs(value).format("YYYY-MM-DD HH:mm"),
  },
  {
    title: "Actions",
    key: "actions",
    width: 120,
    render: (_: any, record) => (
      <Button
        type="link"
        size="small"
        onClick={() => record.onViewReceipt?.(record.id)}
      >
        View Receipt
      </Button>
    ),
  },
];
