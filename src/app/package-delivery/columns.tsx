// src/app/package-delivery/columns.tsx

import { ColumnsType } from "antd/es/table";
import { PackageDelivery } from "@/types/package";
import { Button, Tag, Image } from "antd";
import dayjs from "dayjs";

export const packageDeliveryColumns: ColumnsType<
  PackageDelivery & { onViewDetails?: (id: string) => void }
> = [
  {
    title: "Pickup ID",
    dataIndex: "deliveryId",
    key: "deliveryId",
    width: 160,
  },
  {
    title: "Customer",
    key: "customer",
    width: 180,
    ellipsis: true,
    render: (_, record) =>
      record.customer
        ? `${record.customer.customerCode} - ${record.customer.firstName} ${record.customer.lastName}`
        : "N/A",
  },
  {
    title: "Invoice",
    key: "invoice",
    width: 140,
    render: (_, record) => record.invoice?.invoiceNumber || "N/A",
  },
  {
    title: "Package Tracking",
    key: "packageTracking",
    width: 180,
    render: (_, record) => record.package?.trackingCode || "N/A",
  },
  {
    title: "Description",
    key: "description",
    width: 200,
    ellipsis: true,
    render: (_, record) => record.package?.description || "N/A",
  },
  {
    title: "Quantity",
    dataIndex: "quantity",
    key: "quantity",
    width: 100,
  },
  {
    title: "Receiver Name",
    dataIndex: "receiverName",
    key: "receiverName",
    width: 150,
    render: (value: string) => value || "N/A",
  },
  {
    title: "Warehouse",
    key: "warehouse",
    width: 120,
    render: (_, record) => record.package?.warehouse?.name || "N/A",
  },
  {
    title: "Release Date",
    dataIndex: "releaseDate",
    key: "releaseDate",
    width: 160,
    render: (value: string) =>
      value ? dayjs(value).format("YYYY-MM-DD HH:mm") : "N/A",
  },
  {
    title: "Container",
    key: "container",
    width: 140,
    ellipsis: true,
    render: (_, record) =>
      record.invoice?.packingList?.container?.containerNumber || "N/A",
  },
  {
    title: "Photos",
    key: "photos",
    width: 100,
    render: (_, record) => {
      if (!record.photos || record.photos.length === 0) {
        return <Tag color="default">None</Tag>;
      }
      return (
        <Image.PreviewGroup>
          {record.photos.map((url, idx) => (
            <Image
              key={idx}
              width={30}
              height={30}
              src={url}
              alt={`Delivery photo ${idx + 1}`}
              style={{ marginRight: 4, objectFit: "cover" }}
            />
          ))}
        </Image.PreviewGroup>
      );
    },
  },
  {
    title: "Notes",
    dataIndex: "notes",
    key: "notes",
    width: 200,
    ellipsis: true,
    render: (value: string) => value || "-",
  },
  {
    title: "Actions",
    key: "actions",
    width: 120,
    fixed: "right",
    render: (_: any, record) => (
      <Button
        type="link"
        size="small"
        onClick={() => record.onViewDetails?.(record.id)}
      >
        View Details
      </Button>
    ),
  },
];
