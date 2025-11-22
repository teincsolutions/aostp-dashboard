// Audit Logs Page

"use client";

import React, { useState } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  DatePicker,
  Empty,
  Modal,
  Space,
  message,
} from "antd";
import type {
  TablePaginationConfig,
  FilterValue,
  SorterResult,
} from "antd/es/table/interface";
import { auditLogColumns } from "./columns";
import { useAuditLogs, useExportAuditLogs } from "@/hooks/useAuditLogs";
import { useUsers } from "@/hooks/useUsers";
import { AuditAction, AuditEntityType, AuditLog } from "@/types/audit";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import dayjs from "dayjs";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const { RangePicker } = DatePicker;

const entityTypeOptions = Object.values(AuditEntityType).map((type) => ({
  label: type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
  value: type,
}));
const actionOptions = Object.values(AuditAction).map((action) => ({
  label: action.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
  value: action,
}));

function prettyDiff(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null
) {
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
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    entityType: undefined as AuditEntityType | undefined,
    action: undefined as AuditAction | undefined,
    actor: undefined as string | undefined,
    dateRange: null as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null,
    search: "",
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [exporting, setExporting] = useState(false);

  const { data, isLoading } = useAuditLogs({
    page: pagination.page,
    limit: pagination.limit,
    entity: filters.entityType,
    action: filters.action,
    userId: filters.actor,
    dateFrom:
      filters.dateRange && filters.dateRange[0]
        ? filters.dateRange[0].toISOString()
        : undefined,
    dateTo:
      filters.dateRange && filters.dateRange[1]
        ? filters.dateRange[1].toISOString()
        : undefined,
    search: filters.search,
  });

  const { data: users, isLoading: usersLoading } = useUsers({ limit: 100 });

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
      entityType: Array.isArray(filtersTable.entityType)
        ? (filtersTable.entityType[0] as AuditEntityType)
        : undefined,
      action: Array.isArray(filtersTable.action)
        ? (filtersTable.action[0] as AuditAction)
        : undefined,
    }));
  };

  const handleExport = async (format: "csv" | "excel") => {
    setExporting(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        entity: filters.entityType,
        action: filters.action,
        userId: filters.actor,
        dateFrom:
          filters.dateRange && filters.dateRange[0]
            ? filters.dateRange[0].toISOString()
            : undefined,
        dateTo:
          filters.dateRange && filters.dateRange[1]
            ? filters.dateRange[1].toISOString()
            : undefined,
        search: filters.search,
        format,
      };
      const blob = await exportMutation.mutateAsync(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs.${format === "csv" ? "csv" : "xlsx"}`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Export successful");
    } catch (_) {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppLayout>
      <AuthGuard>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
            <Select
              allowClear
              placeholder="Entity Type"
              options={entityTypeOptions}
              value={filters.entityType}
              onChange={(v) => setFilters((f) => ({ ...f, entityType: v }))}
              size="middle"
            />
            <Select
              allowClear
              placeholder="Action"
              options={actionOptions}
              value={filters.action}
              onChange={(v) => setFilters((f) => ({ ...f, action: v }))}
              size="middle"
            />
            <Select
              allowClear
              showSearch
              loading={usersLoading}
              placeholder="Actor"
              options={users?.data?.map((u) => ({
                label: `${u.firstName} ${u.lastName} (${u.email})`,
                value: u.id,
              }))}
              value={filters.actor}
              onChange={(v) => setFilters((f) => ({ ...f, actor: v }))}
              size="middle"
              filterOption={(input, option) =>
                option?.label?.toLowerCase().includes(input.toLowerCase()) ??
                false
              }
            />
            <RangePicker
              value={filters.dateRange}
              onChange={(dates) =>
                setFilters((f) => ({ ...f, dateRange: dates ?? null }))
              }
              size="middle"
            />
            <Input.Search
              allowClear
              placeholder="Search Entity ID / Text"
              value={filters.search}
              className="md:col-span-2"
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
              size="middle"
              onSearch={(v) => setFilters((f) => ({ ...f, search: v }))}
            />
          </div>
          <div className="flex justify-end space-x-2">
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
                  <pre className="bg-gray-100 p-2 rounded text-xs">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              </>
            ) : null}
          </Modal>
        </div>
      </AuthGuard>
    </AppLayout>
  );
}
