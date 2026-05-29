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
  BarChartOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";
import {
  CHAT_ACCESS_ROLES,
  CUSTOMER_ACCESS_ROLES,
  CUSTOMER_LEAGUE_REPORT_ACCESS_ROLES,
  DEBTOR_REPORT_ACCESS_ROLES,
  END_OF_DAY_REPORT_ACCESS_ROLES,
  EXCHANGE_RATE_ACCESS_ROLES,
  GENERAL_REPORT_ACCESS_ROLES,
  INVOICE_ACCESS_ROLES,
  PACKAGE_INTAKE_ACCESS_ROLES,
  PACKAGE_PICKUP_ACCESS_ROLES,
  PACKING_LIST_ACCESS_ROLES,
  PACKING_LIST_REPORT_ACCESS_ROLES,
  PAYMENT_ACCESS_ROLES,
  PAYMENT_REPORT_ACCESS_ROLES,
  PICKUP_LIST_ACCESS_ROLES,
  PICKUP_REPORT_ACCESS_ROLES,
  REPORTS_MENU_ACCESS_ROLES,
  SHIPPING_METHOD_REPORT_ACCESS_ROLES,
  WAREHOUSE_REPORT_ACCESS_ROLES,
} from "@/lib/access-control";
import type { ReactNode } from "react";
import { UserRole } from "@/types/common";

export type MenuItem = {
  key: string;
  icon: ReactNode;
  label: string;
  roles: UserRole[];
  children?: MenuItem[];
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
    roles: PACKAGE_INTAKE_ACCESS_ROLES,
  },
  {
    key: "/package-delivery",
    icon: <BoxPlotOutlined />,
    label: "Package Pickup",
    roles: PACKAGE_PICKUP_ACCESS_ROLES,
  },
  {
    key: "/pickups",
    icon: <BoxPlotOutlined />,
    label: "Pickups List",
    roles: PICKUP_LIST_ACCESS_ROLES,
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
    roles: PACKING_LIST_ACCESS_ROLES,
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
    roles: CUSTOMER_ACCESS_ROLES,
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
    roles: PAYMENT_ACCESS_ROLES,
  },
  {
    key: "/invoices",
    icon: <FileTextOutlined />,
    label: "Invoices",
    roles: INVOICE_ACCESS_ROLES,
  },
  // Reports submenu
  {
    key: "/reports",
    icon: <BarChartOutlined />,
    label: "Reports",
    roles: REPORTS_MENU_ACCESS_ROLES,
    children: [
      {
        key: "/reports/payments",
        icon: <FileTextOutlined />,
        label: "Payments Report",
        roles: PAYMENT_REPORT_ACCESS_ROLES,
      },
      {
        key: "/reports/packing-lists",
        icon: <FileTextOutlined />,
        label: "Packing List Report",
        roles: PACKING_LIST_REPORT_ACCESS_ROLES,
      },
      {
        key: "/reports/customer-league",
        icon: <FileTextOutlined />,
        label: "Customer League Report",
        roles: CUSTOMER_LEAGUE_REPORT_ACCESS_ROLES,
      },
      {
        key: "/reports/shipping-method",
        icon: <FileTextOutlined />,
        label: "Shipping Method Report",
        roles: SHIPPING_METHOD_REPORT_ACCESS_ROLES,
      },
      {
        key: "/reports/general",
        icon: <FileTextOutlined />,
        label: "General Report",
        roles: GENERAL_REPORT_ACCESS_ROLES,
      },
      {
        key: "/reports/pickups",
        icon: <FileTextOutlined />,
        label: "Pickup Report",
        roles: PICKUP_REPORT_ACCESS_ROLES,
      },
      {
        key: "/reports/warehouses",
        icon: <FileTextOutlined />,
        label: "Warehouse Report",
        roles: WAREHOUSE_REPORT_ACCESS_ROLES,
      },
      {
        key: "/reports/debtors",
        icon: <FileTextOutlined />,
        label: "Debtors Report",
        roles: DEBTOR_REPORT_ACCESS_ROLES,
      },
      {
        key: "/reports/end-of-day",
        icon: <FileTextOutlined />,
        label: "End of Day Report",
        roles: END_OF_DAY_REPORT_ACCESS_ROLES,
      },
    ],
  },
  {
    key: "/exchange-rate",
    icon: <SettingOutlined />,
    label: "Rate Management",
    roles: EXCHANGE_RATE_ACCESS_ROLES,
  },
  // Group: Notifications, Audit Logs, Settings
  {
    key: "/chat",
    icon: <MessageOutlined />,
    label: "Chat",
    roles: CHAT_ACCESS_ROLES,
  },
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
    .map(({ roles, children, ...rest }) => {
      // Filter children if they exist
      if (children) {
        const filteredChildren = children
          .filter((child) => child.roles?.includes(user?.role as UserRole))
          .map(({ roles: childRoles, ...childRest }) => childRest);

        // Only include parent if it has accessible children
        if (filteredChildren.length > 0) {
          return { ...rest, children: filteredChildren };
        }
        return null;
      }
      return rest;
    })
    .filter((item): item is Exclude<typeof item, null> => item !== null);

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
