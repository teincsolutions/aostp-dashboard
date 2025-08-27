import React from 'react';
import { Button, Space, Tag, Popconfirm, Tooltip, Typography } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  BarChartOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Container } from '@/types/container';
import { ContainerStatus, ExportFormat } from '@/types/container';

const { Text } = Typography;

export const getContainerColumns = (
  onEditContainer: (container: Container) => void,
  onDeleteContainer: (id: string) => void,
  onUpdateStatus: (id: string, status: ContainerStatus) => void,
  onViewStatistics: (container: Container) => void,
  onExportManifest: (id: string, format: ExportFormat) => void,
  isDeleting: boolean,
  isUpdatingStatus: boolean,
  isExporting: boolean
): ColumnsType<Container> => [
  {
    title: 'Container Number',
    dataIndex: 'containerNumber',
    key: 'containerNumber',
    render: (containerNumber: string) => (
      <Text strong style={{ fontFamily: 'monospace' }}>
        {containerNumber}
      </Text>
    ),
    sorter: true,
  },
  {
    title: 'Vessel/Flight',
    dataIndex: 'vesselFlight',
    key: 'vesselFlight',
    render: (vesselFlight: string) => (
      <span style={{ fontFamily: 'monospace' }}>{vesselFlight || 'N/A'}</span>
    ),
  },
  {
    title: 'Loading Date',
    dataIndex: 'loadingDate',
    key: 'loadingDate',
    render: (date: string) => new Date(date).toLocaleDateString(),
    sorter: true,
  },
  {
    title: 'Destination',
    dataIndex: 'destinationCity',
    key: 'destinationCity',
    render: (destination: string) => (
      <span style={{ fontWeight: 'bold' }}>{destination}</span>
    ),
    filters: [
      { text: 'Filter by destination', value: 'destinationCity' },
    ],
  },
  {
    title: 'ETA',
    dataIndex: 'eta',
    key: 'eta',
    render: (date: string) => new Date(date).toLocaleDateString(),
    sorter: true,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (status: ContainerStatus) => {
      const colorMap = {
        [ContainerStatus.PLANNED]: 'blue',
        [ContainerStatus.LOADED]: 'orange',
        [ContainerStatus.SHIPPED]: 'purple',
        [ContainerStatus.ARRIVED]: 'green',
        [ContainerStatus.CLOSED]: 'default',
      };
      return (
        <Tag color={colorMap[status] || 'default'}>
          {status.replace('_', ' ')}
        </Tag>
      );
    },
    filters: [
      { text: 'Planned', value: ContainerStatus.PLANNED },
      { text: 'Loaded', value: ContainerStatus.LOADED },
      { text: 'Shipped', value: ContainerStatus.SHIPPED },
      { text: 'Arrived', value: ContainerStatus.ARRIVED },
      { text: 'Closed', value: ContainerStatus.CLOSED },
    ],
  },
  {
    title: 'Packing Lists',
    dataIndex: 'packingListCount',
    key: 'packingListCount',
    render: (count: number) => (
      <span style={{ fontWeight: 'bold' }}>{count || 0}</span>
    ),
    sorter: true,
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
    render: (_, record) => (
      <Space size="small">
        <Tooltip title="View Details & Statistics">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => onViewStatistics(record)}
          />
        </Tooltip>

        {record.status !== ContainerStatus.SHIPPED &&
         record.status !== ContainerStatus.ARRIVED &&
         record.status !== ContainerStatus.CLOSED && (
          <>
            <Tooltip title="Edit Container">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => onEditContainer(record)}
              />
            </Tooltip>

            <Tooltip title="Update Status">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => {
                  // Show status update modal/drawer
                  const nextStatus = getNextStatus(record.status);
                  if (nextStatus) {
                    onUpdateStatus(record.id, nextStatus);
                  }
                }}
                loading={isUpdatingStatus}
              />
            </Tooltip>
          </>
        )}

        <Tooltip title="Export Manifest">
          <Button
            type="text"
            icon={<DownloadOutlined />}
            onClick={() => {
              // Show export format selection
              onExportManifest(record.id, ExportFormat.PDF);
            }}
            loading={isExporting}
          />
        </Tooltip>

        {(record.status === ContainerStatus.PLANNED ||
          record.status === ContainerStatus.LOADED) && (
          <Tooltip title="Delete Container">
            <Popconfirm
              title="Are you sure you want to delete this container? This action cannot be undone."
              onConfirm={() => onDeleteContainer(record.id)}
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
        )}
      </Space>
    ),
  },
];

// Helper function to get next logical status
const getNextStatus = (currentStatus: ContainerStatus): ContainerStatus | null => {
  const statusFlow = [
    ContainerStatus.PLANNED,
    ContainerStatus.LOADED,
    ContainerStatus.SHIPPED,
    ContainerStatus.ARRIVED,
    ContainerStatus.CLOSED,
  ];

  const currentIndex = statusFlow.indexOf(currentStatus);
  if (currentIndex === -1 || currentIndex === statusFlow.length - 1) {
    return null; // Can't advance further
  }

  return statusFlow[currentIndex + 1];
};
