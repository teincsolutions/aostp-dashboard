"use client";

import { Layout, Menu, Avatar, Dropdown } from "antd";
import {
  UserOutlined,
  DashboardOutlined,
  UsergroupAddOutlined,
  SettingOutlined,
  LogoutOutlined,
  TeamOutlined,
  BoxPlotOutlined,
  FileTextOutlined,
  ContainerOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const { Header, Sider, Content } = Layout;

interface AppLayoutProps {
  children: ReactNode;
}

const menuItems = [
  {
    key: "/dashboard",
    icon: <DashboardOutlined />,
    label: <Link href="/dashboard">Dashboard</Link>,
  },
  {
    key: "/customers",
    icon: <TeamOutlined />,
    label: <Link href="/customers">Customers</Link>,
  },
  {
    key: "/packages",
    icon: <BoxPlotOutlined />,
    label: <Link href="/packages">Packages</Link>,
  },
  {
    key: "/package-intake",
    icon: <BoxPlotOutlined />,
    label: <Link href="/package-intake">Package Intake</Link>,
  },
  {
    key: "/packing-lists",
    icon: <FileTextOutlined />,
    label: <Link href="/packing-lists">Packing Lists</Link>,
  },
  {
    key: "/containers",
    icon: <ContainerOutlined />,
    label: <Link href="/containers">Containers</Link>,
  },
  {
    key: "/warehouse",
    icon: <BoxPlotOutlined />,
    label: <Link href="/warehouse">Warehouse</Link>,
  },
  {
    key: "/payments",
    icon: <FileTextOutlined />,
    label: <Link href="/payments">Payments</Link>,
  },
  {
    key: "/exchange-rate",
    icon: <SettingOutlined />,
    label: <Link href="/exchange-rate">Exchange Rate</Link>,
  },
  {
    key: "/notifications",
    icon: <FileTextOutlined />,
    label: <Link href="/notifications">Notifications</Link>,
  },
  {
    key: "/audit-logs",
    icon: <FileTextOutlined />,
    label: <Link href="/audit-logs">Audit Logs</Link>,
  },
  {
    key: "/users",
    icon: <UsergroupAddOutlined />,
    label: <Link href="/users">Users</Link>,
  },
  {
    key: "/settings",
    icon: <SettingOutlined />,
    label: <Link href="/settings">Settings</Link>,
  },
];

const userMenuItems: MenuProps["items"] = [
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

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleUserMenuClick: MenuProps["onClick"] = (e) => {
    if (e.key === "logout") {
      logout();
    }
    if (e.key === "profile") {
      router.push("/profile");
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider theme="dark" collapsible>
        <div style={{ padding: "16px", textAlign: "center" }}>
          <h2 style={{ color: "white", margin: 0 }}>Admin Panel</h2>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: "#fff",
            padding: "0 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 1px 4px rgba(0,21,41,.08)",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "18px" }}>Admin Dashboard</h1>
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
              onClick={() => router.push("/profile")}
            />
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            background: "#fff",
            minHeight: 280,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
