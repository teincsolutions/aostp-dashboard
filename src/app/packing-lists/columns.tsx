import React from 'react';
import { Button, Space, Tag, Popconfirm, Tooltip, Dropdown } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownloadOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import type { PackingList } from '@/types/packingList';
import { PackingListStatus } from '@/types/packingList';

export const getPackingListColumns = (
  onEditPackingList: (packingList: PackingList) => void,
  onDeletePackingList: (id: string) => void,
  onViewDetails: (packingList: PackingList) => void,
  onExportPackingList: (id: string, format: 'PDF' | 'EXCEL') => void,
  isDeleting: boolean,
  isExporting: boolean
): ColumnsType<PackingList> => [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    sorter: true,
    render: (name: string) => (
      <span style={{ fontWeight: 500 }}>{name}</span>
    ),
  },
  {
    title: 'Loading City',
    dataIndex: 'loadingCity',
    key: 'loadingCity',
    render: (city: string) => (
      <span>{city || 'N/A'}</span>
    ),
    filters: [
      { text: 'Accra', value: 'Accra' },
      { text: 'Tema', value: 'Tema' },
      { text: 'Kumasi', value: 'Kumasi' },
    ],
  },
  {
    title: 'Loading Date',
    dataIndex: 'loadingDate',
    key: 'loadingDate',
    render: (date: string) => new Date(date).toLocaleDateString(),
    sorter: true,
  },
  {
    title: 'ETA',
    dataIndex: 'eta',
    key: 'eta',
    render: (eta: string) => eta ? new Date(eta).toLocaleDateString() : 'N/A',
    sorter: true,
  },
  {
    title: 'Package Count',
    dataIndex: 'packageCount',
    key: 'packageCount',
    render: (count: number) => (
      <Tag color="blue">{count || 0}</Tag>
    ),
    sorter: true,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (status: PackingListStatus) => {
      const statusColors = {
        [PackingListStatus.DRAFT]: 'default',
        [PackingListStatus.PLANNED]: 'orange',
        [PackingListStatus.LOADING]: 'purple',
        [PackingListStatus.LOADED]: 'blue',
        [PackingListStatus.IN_TRANSIT]: 'cyan',
        [PackingListStatus.DELIVERED]: 'green',
        [PackingListStatus.CANCELLED]: 'red',
      };

      return (
        <Tag color={statusColors[status]}>
          {status.replace('_', ' ')}
        </Tag>
      );
    },
    filters: [
      { text: 'Draft', value: PackingListStatus.DRAFT },
      { text: 'Planned', value: PackingListStatus.PLANNED },
      { text: 'Loading', value: PackingListStatus.LOADING },
      { text: 'Loaded', value: PackingListStatus.LOADED },
      { text: 'In Transit', value: PackingListStatus.IN_TRANSIT },
      { text: 'Delivered', value: PackingListStatus.DELIVERED },
      { text: 'Cancelled', value: PackingListStatus.CANCELLED },
    ],
  },
  {
    title: 'Created At',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (date: string) => new Date(date).toLocaleDateString(),
    sorter: true,
  },
  {
    title: 'Actions',
    key: 'actions',
    render: (_, record) => {
      const exportMenuItems: MenuProps['items'] = [
        {
          key: 'pdf',
          label: 'Export as PDF',
          icon: <DownloadOutlined />,
          onClick: () => onExportPackingList(record.id, 'PDF'),
          disabled: isExporting,
        },
        {
          key: 'excel',
          label: 'Export as Excel',
          icon: <DownloadOutlined />,
          onClick: () => onExportPackingList(record.id, 'EXCEL'),
          disabled: isExporting,
        },
      ];

      return (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onViewDetails(record)}
            />
          </Tooltip>

          <Tooltip title="Edit Packing List">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEditPackingList(record)}
            />
          </Tooltip>

          <Dropdown
            menu={{ items: exportMenuItems }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Button
              type="text"
              icon={<MoreOutlined />}
              loading={isExporting}
            />
          </Dropdown>

          <Tooltip title="Delete Packing List">
            <Popconfirm
              title="Are you sure you want to delete this packing list? This action cannot be undone."
              onConfirm={() => onDeletePackingList(record.id)}
              okText="Yes"
              cancelText="No"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="text"
                icon={<DeleteOutlined />}
                loading={isDeleting}
                danger
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      );
    },
  },
];
