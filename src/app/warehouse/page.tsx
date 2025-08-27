'use client';

import { useState } from "react";
import { Table, Empty, Result, notification, Button, DatePicker, Select, Input, Space } from "antd";
import type {
  TablePaginationConfig,
  FilterValue,
  SorterResult,
  TableCurrentDataSource,
} from "antd/es/table/interface";
import { columns } from "@/app/warehouse/columns";
import { useWarehousePackages } from "@/hooks/useWarehouse";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuthStore } from "@/store/authStore";
import { WarehousePackage } from "@/types/warehouse";

const { RangePicker } = DatePicker;

const allowedRoles = ["OPERATIONS_CLERK", "SUPER_ADMIN"];

export default function WarehousePage() {
  const user = useAuthStore((s) => s.user);
  const [filters, setFilters] = useState<{
    warehouseLocation?: string;
    status?: string;
    daysInWarehouseFrom?: number;
    daysInWarehouseTo?: number;
    dateFrom?: string;
    dateTo?: string;
    search: string;
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: "desc" | "asc" | undefined;
  }>({
    warehouseLocation: undefined,
    status: undefined,
    daysInWarehouseFrom: undefined,
    daysInWarehouseTo: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    search: "",
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const { data, isLoading, isError, error } = useWarehousePackages(filters);

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <AppLayout>
        <AuthGuard>
          <Result
            status="403"
            title="Unauthorized"
            subTitle="You do not have access to this page."
          />
        </AuthGuard>
      </AppLayout>
    );
  }

  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<WarehousePackage> | SorterResult<WarehousePackage>[],
    extra: TableCurrentDataSource<WarehousePackage>
  ) => {
    let status: string | undefined = undefined;
    if (Array.isArray(filters.status) && typeof filters.status[0] === "string") {
      status = filters.status[0] as string;
    }
    setFilters((prev) => ({
      ...prev,
      page: pagination.current ?? 1,
      limit: pagination.pageSize ?? 10,
      sortBy: Array.isArray(sorter)
        ? typeof sorter[0]?.field === "string"
          ? sorter[0].field
          : "createdAt"
        : typeof sorter.field === "string"
        ? sorter.field
        : "createdAt",
      sortOrder: Array.isArray(sorter)
        ? sorter[0]?.order === "ascend"
          ? "asc"
          : "desc"
        : sorter.order === "ascend"
        ? "asc"
        : "desc",
      status,
    }));
  };

  const handleFilterChange = (key: string, value: string | number | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handleDateRange = (
    dates: [import("dayjs").Dayjs | null, import("dayjs").Dayjs | null] | null,
    dateStrings: [string, string]
  ) => {
    setFilters((prev) => ({
      ...prev,
      dateFrom: dateStrings[0] || undefined,
      dateTo: dateStrings[1] || undefined,
      page: 1,
    }));
  };

  return (
    <AppLayout>
      <AuthGuard>
        <div className="p-6">
          <h1 className="text-xl font-semibold mb-4">Warehouse Management</h1>
          <Space wrap className="mb-4">
            <Input.Search
              placeholder="Search Tracking # / Customer"
              allowClear
              onSearch={(v) => handleFilterChange("search", v)}
              style={{ width: 220 }}
            />
            <Select
              placeholder="Location"
              allowClear
              style={{ width: 140 }}
              onChange={(v) => handleFilterChange("warehouseLocation", v)}
            >
              {/* TODO: Populate locations dynamically */}
              <Select.Option value="01">01</Select.Option>
              <Select.Option value="02">02</Select.Option>
              <Select.Option value="03">03</Select.Option>
            </Select>
            <Select
              placeholder="Status"
              allowClear
              style={{ width: 140 }}
              onChange={(v) => handleFilterChange("status", v)}
            >
              <Select.Option value="RECEIVED">Received</Select.Option>
              <Select.Option value="DISPATCHED">Dispatched</Select.Option>
              <Select.Option value="LEFT_WAREHOUSE">Left Warehouse</Select.Option>
            </Select>
            <Input
              placeholder="Days Min"
              type="number"
              style={{ width: 100 }}
              onChange={(e) => handleFilterChange("daysInWarehouseFrom", e.target.value ? Number(e.target.value) : undefined)}
            />
            <Input
              placeholder="Days Max"
              type="number"
              style={{ width: 100 }}
              onChange={(e) => handleFilterChange("daysInWarehouseTo", e.target.value ? Number(e.target.value) : undefined)}
            />
            <RangePicker onChange={handleDateRange} />
          </Space>
          <Table
            columns={columns}
            dataSource={data?.data || []}
            rowKey="id"
            loading={isLoading}
            pagination={{
              current: filters.page,
              pageSize: filters.limit,
              total: data?.total || 0,
              showSizeChanger: true,
            }}
            onChange={handleTableChange}
            locale={{ emptyText: <Empty /> }}
            scroll={{ x: true }}
            size="middle"
          />
          {isError && (
            <Result
              status="error"
              title="Failed to load warehouse packages"
              subTitle={error?.message || "Unknown error"}
            />
          )}
        </div>
      </AuthGuard>
    </AppLayout>
  );
}
