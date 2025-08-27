// src/app/packages/columns.tsx

import { ColumnsType } from "antd/es/table";
import { Package, PackageStatus, ShipmentType } from "@/types/package";
import { Tag, Button, Tooltip } from "antd";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  SwapOutlined,
} from "@ant-design/icons";

export const columns: ColumnsType<Package> = [
  {
    title: "Tracking Number",
    dataIndex: "trackingNumber",
    key: "trackingNumber",
    sorter: true,
    width: 160,
  },
  {
    title: "Customer",
    dataIndex: ["customer", "firstName"],
    key: "customer",
    render: (_, record) =>
      record.customer
        ? `${record.customer.firstName} ${record.customer.lastName}`
        : "N/A",
    width: 180,
  },
  {
    title: "Description",
    dataIndex: "description",
    key: "description",
    ellipsis: true,
    width: 200,
  },
  {
    title: "Weight",
    dataIndex: "weight",
    key: "weight",
    sorter: true,
    width: 100,
    render: (value) => `${value} kg`,
  },
  {
    title: "CBM",
    dataIndex: "cbm",
    key: "cbm",
    sorter: true,
    width: 100,
  },
  {
    title: "Shipment Type",
    dataIndex: "shipmentType",
    key: "shipmentType",
    filters: [
      { text: "Air", value: ShipmentType.AIR },
      { text: "Sea", value: ShipmentType.SEA },
    ],
    width: 140,
    render: (type) => (
      <Tag color={type === ShipmentType.AIR ? "blue" : "green"}>{type}</Tag>
    ),
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    filters: Object.values(PackageStatus).map((status) => ({
      text: status,
      value: status,
    })),
    width: 140,
    render: (status) => (
      <Tag
        color={
          status === PackageStatus.RECEIVED
            ? "gold"
            : status === PackageStatus.PACKED
            ? "blue"
            : status === PackageStatus.IN_TRANSIT
            ? "purple"
            : "green"
        }
      >
        {status}
      </Tag>
    ),
  },
  {
    title: "Created At",
    dataIndex: "createdAt",
    key: "createdAt",
    sorter: true,
    width: 180,
    render: (date) => new Date(date).toLocaleString(),
  },
  {
    title: "Actions",
    key: "actions",
    fixed: "right",
    width: 220,
    render: (_, record) => (
      <div className="flex gap-2">
        <Tooltip title="View">
          <Button icon={<EyeOutlined />} size="small" />
        </Tooltip>
        <Tooltip title="Edit">
          <Button
            icon={<EditOutlined />}
            size="small"
            disabled={record.status !== PackageStatus.RECEIVED}
          />
        </Tooltip>
        <Tooltip title="Upload/Edit Photo">
          <Button icon={<UploadOutlined />} size="small" />
        </Tooltip>
        <Tooltip title="Update Status">
          <Button icon={<SwapOutlined />} size="small" />
        </Tooltip>
        <Tooltip title="Delete">
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            disabled={record.status !== PackageStatus.RECEIVED}
          />
        </Tooltip>
        <Tooltip title="Export Excel">
          <Button icon={<FileExcelOutlined />} size="small" />
        </Tooltip>
        <Tooltip title="Export PDF">
          <Button icon={<FilePdfOutlined />} size="small" />
        </Tooltip>
      </div>
    ),
  },
];
