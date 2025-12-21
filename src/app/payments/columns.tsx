// src/app/payments/columns.tsx
import { ColumnsType } from "antd/es/table";
import { Button, Popconfirm, Space, Tooltip } from "antd";
import { Payment } from "@/types/payment";
import { UserRole } from "@/types/common";
import { DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

export const getPaymentColumns = ({
  handleDelete,
  handleView,
  userRole,
}: {
  handleDelete: (id: string) => void;
  handleView: (payment: Payment) => void;
  userRole?: UserRole;
}) => {
  const columns: ColumnsType<Payment> = [
    {
      title: "ID",
      dataIndex: "paymentCode",
      key: "paymentCode",
      width: 80,
    },
    {
      title: "Customer",
      key: "customer",
      ellipsis: true,
      width: 200,
      render: (_, record) => (
        <Tooltip
          title={`${record.customer.firstName} ${
            record.customer.lastName || ""
          }`}
        >
          {record.customer.firstName} {record.customer.lastName || ""}
        </Tooltip>
      ),
    },
    {
      title: "Amount",
      key: "amount",
      width: 120,
      render: (_, record) =>
        `${record.currency} ${
          record.currency === "GHS"
            ? record.localAmount.toFixed(2)
            : record.amount.toFixed(2)
        }`,
    },
    {
      title: "Date",
      dataIndex: "processedAt",
      key: "processedAt",
      width: 140,
      render: (date: string) => dayjs(date).format("DD MMM, YYYY"),
    },
    {
      title: "Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      width: 100,
      render: (method: string) => method.replace("_", " "),
    },
    {
      title: "Source",
      dataIndex: "paymentSource",
      key: "paymentSource",
      width: 120,
      render: (source: string) => {
        if (!source) return "N/A";
        return source === "PAID_IN_GHANA" ? "Ghana" : "China";
      },
      filters: [
        { text: "Paid in Ghana", value: "PAID_IN_GHANA" },
        { text: "Paid in China", value: "PAID_IN_CHINA" },
      ],
    },
    // Add actions column if needed
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Receipt">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            >
              View
            </Button>
          </Tooltip>
          {userRole === "SUPER_ADMIN" && (
            <Tooltip title="Delete Payment">
              <Popconfirm
                title="Delete Payment"
                description="Are you sure you want to permanently delete this payment? This action cannot be undone."
                onConfirm={() => handleDelete(record.id)}
                okText="Yes, Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                >
                  Delete
                </Button>
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];
  return columns;
};
