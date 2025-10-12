import React from "react";
import { Button, Space, Tag, Popconfirm, Tooltip } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  BoxPlotOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { PackingList } from "@/types/packingList";
import { PackingListStatus } from "@/types/packingList";
export const packingListStatusColors = {
  [PackingListStatus.DRAFT]: "default",
  [PackingListStatus.POSTED]: "green",
  [PackingListStatus.FINALIZED]: "orange",
};

export const getPackingListColumns = (
  onEditPackingList: (packingList: PackingList) => void,
  onDeletePackingList: (id: string) => void,
  onViewDetails: (packingList: PackingList) => void,
  isDeleting: boolean,
  onManagePackages?: (packingList: PackingList) => void
): ColumnsType<PackingList> => [
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
    sorter: true,
    render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span>,
  },

  {
    title: "Loading Date",
    dataIndex: "loadingDate",
    key: "loadingDate",
    render: (date: string) => new Date(date).toLocaleDateString(),
    sorter: true,
  },

  {
    title: "ETA",
    dataIndex: "eta",
    key: "eta",
    render: (eta: string) => (eta ? new Date(eta).toLocaleDateString() : "N/A"),
    sorter: true,
  },
  {
    title: "Destination City",
    dataIndex: "destinationCity",
    key: "destinationCity",
    render: (city: string) => <span>{city || "N/A"}</span>,
  },
  {
    title: "Container",
    key: "container",
    render: (_, record: PackingList) => (
      <span>
        {`${record.container?.containerNumber} (${record.container?.containerType})` ||
          "N/A"}
      </span>
    ),
  },
  {
    title: "Total Packages",
    dataIndex: "totalPackages",
    key: "totalPackages",
    render: (count: number) => <Tag color="blue">{count || 0}</Tag>,
    sorter: true,
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status: PackingListStatus) => {
      return (
        <Tag color={packingListStatusColors[status]}>{status?.replace("_", " ")}</Tag>
      );
    },
    filters: [
      { text: "Draft", value: PackingListStatus.DRAFT },
      { text: "Posted", value: PackingListStatus.POSTED },
      { text: "Finalized", value: PackingListStatus.FINALIZED },
    ],
  },
  {
    title: "Created At",
    dataIndex: "createdAt",
    key: "createdAt",
    render: (date: string) => new Date(date).toLocaleDateString(),
    sorter: true,
  },
  {
    title: "Actions",
    key: "actions",
    render: (_, record) => {
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
          {onManagePackages && (
            <Tooltip title="Manage Packages">
              <Button
                type="text"
                icon={<BoxPlotOutlined />}
                onClick={() => onManagePackages(record)}
              />
            </Tooltip>
          )}

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
