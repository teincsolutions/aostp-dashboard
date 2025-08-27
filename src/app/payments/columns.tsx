// src/app/payments/columns.tsx
import { ColumnsType } from 'antd/es/table';
import { Payment } from '@/types/payment';
import { Tooltip } from 'antd';

export const columns: ColumnsType<Payment> = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 80,
  },
  {
    title: 'Customer',
    dataIndex: 'customerName',
    key: 'customerName',
    ellipsis: true,
    render: (text: string) => (
      <Tooltip title={text}>{text}</Tooltip>
    ),
  },
  {
    title: 'Amount',
    dataIndex: 'amount',
    key: 'amount',
    width: 120,
  },
  {
    title: 'Date',
    dataIndex: 'date',
    key: 'date',
    width: 140,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 100,
  },
  // Add actions column if needed
];
