// Audit Logs Page

"use client";

import React, { useState } from "react";
import { Table, Button, Input, Select, DatePicker, Empty, Modal, Space, message } from "antd";
import type { TablePaginationConfig, FilterValue, SorterResult } from "antd/es/table/interface";
import { auditLogColumns } from "./columns";
import { useAuditLogs, useExportAuditLogs } from "@/hooks/useAuditLogs";
import { AuditAction, AuditEntityType, AuditLog } from "@/types/audit";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuthStore } from "@/store/authStore";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

const entityTypeOptions = Object.values(AuditEntityType).map((type) => ({
  label: type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
  value: type,
}));
const actionOptions = Object.values(AuditAction).map((action) => ({
  label: action.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
  value: action,
}));

function prettyDiff(before: Record<string, unknown> | null, after: Record<string, unknown> | null) {
  // Simple JSON diff: highlight changed keys
  if (!before && !after) return <Empty description="No Data" />;
  const beforeStr = JSON.stringify(before, null, 2);
  const afterStr = JSON.stringify(after, null, 2);
  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <div>
        <b>Before:</b>
        <pre className="bg-gray-100 p-2 rounded text-xs">{beforeStr}</pre>
      </div>
      <div>
        <b>After:</b>
        <pre className="bg-gray-100 p-2 rounded text-xs">{afterStr}</pre>
      </div>
    </Space>
  );
}

export default function AuditLogsPage() {
  const user = useAuthStore((s) => s.user);
  const [filters, setFilters] = useState({
    entityType: undefined as AuditEntityType | undefined,
    action: undefined as AuditAction | undefined,
    actor: "",
    dateRange: null as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null,
    search: "",
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [exporting, setExporting] = useState(false);

  const { data, isLoading } = useAuditLogs({
    page: pagination.page,
    limit: pagination.limit,
    entityType: filters.entityType,
    action: filters.action,
    actor: filters.actor,
    dateFrom: filters.dateRange && filters.dateRange[0] ? filters.dateRange[0].toISOString() : undefined,
    dateTo: filters.dateRange && filters.dateRange[1] ? filters.dateRange[1].toISOString() : undefined,
    search: filters.search,
  });

  const exportMutation = useExportAuditLogs();

  if (!user || user.role !== "SUPER_ADMIN") {
    return (
      <AuthGuard>
        <Empty description="Access Denied. SUPER_ADMIN only." />
      </AuthGuard>
    );
  }

  const handleTableChange = (
    pagination: TablePaginationConfig,
    filtersTable: Record<string, FilterValue | null>,
    _sorter: SorterResult<AuditLog> | SorterResult<AuditLog>[],
    _extra: unknown
  ) => {
    setPagination({
      page: pagination.current ?? 1,
      limit: pagination.pageSize ?? 20,
    });
    
    setFilters((prev) => ({
      ...prev,
      entityType: Array.isArray(filtersTable.entityType) ? (filtersTable.entityType[0] as AuditEntityType) : undefined,
      action: Array.isArray(filtersTable.action) ? (filtersTable.action[0] as AuditAction) : undefined,
    }));
  };

  const handleExport = async (format: "csv" | "excel") => {
    setExporting(true);
    try {
      const params = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
        format,
      };
      const blob = await exportMutation.mutateAsync(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs.${format === "csv" ? "csv" : "xlsx"}`;
      a.click();
      window.URL.revokeObjectURL(url);
      message.success("Export successful");
    } catch (_) {
      message.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppLayout>
      <AuthGuard>
        <div className="p-4 space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <Select
              allowClear
              placeholder="Entity Type"
              options={entityTypeOptions}
              value={filters.entityType}
              onChange={(v) => setFilters((f) => ({ ...f, entityType: v }))}
              style={{ width: 150 }}
              size="middle"
            />
            <Select
              allowClear
              placeholder="Action"
              options={actionOptions}
              value={filters.action}
              onChange={(v) => setFilters((f) => ({ ...f, action: v }))}
              style={{ width: 150 }}
              size="middle"
            />
            <Input
              allowClear
              placeholder="Actor"
              value={filters.actor}
              onChange={(e) => setFilters((f) => ({ ...f, actor: e.target.value }))}
              style={{ width: 140 }}
              size="middle"
            />
            <RangePicker
              value={filters.dateRange}
              onChange={(dates) => setFilters((f) => ({ ...f, dateRange: dates ?? null }))}
              style={{ width: 240 }}
              size="middle"
            />
            <Input.Search
              allowClear
              placeholder="Search Entity ID / Text"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              style={{ width: 220 }}
              size="middle"
              onSearch={(v) => setFilters((f) => ({ ...f, search: v }))}
            />
            <Button
              type="primary"
              loading={exporting}
              onClick={() => handleExport("csv")}
              size="middle"
            >
              Export CSV
            </Button>
            <Button
              loading={exporting}
              onClick={() => handleExport("excel")}
              size="middle"
            >
              Export Excel
            </Button>
          </div>
          <Table
            columns={[
              ...auditLogColumns,
              {
                title: "View",
                key: "view",
                width: 80,
                render: (_: unknown, record: AuditLog) => (
                  <Button size="small" onClick={() => setSelectedLog(record)}>
                    Detail
                  </Button>
                ),
              },
            ]}
            dataSource={data?.data ?? []}
            rowKey="id"
            loading={isLoading}
            pagination={{
              current: pagination.page,
              pageSize: pagination.limit,
              total: data?.total ?? 0,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50", "100"],
            }}
            onChange={handleTableChange}
            locale={{ emptyText: <Empty description="No audit logs found" /> }}
            scroll={{ x: true }}
            size="middle"
          />
          <Modal
            open={!!selectedLog}
            title="Audit Log Detail"
            onCancel={() => setSelectedLog(null)}
            footer={null}
            width={600}
          >
            {selectedLog ? (
              <>
                {prettyDiff(selectedLog.before, selectedLog.after)}
                <div className="mt-4">
                  <b>Metadata:</b>
                  <pre className="bg-gray-100 p-2 rounded text-xs">{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                </div>
              </>
            ) : null}
          </Modal>
        </div>
      </AuthGuard>
    </AppLayout>
  );
}
