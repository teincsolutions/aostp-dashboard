import { ColumnsType } from "antd/es/table";
import { Tooltip, Button, Dropdown, Popconfirm, Space } from "antd";
import {
  MoreOutlined,
  EyeOutlined,
  EditOutlined,
  StopOutlined,
  CheckCircleOutlined,
  KeyOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { User, Role, UserStatus } from "@/types/user";

interface UserActions {
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
  onResetPassword: (user: User) => void;
}

export function getUserColumns(actions: UserActions): ColumnsType<User> {
  return [
    {
      title: "Name",
      key: "name",
      ellipsis: true,
      render: (_: any, record: User) => {
        const fullName = `${record.firstName} ${record.lastName}`;
        return (
          <Tooltip title={fullName} placement="topLeft">
            {fullName}
          </Tooltip>
        );
      },
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text} placement="topLeft">
          {text}
        </Tooltip>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role: Role) => (
        <span className="px-2 py-1 rounded bg-gray-100 text-xs">{role}</span>
      ),
    },
    {
      title: "Warehouse",
      key: "warehouse",
      render: (_: any, record: User) => {
        if (!record.warehouse) return <span>-</span>;
        return (
          <span className="px-2 py-1 rounded bg-blue-100 text-xs">
            {record.warehouse.name}
          </span>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      render: (_: any, record: User) => {
        const userStatus = record.isActive
          ? UserStatus.ACTIVE
          : UserStatus.INACTIVE;
        return (
          <span
            className={
              userStatus === UserStatus.ACTIVE
                ? "text-green-600"
                : "text-red-600"
            }
          >
            {userStatus}
          </span>
        );
      },
      filters: [
        { text: "Active", value: UserStatus.ACTIVE },
        { text: "Inactive", value: UserStatus.INACTIVE },
      ],
      onFilter: (value, record) => {
        const userStatus = record.isActive
          ? UserStatus.ACTIVE
          : UserStatus.INACTIVE;
        return userStatus === value;
      },
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => <span>{new Date(date).toLocaleString()}</span>,
      sorter: true,
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 200,
      render: (_: any, record: User) => {
        const isActivating = !record.isActive;
        return (
          <Space size="small">
            <Tooltip title="View Details">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => actions.onView(record)}
              />
            </Tooltip>

            <Tooltip title="Edit User">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => actions.onEdit(record)}
              />
            </Tooltip>

            <Tooltip title={isActivating ? "Activate User" : "Deactivate User"}>
              <Popconfirm
                title={isActivating ? "Activate user?" : "Deactivate user?"}
                description={`Are you sure you want to ${
                  isActivating ? "activate" : "deactivate"
                } ${record.firstName} ${record.lastName}?`}
                onConfirm={() =>
                  actions.onToggleStatus(record.id, isActivating)
                }
                okText={isActivating ? "Activate" : "Deactivate"}
                cancelText="Cancel"
                okButtonProps={{
                  danger: !isActivating,
                  type: isActivating ? "primary" : "default",
                }}
              >
                <Button
                  type="text"
                  icon={
                    isActivating ? <CheckCircleOutlined /> : <StopOutlined />
                  }
                  danger={!isActivating}
                />
              </Popconfirm>
            </Tooltip>

            <Tooltip title="Reset Password">
              <Button
                type="text"
                icon={<KeyOutlined />}
                onClick={() => actions.onResetPassword(record)}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];
}
