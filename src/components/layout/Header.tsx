// Header.tsx
"use client";

import { Button, Dropdown, Avatar, Select } from "antd";
import { MenuFoldOutlined } from "@ant-design/icons";
import { useAuth } from "@/hooks/useAuth";
import { useWarehouses } from "@/hooks/useWarehouse";
import { useWarehouseStore } from "@/store/warehouseStore";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

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

  // Warehouse management
  const { data: warehouses, isLoading: warehousesLoading } = useWarehouses();
  const { selectedWarehouseId, setSelectedWarehouseId } = useWarehouseStore();

  // Initialize warehouse selection
  useEffect(() => {
    if (!selectedWarehouseId && warehouses?.data?.[0]) {
      setSelectedWarehouseId(warehouses.data[0].id);
    }
  }, [warehouses, selectedWarehouseId, setSelectedWarehouseId]);

  const selectedWarehouse = warehouses?.data?.find(w => w.id === selectedWarehouseId);

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

      {/* Warehouse Selector */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">Warehouse:</span>
        <Select
          value={selectedWarehouseId || undefined}
          onChange={setSelectedWarehouseId}
          loading={warehousesLoading}
          placeholder="Select warehouse"
          style={{ width: 200 }}
          size="small"
        >
          {warehouses?.data?.map((warehouse) => (
            <Select.Option key={warehouse.id} value={warehouse.id}>
              {warehouse.warehouseId} - {warehouse.name}
            </Select.Option>
          ))}
        </Select>
      </div>

      {actions}
    </header>
  );
}
