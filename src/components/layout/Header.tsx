// Header.tsx
"use client";

import { Button, Dropdown, Avatar } from "antd";
import { MenuFoldOutlined } from "@ant-design/icons";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

const userMenuItems = [
  {
    key: "profile",
    label: "Profile",
  },
  {
    key: "logout",
    label: "Logout",
  },
];

export function Header({
  onHamburgerClick,
  title,
  actions,
}: {
  onHamburgerClick: () => void;
  title: ReactNode;
  actions?: ReactNode;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleUserMenuClick = (e: any) => {
    if (e.key === "logout") logout();
    if (e.key === "profile") router.push("/profile");
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b flex items-center justify-between gap-3 px-4 md:px-6 lg:px-8 h-14">
      <Button
        className="lg:hidden"
        icon={<MenuFoldOutlined />}
        aria-label="Open menu"
        type="text"
        onClick={onHamburgerClick}
      />
      <div className="flex-1 font-semibold text-lg">{title}</div>
      {actions}
     
    </header>
  );
}
