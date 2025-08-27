"use client";

import { useState } from "react";
import { Drawer } from "antd";
import {
  DashboardOutlined,
  TeamOutlined,
  BoxPlotOutlined,
  FileTextOutlined,
  ContainerOutlined,
  SettingOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { UserMenu } from "@/components/layout/UserMenu";
import type { ReactNode } from "react";

export const menuItems = [
  {
    key: "/dashboard",
    icon: <DashboardOutlined />,
    label: "Dashboard",
  },
  {
    key: "/customers",
    icon: <TeamOutlined />,
    label: "Customers",
  },
  {
    key: "/packages",
    icon: <BoxPlotOutlined />,
    label: "Packages",
  },
  {
    key: "/package-intake",
    icon: <BoxPlotOutlined />,
    label: "Package Intake",
  },
  {
    key: "/packing-lists",
    icon: <FileTextOutlined />,
    label: "Packing Lists",
  },
  {
    key: "/containers",
    icon: <ContainerOutlined />,
    label: "Containers",
  },
  {
    key: "/warehouse",
    icon: <BoxPlotOutlined />,
    label: "Warehouse",
  },
  {
    key: "/payments",
    icon: <FileTextOutlined />,
    label: "Payments",
  },
  {
    key: "/exchange-rate",
    icon: <SettingOutlined />,
    label: "Exchange Rate",
  },
  {
    key: "/notifications",
    icon: <FileTextOutlined />,
    label: "Notifications",
  },
  {
    key: "/audit-logs",
    icon: <FileTextOutlined />,
    label: "Audit Logs",
  },
  {
    key: "/users",
    icon: <UsergroupAddOutlined />,
    label: "Users",
  },
  {
    key: "/settings",
    icon: <SettingOutlined />,
    label: "Settings",
  },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close Drawer on route change
  // (You may want to use useRouter/usePathname for this in production)

  return (
    <div className="min-h-screen flex flex-col flex-1 w-full">
      {/* Header */}
      <Header
        onHamburgerClick={() => setDrawerOpen(true)}
        title="Admin Dashboard"
        actions={<UserMenu />}
      />

      {/* Sidebar (desktop) */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Mobile Drawer Sidebar */}
      <Sidebar
        collapsed={false}
        setCollapsed={() => {}}
        mobile
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      {/* Content */}
      <main className="flex-1 px-4 md:px-6 lg:px-8 py-4 max-w-7xl mx-auto w-full">
        {/* PageHeader slot could go here */}
        {children}
      </main>
    </div>
  );
}
