// src/app/exchange-rate/columns.tsx

import { ColumnsType } from "antd/es/table";
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
    render: (setBy: ExchangeRate["setBy"]) => setBy?.name || "-",
  },
  {
    title: "Created At",
    dataIndex: "createdAt",
    key: "createdAt",
    render: (date: string) => new Date(date).toLocaleString(),
  },
];
