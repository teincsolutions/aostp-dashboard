import { ColumnsType } from "antd/es/table";
import { WarehousePackage } from "@/types/warehouse";
import { Button, Tooltip } from "antd";
import {
  EyeOutlined,
  EditOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

export const columns: ColumnsType<WarehousePackage> = [
  {
    title: "Tracking #",
    dataIndex: "trackingCode",
    key: "trackingCode",
    ellipsis: true,
  },
  {
    title: "Customer",
    dataIndex: "customerId",
    key: "customerId",
    ellipsis: true,
    render: (_: any, record: WarehousePackage) =>
      `${record?.customer?.firstName} ${record?.customer?.lastName} (${record?.customer?.customerCode})`,
  },
  {
    title: "Warehouse",
    dataIndex: "warehouseId",
    key: "warehouseId",
    ellipsis: true,
    render: (_: any, record: WarehousePackage) =>
      record.warehouse?.name || "N/A",
  },
  {
    title: "Days Stored",
    dataIndex: "daysInWarehouse",
    key: "daysInWarehouse",
    sorter: true,
    ellipsis: true,
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    filters: [
      { text: "Received", value: "RECEIVED" },
      { text: "Shipped", value: "SHIPPED" },
    ],
    ellipsis: true,
  },
  {
    title: "Created At",
    dataIndex: "createdAt",
    key: "createdAt",
    ellipsis: true,
    render: (value: string) => new Date(value).toLocaleString(),
  },
  {
    title: "Actions",
    key: "actions",
    fixed: "right",
    width: 160,
    render: (_: WarehousePackage, record: WarehousePackage) => (
      <div className="flex gap-2">
        <Tooltip title="View Details">
          <Button icon={<EyeOutlined />} size="small" />
        </Tooltip>
        <Tooltip title="Update Location">
          <Button icon={<EditOutlined />} size="small" />
        </Tooltip>
        <Tooltip title="Mark as Dispatched">
          <Button icon={<CheckCircleOutlined />} size="small" />
        </Tooltip>
      </div>
    ),
  },
];
