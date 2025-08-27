// UserMenu.tsx
"use client";

import { Dropdown, Avatar } from "antd";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

const userMenuItems = [
  {
    key: "profile",
    icon: <UserOutlined />,
    label: "Profile",
  },
  {
    key: "logout",
    icon: <LogoutOutlined />,
    label: "Logout",
  },
];

export function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleUserMenuClick = (e: { key: string }) => {
    if (e.key === "logout") logout();
    if (e.key === "profile") router.push("/profile");
  };

  return (
    <Dropdown
      menu={{
        items: userMenuItems,
        onClick: handleUserMenuClick,
      }}
      placement="bottomRight"
    >
      <Avatar
        style={{ cursor: "pointer" }}
        src={user?.avatarUrl}
        icon={!user?.avatarUrl ? <UserOutlined /> : undefined}
      />
    </Dropdown>
  );
}
