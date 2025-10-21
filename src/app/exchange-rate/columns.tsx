// src/app/exchange-rate/columns.tsx

import { ColumnsType } from "antd/es/table";
import { Button, Space } from "antd";
import { ExchangeRate } from "@/types/exchangeRate";

export const exchangeRateColumns: ColumnsType<ExchangeRate> = [
  {
    title: "Rate",
    dataIndex: "rate",
    key: "rate",
    render: (rate: number) => rate.toFixed(4),
  },
  {
    title: "Effective From",
    dataIndex: "effectiveFrom",
    key: "effectiveFrom",
    render: (date: string) => new Date(date).toLocaleString(),
  },
  {
    title: "Set By",
    dataIndex: "setBy",
    key: "setBy",
    render: (setBy: ExchangeRate["setBy"]) =>
      `${setBy?.firstName} ${setBy?.lastName}` || "-",
  },
  {
    title: "Created At",
    dataIndex: "createdAt",
    key: "createdAt",
    render: (date: string) => new Date(date).toLocaleString(),
  },
  {
    title: "Actions",
    key: "actions",
    render: (record: ExchangeRate) => (
      <Space size="middle">
        {!record.isActive && (
          <Button
            danger
            onClick={() =>
              window.confirm(
                "Are you sure you want to delete this exchange rate?"
              ) && window.location.reload()
            }
            // Note: Need to pass delete function from component
          >
            Delete
          </Button>
        )}
      </Space>
    ),
  },
];
