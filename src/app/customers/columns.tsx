// src/app/customers/columns.tsx

import { ColumnsType } from 'antd/es/table';
import { Button, Tooltip } from 'antd';
import {
  EditOutlined,
  CheckOutlined,
  StopOutlined,
  BarChartOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import { Customer, CustomerStatus } from '@/types/customer';

interface CustomerActions {
  onEdit: (customer: Customer) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
  onViewStats: (customer: Customer) => void;
  onExport: (id: string) => void;
  loading?: {
    toggling?: boolean;
    exporting?: boolean;
  };
}

export function getCustomerColumns(actions: CustomerActions): ColumnsType<Customer> {
  return [
    {
      title: 'Customer Code',
      dataIndex: 'customerCode',
      key: 'customerCode',
      sorter: true,
      width: 140,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      width: 180,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: true,
      width: 200,
    },
    {
      title: 'Phone',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      sorter: true,
      width: 140,
    },
    {
      title: 'ID Type',
      dataIndex: 'idType',
      key: 'idType',
      width: 120,
      filters: [
        { text: 'NATIONAL_ID', value: 'NATIONAL_ID' },
        { text: 'PASSPORT', value: 'PASSPORT' },
        { text: 'DRIVER_LICENSE', value: 'DRIVER_LICENSE' },
      ],
    },
    {
      title: 'ID Number',
      dataIndex: 'idNumber',
      key: 'idNumber',
      width: 160,
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      width: 120,
      filters: [],
    },
    {
      title: 'Country',
      dataIndex: 'country',
      key: 'country',
      width: 120,
      filters: [],
    },
  {
    title: 'Status',
    dataIndex: 'isActive',
    key: 'isActive',
    width: 100,
    filters: [
      { text: 'Active', value: true },
      { text: 'Inactive', value: false },
    ],
    render: (isActive: boolean) =>
      isActive ? 'Active' : 'Inactive',
  },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: true,
      width: 160,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 220,
      render: (_: unknown, record: Customer) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Tooltip title="Edit">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => actions.onEdit(record)}
            />
          </Tooltip>
          <Tooltip title={record.isActive ? 'Deactivate' : 'Activate'}>
            <Button
              icon={record.isActive ? <StopOutlined /> : <CheckOutlined />}
              size="small"
              loading={actions.loading?.toggling}
              onClick={() => actions.onToggleStatus(record.id, !record.isActive)}
              danger={record.isActive}
              type={record.isActive ? 'default' : 'primary'}
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
        </div>
      ),
    },
  ];
}
