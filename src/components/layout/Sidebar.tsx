// Sidebar.tsx
"use client";

import { Menu, Button } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { usePathname } from "next/navigation";
import { menuItems } from "@/components/AppLayout";
import { useEffect, useRef } from "react";

export function Sidebar({
  collapsed,
  setCollapsed,
  mobile,
  onClose,
  open,
  menuItems: customMenuItems,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobile?: boolean;
  onClose?: () => void;
  open?: boolean;
  menuItems?: { key: string; icon: React.ReactNode; label: string }[];
}) {
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const items = customMenuItems || menuItems;

  // Focus trap for mobile Drawer
  useEffect(() => {
    if (mobile && open && sidebarRef.current) {
      sidebarRef.current.focus();
    }
  }, [mobile, open]);

  return (
    <>
      {/* Desktop Sidebar */}
      {!mobile && (
        <aside
          className={`hidden lg:flex flex-col transition-all duration-200 ${
            collapsed ? "w-16" : "w-64 lg:w-72"
          } bg-gray-900 text-white overflow-y-auto h-screen fixed left-0 top-0 z-30`}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <span className={`font-bold text-lg ${collapsed ? "hidden" : "block"}`}>
              Admin Panel
            </span>
            <Button
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              type="text"
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            />
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[pathname]}
            items={items}
            style={{ border: "none", background: "transparent" }}
            onClick={({ key }) => {
              if (mobile && onClose) onClose();
              window.location.href = key;
            }}
          />
        </aside>
      )}

      {/* Mobile Drawer Sidebar */}
      {mobile && open && (
        <div
          ref={sidebarRef}
          tabIndex={-1}
          className="fixed inset-0 z-40 bg-black bg-opacity-40 flex"
          onClick={onClose}
          aria-modal="true"
          role="dialog"
        >
          <aside
            className="w-64 bg-gray-900 text-white h-full flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <span className="font-bold text-lg">Admin Panel</span>
              <Button
                icon={<MenuFoldOutlined />}
                type="text"
                onClick={onClose}
                aria-label="Close menu"
              />
            </div>
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[pathname]}
              items={items}
              style={{ border: "none", background: "transparent" }}
              onClick={({ key }) => {
                if (mobile && onClose) onClose();
                window.location.href = key;
              }}
            />
          </aside>
        </div>
      )}
    </>
  );
}
