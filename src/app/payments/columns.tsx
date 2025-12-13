// src/app/payments/columns.tsx
import { ColumnsType } from "antd/es/table";
import { Button, Popconfirm, Space, Tooltip } from "antd";
import { Payment } from "@/types/payment";
import dayjs from "dayjs";

export const getPaymentColumns = ({
  handleDelete,
  handleView,
}: {
  handleDelete: (id: string) => void;
  handleView: (payment: Payment) => void;
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
          title={`${record.customer.firstName} ${record.customer.lastName}`}
        >
          {record.customer.firstName} {record.customer.lastName}
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
    // Add actions column if needed
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleView(record)}>
            View
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this payment?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];
  return columns;
};
