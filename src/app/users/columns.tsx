import { ColumnsType } from "antd/es/table";
import { Tooltip, Button, Popconfirm } from "antd";
import { User, Role, UserStatus } from "@/types/user";

export const columns: ColumnsType<User> = [
  {
    title: "Name",
    dataIndex: "name",
    key: "name",
    ellipsis: true,
    render: (text: string) => (
      <Tooltip title={text} placement="topLeft">
        {text}
      </Tooltip>
    ),
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
    title: "Roles",
    dataIndex: "roles",
    key: "roles",
    render: (roles: Role[]) => (
      <span>
        {roles.map((role) => (
          <span key={role} className="mr-1 px-2 py-1 rounded bg-gray-100 text-xs">{role}</span>
        ))}
      </span>
    ),
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    render: (status: UserStatus) => (
      <span className={status === UserStatus.ACTIVE ? "text-green-600" : "text-red-600"}>
        {status}
      </span>
    ),
    filters: [
      { text: "Active", value: UserStatus.ACTIVE },
      { text: "Inactive", value: UserStatus.INACTIVE },
    ],
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
    width: 180,
    render: (_: any, record: User) => (
      <div className="flex gap-2">
        <Button type="link" size="small">
          Edit
        </Button>
        <Popconfirm
          title={record.status === UserStatus.ACTIVE ? "Deactivate user?" : "Activate user?"}
          okText="Yes"
          cancelText="No"
        >
          <Button type="link" size="small">
            {record.status === UserStatus.ACTIVE ? "Deactivate" : "Activate"}
          </Button>
        </Popconfirm>
        <Button type="link" size="small" disabled>
          Reset Password
        </Button>
      </div>
    ),
  },
];
