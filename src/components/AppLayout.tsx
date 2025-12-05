"use client";

import { useState } from "react";
import {
  DashboardOutlined,
  TeamOutlined,
  BoxPlotOutlined,
  SettingOutlined,
  UsergroupAddOutlined,
  FileTextOutlined,
  ContainerOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";
import type { ReactNode } from "react";
import { UserRole } from "@/types/common";

export type MenuItem = {
  key: string;
  icon: ReactNode;
  label: string;
  roles: UserRole[];
};

export const menuItems: Array<MenuItem> = [
  // Dashboard last (optional, or move to top if preferred)
  {
    key: "/dashboard",
    icon: <DashboardOutlined />,
    label: "Dashboard",
    roles: [
      "SUPER_ADMIN",
      "FINANCE_MANAGER",
      "OPERATIONS_CLERK",
      "PAYMENT_CLERK",
      "CUSTOMER",
    ],
  },
  // Package Intake first
  {
    key: "/package-intake",
    icon: <BoxPlotOutlined />,
    label: "Package Intake",
    roles: ["SUPER_ADMIN", "PAYMENT_CLERK", "OPERATIONS_CLERK"],
  },
  {
    key: "/package-delivery",
    icon: <BoxPlotOutlined />,
    label: "Package Delivery",
    roles: ["SUPER_ADMIN", "OPERATIONS_CLERK"],
  },

  // Group: Packages, Packing Lists, Warehouse, Containers
  {
    key: "/packages",
    icon: <BoxPlotOutlined />,
    label: "Packages",
    roles: ["SUPER_ADMIN", "OPERATIONS_CLERK"],
  },
  {
    key: "/packing-lists",
    icon: <FileTextOutlined />,
    label: "Packing Lists",
    roles: ["SUPER_ADMIN", "OPERATIONS_CLERK"],
  },
  {
    key: "/warehouse",
    icon: <BoxPlotOutlined />,
    label: "Warehouse",
    roles: ["SUPER_ADMIN", "OPERATIONS_CLERK"],
  },
  {
    key: "/containers",
    icon: <ContainerOutlined />,
    label: "Containers",
    roles: ["SUPER_ADMIN", "OPERATIONS_CLERK"],
  },

  // Group: Customers, Cities, Users
  {
    key: "/customers",
    icon: <TeamOutlined />,
    label: "Customers",
    roles: [
      "SUPER_ADMIN",
      "OPERATIONS_CLERK",
      "FINANCE_MANAGER",
      "PAYMENT_CLERK",
    ],
  },
  {
    key: "/cities",
    icon: <GlobalOutlined />,
    label: "Cities",
    roles: ["SUPER_ADMIN", "OPERATIONS_CLERK"],
  },
  {
    key: "/users",
    icon: <UsergroupAddOutlined />,
    label: "Users",
    roles: ["SUPER_ADMIN"],
  },

  // Group: Payments, Invoices, Exchange Rate
  {
    key: "/payments",
    icon: <FileTextOutlined />,
    label: "Payments",
    roles: ["SUPER_ADMIN", "FINANCE_MANAGER", "PAYMENT_CLERK"],
  },
  {
    key: "/invoices",
    icon: <FileTextOutlined />,
    label: "Invoices",
    roles: ["SUPER_ADMIN", "FINANCE_MANAGER", "PAYMENT_CLERK"],
  },
  {
    key: "/exchange-rate",
    icon: <SettingOutlined />,
    label: "Rate Management",
    roles: ["SUPER_ADMIN", "FINANCE_MANAGER"],
  },
  // Group: Notifications, Audit Logs, Settings
  {
    key: "/notifications",
    icon: <FileTextOutlined />,
    label: "Notifications",
    roles: [
      "SUPER_ADMIN",
      "OPERATIONS_CLERK",
      "FINANCE_MANAGER",
      "PAYMENT_CLERK",
    ],
  },
  {
    key: "/audit-logs",
    icon: <FileTextOutlined />,
    label: "Audit Logs",
    roles: ["SUPER_ADMIN"],
  },

  {
    key: "/settings",
    icon: <SettingOutlined />,
    label: "Settings",
    roles: ["SUPER_ADMIN"],
  },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user } = useAuth();

  // Filter menu items by role and remove 'roles' property for AntD Menu
  const filteredMenuItems = menuItems
    .filter((item) => item.roles?.includes(user?.role as UserRole))
    .map(({ roles, ...rest }) => rest);

  // Close Drawer on route change
  // (You may want to use useRouter/usePathname for this in production)

  return (
    <div className="min-h-screen flex flex-col flex-1">
      {/* Header */}
      <Header
        onHamburgerClick={() => setDrawerOpen(true)}
        title="Admin Dashboard"
      />

      {/* Sidebar (desktop) */}
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        menuItems={filteredMenuItems}
      />

      {/* Mobile Drawer Sidebar */}
      <Sidebar
        collapsed={false}
        setCollapsed={() => {}}
        mobile
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        menuItems={filteredMenuItems}
      />

      {/* Content */}
      <main className="flex-1 px-4 md:px-6 lg:px-8 py-4 lg:ml-72">
        {/* PageHeader slot could go here */}
        {children}
      </main>
    </div>
  );
}
