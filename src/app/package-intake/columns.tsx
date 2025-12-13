// src/app/package-intake/columns.tsx

import { ColumnsType } from "antd/es/table";
import { Package, PackageStatusPackages, Receipt } from "@/types/package";
import { Button, Tag } from "antd";
import dayjs from "dayjs";
import { packageStatusColors } from "../packages/page";

export const packageIntakeColumns: ColumnsType<
  Package & { onViewReceipt: (id: string) => void }
> = [
  {
    title: "Tracking Code",
    dataIndex: "trackingCode",
    key: "trackingCode",
    width: 160,
  },
  {
    title: "Warehouse",
    key: "warehouse",
    width: 120,
    render: (_, record) => record?.warehouse?.name,
  },
  {
    title: "Customer",
    key: "customer",
    width: 180,
    ellipsis: true,
    render: (_, record) =>
      record.customer
        ? `${record.customer.customerCode} - ${record.customer.firstName} ${
            record.customer.lastName || ""
          }`
        : "N/A",
  },
  {
    title: "Description",
    dataIndex: "description",
    key: "description",
    ellipsis: true,
    width: 200,
  },
  {
    title: "Quantity",
    dataIndex: "quantity",
    key: "quantity",
    width: 100,
  },
  {
    title: "Shipping Mode",
    key: "shippingMode",
    width: 140,
    render: (_, record) => {
      if (record.shippingMode === "AIR") {
        const typeColor =
          record.airShippingType === "EXPRESS_AIR" ? "red" : "blue";
        const typeText = record.airShippingType?.replace("_", " ") || "AIR";
        return <Tag color={typeColor}>{typeText}</Tag>;
      }
      return <Tag color="green">SEA</Tag>;
    },
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    filters: Object.values(PackageStatusPackages).map((status) => ({
      text: status.replace("_", " "),
      value: status,
    })),
    width: 100,
    render: (status: PackageStatusPackages) => {
      return (
        <Tag color={packageStatusColors[status] || "default"}>
          {status.replace("_", " ")}
        </Tag>
      );
    },
  },
  {
    title: "Pickup Code",
    dataIndex: "pickupCode",
    key: "pickupCode",
    width: 120,
    render: (value: string) => value || "N/A",
  },
  {
    title: "Payment Status",
    dataIndex: "paymentStatus",
    key: "paymentStatus",
    width: 130,
    render: (value: string) => {
      const colorMap: { [key: string]: string } = {
        PENDING: "orange",
        PAID: "green",
        OVERDUE: "red",
      };
      return <Tag color={colorMap[value] || "default"}>{value}</Tag>;
    },
  },
  {
    title: "Received Date",
    dataIndex: ["receivedDate"],
    key: "receivedDate",
    width: 160,
    render: (value: string) =>
      value ? dayjs(value).format("YYYY-MM-DD HH:mm") : "N/A",
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
