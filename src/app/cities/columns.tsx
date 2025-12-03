// src/app/cities/columns.tsx

import { ColumnsType } from "antd/es/table";
import { Button, Tooltip } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { City } from "@/types/exchangeRate";
import dayjs from "dayjs";

interface CityActions {
  onEdit: (city: City) => void;
  onDelete: (id: string) => void;
  loading?: {
    deleting?: boolean;
  };
}

export function getCityColumns(actions: CityActions): ColumnsType<City> {
  return [
    {
      title: "City Name",
      dataIndex: "name",
      key: "name",
      sorter: true,
      width: 200,
    },
    {
      title: "Country",
      dataIndex: "country",
      key: "country",
      sorter: true,
      width: 200,
      filters: [],
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: true,
      width: 160,
      render: (date: string) => dayjs(date).format("DD MMM, YYYY"),
    },
    {
      title: "Updated At",
      dataIndex: "updatedAt",
      key: "updatedAt",
      sorter: true,
      width: 160,
      render: (date: string) => dayjs(date).format("DD MMM, YYYY"),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_: unknown, record: City) => (
        <div style={{ display: "flex", gap: 8 }}>
          <Tooltip title="Edit">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => actions.onEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              icon={<DeleteOutlined />}
              size="small"
              loading={actions.loading?.deleting}
              onClick={() => actions.onDelete(record.id)}
              danger
            />
          </Tooltip>
        </div>
      ),
    },
  ];
}
