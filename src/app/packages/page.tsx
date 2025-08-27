"use client";

import React, { useState } from "react";
import { Table, Input, Select, Spin, Empty } from "antd";
import { columns } from "@/app/packages/columns";
import { usePackageIntake } from "@/hooks/usePackageIntake";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { PackageStatus, ShipmentType } from "@/types/package";

const { Search } = Input;

const statusOptions = Object.values(PackageStatus).map((status) => ({
  label: status,
  value: status,
}));

const shipmentTypeOptions = [
  { label: "Air", value: ShipmentType.AIR },
  { label: "Sea", value: ShipmentType.SEA },
];

export default function PackagesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>();
  const [shipmentType, setShipmentType] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const params = {
    page,
    limit: pageSize,
    search,
    status,
    shipmentType,
  };

  const {
    recentIntakes,
    recentIntakesTotal,
    recentIntakesLoading,
  } = usePackageIntake();

  // Map PackageIntake[] to Package[]
  const mappedPackages = recentIntakes.map((pkg) => ({
    id: pkg.id,
    trackingNumber: pkg.trackingCode,
    customer: {
      firstName: pkg.customerName?.split(" ")[0] || "",
      lastName: pkg.customerName?.split(" ").slice(1).join(" ") || "",
    },
    description: pkg.description,
    weight: pkg.weight,
    cbm: pkg.cbm,
    shipmentType: pkg.shippingMode === "AIR" ? ShipmentType.AIR : ShipmentType.SEA,
    status: pkg.status as PackageStatus,
    createdAt: pkg.createdAt,
  }));

  return (
    <AuthGuard>
      <AppLayout>
        <div className="px-4 md:px-6 lg:px-8 py-4 max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h1 className="text-2xl font-bold">Packages</h1>
            <div className="flex gap-4">
              <Search
                placeholder="Search Tracking Number"
                allowClear
                onSearch={setSearch}
                style={{ width: 220 }}
              />
              <Select
                placeholder="Status"
                allowClear
                options={statusOptions}
                onChange={setStatus}
                style={{ width: 160 }}
              />
              <Select
                placeholder="Shipment Type"
                allowClear
                options={shipmentTypeOptions}
                onChange={setShipmentType}
                style={{ width: 160 }}
              />
            </div>
          </div>
          <div>
            <Table
              columns={columns}
              dataSource={mappedPackages}
              rowKey="id"
              loading={recentIntakesLoading}
              pagination={{
                current: page,
                pageSize,
                total: recentIntakesTotal,
                onChange: (p, ps) => {
                  setPage(p);
                  setPageSize(ps);
                },
              }}
              locale={{
                emptyText: recentIntakesLoading ? (
                  <Spin />
                ) : (
                  <Empty description="No packages found" />
                ),
              }}
              scroll={{ x: true }}
            />
          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
