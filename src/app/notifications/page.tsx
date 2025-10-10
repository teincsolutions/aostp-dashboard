"use client";
import { useState } from "react";
import { Table, Input, Select, DatePicker, Button, Modal, notification, Space } from "antd";
import { columns as baseColumns } from "@/app/notifications/columns";
import { useNotifications, useRetryNotification, useRetryFailedNotifications } from "@/hooks/useNotifications";
import { NotificationChannel, NotificationStatus, NotificationLog } from "@/types/notification";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";

const { RangePicker } = DatePicker;

const AUTHORIZED_ROLES = ["SUPER_ADMIN", "FINANCE_MANAGER", "OPERATIONS_CLERK"];

export default function NotificationsPage() {
  // Filters and search state
  const [channel, setChannel] = useState<NotificationChannel | undefined>();
  const [status, setStatus] = useState<NotificationStatus | undefined>();
  const [dateRange, setDateRange] = useState<[string, string] | undefined>();
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [search, setSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  // Modal state
  const [detailsModal, setDetailsModal] = useState<{ visible: boolean; record?: NotificationLog }>({
    visible: false,
    record: undefined,
  });

  // Query
  const { data, isLoading, refetch } = useNotifications({
    page,
    limit,
    channel,
    status,
    dateFrom: dateRange?.[0],
    dateTo: dateRange?.[1],
    customerId,
    search,
  });

  // Mutations
  const retryMutation = useRetryNotification();
  const bulkRetryMutation = useRetryFailedNotifications();

  // Table columns with injected actions
  const columns = baseColumns.map((col) =>
    col.key === "actions"
      ? {
          ...col,
          render: (_: unknown, record: NotificationLog) => (
            <Space>
              <Button
                size="small"
                onClick={() =>
                  setDetailsModal({ visible: true, record })
                }
              >
                Details
              </Button>
              {record.status === NotificationStatus.FAILED && (
                <Button
                  size="small"
                  type="primary"
                  danger
                  loading={retryMutation.status === "pending"}
                  onClick={async () => {
                    try {
                      await retryMutation.mutateAsync(record.id);
                      notification.success({ message: "Notification retried successfully" });
                      refetch();
                    } catch (err) {
                      notification.error({ message: "Retry failed", description: String(err) });
                    }
                  }}
                >
                  Retry
                </Button>
              )}
            </Space>
          ),
        }
      : col
  );

  // Table data
  const tableData = data?.data ?? [];
  const total = data?.total ?? 0;

  // Bulk retry handler
  const handleBulkRetry = async () => {
    try {
      await bulkRetryMutation.mutateAsync();
      notification.success({ message: "Bulk retry triggered for failed notifications" });
      refetch();
    } catch (err) {
      notification.error({ message: "Bulk retry failed", description: String(err) });
    }
  };

  return (
    <AuthGuard requiredRoles={AUTHORIZED_ROLES}>
      <AppLayout>
        <div className="p-6">
          <div className="mb-4 flex flex-wrap gap-2 items-center">
            <Select
              allowClear
              placeholder="Channel"
              style={{ width: 120 }}
              value={channel}
              onChange={setChannel}
              options={[
                { label: "Email", value: NotificationChannel.EMAIL },
                { label: "SMS", value: NotificationChannel.SMS },
                { label: "WhatsApp", value: NotificationChannel.WHATSAPP },
              ]}
            />
            <Select
              allowClear
              placeholder="Status"
              style={{ width: 120 }}
              value={status}
              onChange={setStatus}
              options={[
                { label: "Sent", value: NotificationStatus.SENT },
                { label: "Failed", value: NotificationStatus.FAILED },
                { label: "Pending", value: NotificationStatus.PENDING },
              ]}
            />
            <RangePicker
              onChange={(dates, dateStrings) =>
                setDateRange(dateStrings[0] && dateStrings[1] ? [dateStrings[0], dateStrings[1]] : undefined)
              }
            />
            <Input
              allowClear
              placeholder="Customer ID"
              style={{ width: 140 }}
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            />
            <Input.Search
              allowClear
              placeholder="Search recipient/customer"
              style={{ width: 180 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onSearch={() => refetch()}
            />
            <Button
              type="primary"
              danger
              loading={bulkRetryMutation.status === "pending"}
              onClick={handleBulkRetry}
            >
              Bulk Retry Failed (24h)
            </Button>
          </div>
          <Table
            columns={columns}
            dataSource={tableData}
            rowKey="id"
            loading={isLoading}
            pagination={{
              current: page,
              pageSize: limit,
              total,
              showSizeChanger: true,
              onChange: (p, l) => {
                setPage(p);
                setLimit(l);
              },
            }}
            scroll={{ x: "max-content" }}
            size="middle"
            locale={{ emptyText: "No notifications found" }}
            onChange={() => refetch()}
          />
          <Modal
            open={detailsModal.visible}
            title="Notification Details"
            footer={null}
            onCancel={() => setDetailsModal({ visible: false })}
            width={600}
          >
            <pre className="whitespace-pre-wrap text-xs">
              {detailsModal.record ? JSON.stringify(detailsModal.record, null, 2) : "No record"}
            </pre>
          </Modal>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
