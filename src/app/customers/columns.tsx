// src/app/customers/columns.tsx

import { ColumnsType } from "antd/es/table";
import { Button, Tooltip, Popconfirm } from "antd";
import {
  EditOutlined,
  CheckOutlined,
  StopOutlined,
  BarChartOutlined,
  ExportOutlined,
  DeleteOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Customer } from "@/types/customer";
import { Role } from "@/types/user";

interface CustomerActions {
  onEdit: (customer: Customer) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
  onViewStats: (customer: Customer) => void;
  onExport: (id: string) => void;
  onDelete?: (id: string) => void;
  onForceDelete?: (customer: Customer) => void;
  userRole?: string;
  loading?: {
    toggling?: boolean;
    exporting?: boolean;
    deleting?: boolean;
    forceDeleting?: boolean;
  };
}

export function getCustomerColumns(
  actions: CustomerActions
): ColumnsType<Customer> {
  return [
    {
      title: "Customer Code",
      dataIndex: "customerCode",
      key: "customerCode",
      sorter: true,
      width: 140,
    },
    {
      title: "Name",
      dataIndex: "firstName",
      key: "name",
      sorter: true,
      width: 180,
      render: (_: unknown, record: Customer) =>
        `${record.firstName} ${record.lastName || ""}`,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: true,
      width: 200,
    },
    {
      title: "Phone",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      sorter: true,
      width: 140,
    },
    {
      title: "City",
      key: "city",
      width: 120,
      render: (_: unknown, record: Customer) => record.cityRef?.name || "N/A",
    },
    {
      title: "Warehouse",
      key: "warehouse",
      width: 150,
      render: (_: unknown, record: Customer) => record.warehouse?.name || "N/A",
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 100,
      filters: [
        { text: "Active", value: true },
        { text: "Inactive", value: false },
      ],
      render: (isActive: boolean) => (isActive ? "Active" : "Inactive"),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: true,
      width: 160,
    },
    {
      title: "Actions",
      key: "actions",
      width: 260,
      render: (_: unknown, record: Customer) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Tooltip title="Edit">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => actions.onEdit(record)}
            />
          </Tooltip>
          <Tooltip title={record.isActive ? "Deactivate" : "Activate"}>
            <Button
              icon={record.isActive ? <StopOutlined /> : <CheckOutlined />}
              size="small"
              loading={actions.loading?.toggling}
              onClick={() =>
                actions.onToggleStatus(record.id, !record.isActive)
              }
              danger={record.isActive}
              type={record.isActive ? "default" : "primary"}
            />
          </Tooltip>
          <Tooltip title="View Stats">
            <Button
              icon={<BarChartOutlined />}
              size="small"
              onClick={() => actions.onViewStats(record)}
            />
          </Tooltip>
          <Tooltip title="Export">
            <Button
              icon={<ExportOutlined />}
              size="small"
              loading={actions.loading?.exporting}
              onClick={() => actions.onExport(record.id)}
            />
          </Tooltip>
          {actions.userRole === Role.SUPER_ADMIN && actions.onDelete && (
            <Popconfirm
              title="Soft Delete Customer"
              description="This will deactivate the customer while preserving records."
              onConfirm={() => actions.onDelete!(record.id)}
              okText="Yes"
              cancelText="No"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Soft Delete">
                <Button
                  icon={<DeleteOutlined />}
                  size="small"
                  danger
                  loading={actions.loading?.deleting}
                />
              </Tooltip>
            </Popconfirm>
          )}
          {actions.userRole === Role.SUPER_ADMIN && actions.onForceDelete && (
            <Tooltip title="Force Delete Permanently">
              <Button
                icon={<WarningOutlined />}
                size="small"
                danger
                type="primary"
                loading={actions.loading?.forceDeleting}
                onClick={() => actions.onForceDelete!(record)}
              />
            </Tooltip>
          )}
        </div>
      ),
    },
  ];
}
