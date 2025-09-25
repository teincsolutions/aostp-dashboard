// src/app/payments/columns.tsx
import { ColumnsType } from 'antd/es/table';
import { Payment } from '@/types/invoice';
import { Tooltip } from 'antd';

export const columns: ColumnsType<Payment> = [
  {
    title: 'ID',
    dataIndex: 'paymentCode',
    key: 'paymentCode',
    width: 80,
  },
  {
    title: 'Customer',
    key: 'customer',
    ellipsis: true,
    render: (_, record) => (
      <Tooltip title={`${record.customer.firstName} ${record.customer.lastName}`}>
        {record.customer.firstName} {record.customer.lastName}
      </Tooltip>
    ),
  },
  {
    title: 'Amount',
    key: 'amount',
    width: 120,
    render: (_, record) => `${record.currency} ${record.amount.toLocaleString()}`,
  },
  {
    title: 'Date',
    dataIndex: 'processedAt',
    key: 'processedAt',
    width: 140,
    render: (date: string) => new Date(date).toLocaleDateString(),
  },
  {
    title: 'Method',
    dataIndex: 'paymentMethod',
    key: 'paymentMethod',
    width: 100,
    render: (method: string) => method.replace('_', ' '),
  },
  // Add actions column if needed
];
