"use client";

import React, { useState } from 'react';
import { Table, Input, Select, Spin, Empty } from 'antd';
import { columns } from "@/app/packages/columns";
import { usePackages } from '@/hooks/usePackages';
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { PackageStatus, ShipmentType } from '@/types/package';

const { Search } = Input;

const statusOptions = Object.values(PackageStatus).map((status) => ({
  label: status,
  value: status,
}));

const shipmentTypeOptions = [
  { label: 'Air', value: ShipmentType.AIR },
  { label: 'Sea', value: ShipmentType.SEA },
];

export default function PackagesPage() {
  const [search, setSearch] = useState('');
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

  const { packagesQuery } = usePackages(params);

  return (
    <AuthGuard>
      <AppLayout>
        <div className="p-6">
          <div className="flex gap-4 mb-4">
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
          <Table
            columns={columns}
            dataSource={packagesQuery.data?.data || []}
            rowKey="id"
            loading={packagesQuery.isLoading}
            pagination={{
              current: page,
              pageSize,
              total: packagesQuery.data?.total,
              onChange: (p, ps) => {
                setPage(p);
                setPageSize(ps);
              },
            }}
            locale={{
              emptyText: packagesQuery.isLoading ? <Spin /> : <Empty description="No packages found" />,
            }}
            scroll={{ x: true }}
          />
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
