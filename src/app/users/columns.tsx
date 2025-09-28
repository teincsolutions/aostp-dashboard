import { ColumnsType } from "antd/es/table";
import { Tooltip, Button, Dropdown } from "antd";
import { MoreOutlined } from "@ant-design/icons";
import { Modal } from "antd";
import type { MenuProps } from "antd";
import { User, Role, UserStatus } from "@/types/user";

interface UserActions {
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
    title: "Status",
    key: "status",
    render: (_: any, record: User) => {
      const userStatus = record.isActive ? UserStatus.ACTIVE : UserStatus.INACTIVE;
      return (
        <span className={userStatus === UserStatus.ACTIVE ? "text-green-600" : "text-red-600"}>
          {userStatus}
        </span>
      );
    },
    filters: [
      { text: "Active", value: UserStatus.ACTIVE },
      { text: "Inactive", value: UserStatus.INACTIVE },
    ],
    onFilter: (value, record) => {
      const userStatus = record.isActive ? UserStatus.ACTIVE : UserStatus.INACTIVE;
      return userStatus === value;
    },
  },
  {
    title: "Created At",
    dataIndex: "createdAt",
    key: "createdAt",
    render: (date: string) => (
      <span>{new Date(date).toLocaleString()}</span>
    ),
    sorter: true,
  },
  {
    title: "Actions",
    key: "actions",
    fixed: "right",
    width: 80,
    render: (_: any, record: User) => {
      const menuItems: MenuProps['items'] = [
        {
          key: 'edit',
          label: 'Edit',
          onClick: () => actions.onEdit(record),
        },
        {
          key: 'toggle',
          label: record.isActive ? 'Deactivate' : 'Activate',
          onClick: () => {
            Modal.confirm({
              title: record.isActive ? "Deactivate user?" : "Activate user?",
              onOk: () => actions.onToggleStatus(record.id, !record.isActive),
            });
          },
        },
        {
          key: 'reset',
          label: 'Reset Password',
          onClick: () => actions.onResetPassword(record),
        },
      ];

      return (
        <Dropdown menu={{ items: menuItems }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      );
    },
  },
];
}
