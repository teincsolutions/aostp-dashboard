"use client";

import { useState } from "react";
import {
  Card,
  Row,
  Col,
  DatePicker,
  Typography,
  Space,
  Table,
  Select,
  Statistic,
  Alert,
  Tag,
  Tabs,
  Divider,
  Button,
  Modal,
  Checkbox,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  DollarOutlined,
  ShoppingOutlined,
  InboxOutlined,
  UserOutlined,
  CalendarOutlined,
  ShopOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { useEndOfDayReport } from "@/hooks/useReports";
import { useAuth } from "@/hooks/useAuth";
import { useWarehouses } from "@/hooks/useWarehouse";
import { useUsers } from "@/hooks/useUsers";
import {
  ReportFilters,
  EndOfDayWarehouse,
  EndOfDayPaymentByMethod,
  EndOfDayPickupsByUser,
  EndOfDayActivityUser,
} from "@/types/report";
import dayjs from "dayjs";
import { toast } from "sonner";

const { Title, Text } = Typography;

const METHOD_COLORS: Record<string, string> = {
  MOBILE_MONEY: "blue",
  CASH: "green",
  BANK_TRANSFER: "purple",
  CHEQUE: "orange",
};

const paymentMethodColumns: ColumnsType<EndOfDayPaymentByMethod> = [
  {
    title: "Payment Method",
    dataIndex: "method",
    key: "method",
    render: (m: string) => (
      <Tag color={METHOD_COLORS[m] || "default"}>
        {m.replace(/_/g, " ")}
      </Tag>
    ),
  },
  { title: "Count", dataIndex: "count", key: "count", align: "right" },
  {
    title: "GHS Total",
    dataIndex: "totalGhs",
    key: "totalGhs",
    align: "right",
    render: (v: number) => `GHS ${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
  },
  {
    title: "USD Total",
    dataIndex: "totalUsd",
    key: "totalUsd",
    align: "right",
    render: (v: number) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
  },
];

const userBreakdownColumns: ColumnsType<EndOfDayPickupsByUser> = [
  { title: "Staff Member", dataIndex: "userName", key: "userName" },
  { title: "Count", dataIndex: "count", key: "count", align: "right" },
  {
    title: "Total Qty",
    dataIndex: "totalQuantity",
    key: "totalQuantity",
    align: "right",
  },
];

const activityColumns: ColumnsType<EndOfDayActivityUser> = [
  {
    title: "Staff Member",
    dataIndex: "userName",
    key: "userName",
    fixed: "left",
    width: 180,
  },
  {
    title: "Role",
    dataIndex: "role",
    key: "role",
    width: 160,
    render: (r: string) => <Tag color="geekblue">{r.replace(/_/g, " ")}</Tag>,
  },
  {
    title: "Warehouse",
    dataIndex: "warehouse",
    key: "warehouse",
    width: 140,
  },
  {
    title: "Payments",
    key: "payments",
    width: 80,
    align: "right",
    render: (_: unknown, r: EndOfDayActivityUser) => r.paymentsProcessed,
  },
  {
    title: "GHS Received",
    key: "ghsReceived",
    width: 130,
    align: "right",
    render: (_: unknown, r: EndOfDayActivityUser) =>
      `GHS ${r.paymentsTotalGhs.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
  },
  {
    title: "USD Received",
    key: "usdReceived",
    width: 130,
    align: "right",
    render: (_: unknown, r: EndOfDayActivityUser) =>
      `$${r.paymentsTotalUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
  },
  {
    title: "Intakes",
    key: "intakes",
    width: 80,
    align: "right",
    render: (_: unknown, r: EndOfDayActivityUser) => r.packagesReceived,
  },
  {
    title: "Intake Qty",
    dataIndex: "intakeQuantity",
    key: "intakeQuantity",
    width: 100,
    align: "right",
  },
  {
    title: "Pickups",
    key: "pickups",
    width: 80,
    align: "right",
    render: (_: unknown, r: EndOfDayActivityUser) => r.pickupsReleased,
  },
  {
    title: "Pickup Qty",
    dataIndex: "pickupQuantity",
    key: "pickupQuantity",
    width: 100,
    align: "right",
  },
];

export default function EndOfDayReportPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<ReportFilters>({
    date: dayjs().format("YYYY-MM-DD"),
  });
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [selectedExportColumns, setSelectedExportColumns] = useState<string[]>([
    "userName", "role", "warehouse",
    "paymentsProcessed", "paymentsTotalGhs", "paymentsTotalUsd",
    "packagesReceived", "intakeQuantity",
    "pickupsReleased", "pickupQuantity",
  ]);

  const { data, isLoading, error } = useEndOfDayReport(filters, user?.role);
  const { data: warehousesData } = useWarehouses({ page: 1, limit: 100 });
  const { data: usersData } = useUsers({ page: 1, limit: 100, isActive: true });

  const exportColumnOptions = [
    { label: "Staff Member", value: "userName" },
    { label: "Role", value: "role" },
    { label: "Warehouse", value: "warehouse" },
    { label: "Payments Processed", value: "paymentsProcessed" },
    { label: "GHS Received", value: "paymentsTotalGhs" },
    { label: "USD Received", value: "paymentsTotalUsd" },
    { label: "Packages Received", value: "packagesReceived" },
    { label: "Intake Qty", value: "intakeQuantity" },
    { label: "Pickups Released", value: "pickupsReleased" },
    { label: "Pickup Qty", value: "pickupQuantity" },
  ];

  const buildExportData = () =>
    (data?.activityByUser || []).map((u) => {
      const row: Record<string, string> = {};
      selectedExportColumns.forEach((col) => {
        switch (col) {
          case "userName": row["Staff Member"] = u.userName; break;
          case "role": row["Role"] = u.role.replace(/_/g, " "); break;
          case "warehouse": row["Warehouse"] = u.warehouse || "—"; break;
          case "paymentsProcessed": row["Payments Processed"] = String(u.paymentsProcessed); break;
          case "paymentsTotalGhs": row["GHS Received"] = u.paymentsTotalGhs.toFixed(2); break;
          case "paymentsTotalUsd": row["USD Received"] = u.paymentsTotalUsd.toFixed(2); break;
          case "packagesReceived": row["Packages Received"] = String(u.packagesReceived); break;
          case "intakeQuantity": row["Intake Qty"] = String(u.intakeQuantity); break;
          case "pickupsReleased": row["Pickups Released"] = String(u.pickupsReleased); break;
          case "pickupQuantity": row["Pickup Qty"] = String(u.pickupQuantity); break;
        }
      });
      return row;
    });

  const exportToCSV = (rows: Record<string, string>[], ext = "csv") => {
    if (!rows.length) { toast.error("No data to export"); return; }
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => `"${r[h] || ""}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `end-of-day-report-${data?.reportDate || dayjs().format("YYYY-MM-DD")}.${ext}`;
    link.click();
  };

  const exportToPDF = (rows: Record<string, string>[]) => {
    if (!rows.length) { toast.error("No data to export"); return; }
    const headers = Object.keys(rows[0]);
    const overall = data?.overall;
    const html = `<!DOCTYPE html><html><head><title>End of Day Report</title>
      <style>body{font-family:Arial,sans-serif;margin:20px}h1{text-align:center}
      table{width:100%;border-collapse:collapse;margin-top:20px;font-size:11px}
      th,td{border:1px solid #ddd;padding:6px;text-align:left}
      th{background:#1677ff;color:#fff}tr:nth-child(even){background:#f9f9f9}
      .summary{margin:10px 0;font-size:13px}</style></head><body>
      <h1>End of Day Report — ${data?.reportDate || dayjs().format("DD MMM YYYY")}</h1>
      <div class="summary">
        <p><strong>Total Payments:</strong> ${overall?.totalPayments || 0} &nbsp; <strong>Revenue GHS:</strong> ${(overall?.totalRevenueGhs || 0).toFixed(2)} &nbsp; <strong>Revenue USD:</strong> $${(overall?.totalRevenueUsd || 0).toFixed(2)}</p>
        <p><strong>Total Pickups:</strong> ${overall?.totalPickups || 0} (qty ${overall?.totalPickupQuantity || 0}) &nbsp; <strong>Total Intakes:</strong> ${overall?.totalIntakes || 0} (qty ${overall?.totalIntakeQuantity || 0})</p>
      </div>
      <h3>Staff Activity</h3>
      <table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((r) => `<tr>${headers.map((h) => `<td>${r[h] || ""}</td>`).join("")}</tr>`).join("")}</tbody>
      </table></body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  };

  const handleExport = (format: "csv" | "excel" | "pdf") => {
    if (!selectedExportColumns.length) { toast.error("Select at least one column"); return; }
    const rows = buildExportData();
    if (!rows.length) { toast.error("No staff activity data to export"); return; }
    if (format === "csv") exportToCSV(rows, "csv");
    else if (format === "excel") exportToCSV(rows, "xlsx");
    else exportToPDF(rows);
    setIsExportModalVisible(false);
    toast.success(`Exported as ${format.toUpperCase()}`);
  };

  const handleDateChange = (date: any) => {
    if (date) {
      setFilters((prev) => ({
        ...prev,
        date: date.format("YYYY-MM-DD"),
        fromDate: undefined,
        toDate: undefined,
      }));
    } else {
      setFilters((prev) => {
        const { date: _d, fromDate: _f, toDate: _t, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleWarehouseChange = (value: string | undefined) => {
    setFilters((prev) => ({ ...prev, warehouseId: value || undefined }));
  };

  const handleUserChange = (value: string | undefined) => {
    setFilters((prev) => ({ ...prev, userId: value || undefined }));
  };

  const warehouseTabs = (data?.warehouses || []).map((wh: EndOfDayWarehouse) => ({
    key: wh.warehouseId,
    label: wh.warehouseName,
    children: (
      <Row gutter={[16, 16]}>
        {/* Payment summary */}
        <Col xs={24}>
          <Card size="small" title={<><DollarOutlined /> Payments</>}>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Count"
                  value={wh.payments.count}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="GHS Total"
                  value={wh.payments.totalGhs}
                  precision={2}
                  prefix="GHS"
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="USD Total"
                  value={wh.payments.totalUsd}
                  precision={2}
                  prefix="$"
                />
              </Col>
            </Row>
            <Table
              columns={paymentMethodColumns}
              dataSource={wh.payments.byMethod}
              rowKey="method"
              size="small"
              pagination={false}
            />
          </Card>
        </Col>

        {/* Pickups */}
        <Col xs={24} sm={12}>
          <Card size="small" title={<><ShoppingOutlined /> Pickups</>}>
            <Row gutter={16} style={{ marginBottom: 12 }}>
              <Col span={12}>
                <Statistic title="Transactions" value={wh.pickups.count} />
              </Col>
              <Col span={12}>
                <Statistic title="Total Qty" value={wh.pickups.totalQuantity} />
              </Col>
            </Row>
            <Table
              columns={userBreakdownColumns}
              dataSource={wh.pickups.byUser}
              rowKey="userId"
              size="small"
              pagination={false}
            />
          </Card>
        </Col>

        {/* Intakes */}
        <Col xs={24} sm={12}>
          <Card size="small" title={<><InboxOutlined /> Intakes</>}>
            <Row gutter={16} style={{ marginBottom: 12 }}>
              <Col span={12}>
                <Statistic title="Transactions" value={wh.intakes.count} />
              </Col>
              <Col span={12}>
                <Statistic title="Total Qty" value={wh.intakes.totalQuantity} />
              </Col>
            </Row>
            <Table
              columns={userBreakdownColumns}
              dataSource={wh.intakes.byUser}
              rowKey="userId"
              size="small"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    ),
  }));

  return (
    <AuthGuard>
      <AppLayout>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* Header */}
          <Row justify="space-between" align="middle" wrap>
            <Col>
              <Title level={2}>End of Day Report</Title>
              {data && (
                <Text type="secondary">
                  <CalendarOutlined /> {data.reportDate} &nbsp;|&nbsp; Generated{" "}
                  {dayjs(data.generatedAt).format("HH:mm")}
                </Text>
              )}
            </Col>
            <Col>
              <Space wrap>
                <DatePicker
                  defaultValue={dayjs()}
                  onChange={handleDateChange}
                  allowClear
                  placeholder="Select date"
                />
                <Select
                  placeholder="All Warehouses"
                  allowClear
                  style={{ width: 200 }}
                  onChange={handleWarehouseChange}
                  options={warehousesData?.data?.map((w: any) => ({
                    label: w.name,
                    value: w.id,
                  }))}
                />
                <Select
                  placeholder="All Staff"
                  allowClear
                  style={{ width: 200 }}
                  showSearch
                  filterOption={(input, option) =>
                    String(option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  onChange={handleUserChange}
                  options={usersData?.data?.map((u: any) => ({
                    label: `${u.firstName} ${u.lastName}`,
                    value: u.id,
                  }))}
                />
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => setIsExportModalVisible(true)}
                  disabled={!data?.activityByUser?.length}
                >
                  Export
                </Button>
              </Space>
            </Col>
          </Row>

          {error && (
            <Alert
              message="Error loading report"
              description={error.message}
              type="error"
              showIcon
            />
          )}

          {/* Overall Summary */}
          <Card title="Overall Summary" loading={isLoading}>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Total Payments"
                  value={data?.overall?.totalPayments || 0}
                  prefix={<DollarOutlined />}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Revenue (GHS)"
                  value={data?.overall?.totalRevenueGhs || 0}
                  precision={2}
                  prefix="GHS"
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Revenue (USD)"
                  value={data?.overall?.totalRevenueUsd || 0}
                  precision={2}
                  prefix="$"
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Total Pickups"
                  value={data?.overall?.totalPickups || 0}
                  prefix={<ShoppingOutlined />}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Pickup Qty"
                  value={data?.overall?.totalPickupQuantity || 0}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Total Intakes"
                  value={data?.overall?.totalIntakes || 0}
                  prefix={<InboxOutlined />}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Intake Qty"
                  value={data?.overall?.totalIntakeQuantity || 0}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Invoices Created"
                  value={data?.overall?.totalInvoicesCreated || 0}
                />
              </Col>
            </Row>
          </Card>

          {/* Per-Warehouse Breakdown */}
          <Card
            title={
              <Space>
                <ShopOutlined />
                <span>Warehouse Breakdown</span>
              </Space>
            }
            loading={isLoading}
          >
            {warehouseTabs.length > 0 ? (
              <Tabs items={warehouseTabs} />
            ) : (
              !isLoading && (
                <Text type="secondary">No warehouse data for this period.</Text>
              )
            )}
          </Card>

          {/* Activity by Staff */}
          <Card
            title={
              <Space>
                <UserOutlined />
                <span>Activity by Staff</span>
              </Space>
            }
            loading={isLoading}
          >
            <Divider orientation="left" plain>
              Staff summary for the selected period
            </Divider>
            <Table
              columns={activityColumns}
              dataSource={data?.activityByUser || []}
              loading={isLoading}
              rowKey="userId"
              scroll={{ x: 1200 }}
              pagination={{ pageSize: 20, showSizeChanger: true }}
              summary={(rows) => {
                const totals = rows.reduce(
                  (acc, r) => {
                    acc.paymentsProcessed += r.paymentsProcessed;
                    acc.paymentsTotalGhs += r.paymentsTotalGhs;
                    acc.paymentsTotalUsd += r.paymentsTotalUsd;
                    acc.packagesReceived += r.packagesReceived;
                    acc.intakeQuantity += r.intakeQuantity;
                    acc.pickupsReleased += r.pickupsReleased;
                    acc.pickupQuantity += r.pickupQuantity;
                    return acc;
                  },
                  {
                    paymentsProcessed: 0,
                    paymentsTotalGhs: 0,
                    paymentsTotalUsd: 0,
                    packagesReceived: 0,
                    intakeQuantity: 0,
                    pickupsReleased: 0,
                    pickupQuantity: 0,
                  }
                );
                return (
                  <Table.Summary.Row style={{ fontWeight: 600 }}>
                    <Table.Summary.Cell index={0} colSpan={3}>
                      TOTAL
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="right">
                      {totals.paymentsProcessed}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4} align="right">
                      GHS {totals.paymentsTotalGhs.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={5} align="right">
                      ${totals.paymentsTotalUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={6} align="right">
                      {totals.packagesReceived}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={7} align="right">
                      {totals.intakeQuantity}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={8} align="right">
                      {totals.pickupsReleased}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={9} align="right">
                      {totals.pickupQuantity}
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                );
              }}
            />
          </Card>
          {/* Export Modal */}
          <Modal
            title="Export End of Day Report"
            open={isExportModalVisible}
            onCancel={() => setIsExportModalVisible(false)}
            footer={null}
            width={560}
          >
            <div>
              <h4 style={{ fontWeight: 600, marginBottom: 12 }}>Select columns to export (staff activity):</h4>
              <Checkbox.Group
                options={exportColumnOptions}
                value={selectedExportColumns}
                onChange={(vals) => setSelectedExportColumns(vals as string[])}
                style={{ display: "flex", flexDirection: "column", gap: 6 }}
              />
              <Divider />
              <h4 style={{ fontWeight: 600, marginBottom: 12 }}>Select format:</h4>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Button block icon={<DownloadOutlined />} onClick={() => handleExport("csv")} disabled={!selectedExportColumns.length}>Export as CSV</Button>
                <Button block icon={<DownloadOutlined />} onClick={() => handleExport("excel")} disabled={!selectedExportColumns.length}>Export as Excel</Button>
                <Button block icon={<DownloadOutlined />} onClick={() => handleExport("pdf")} disabled={!selectedExportColumns.length}>Export as PDF (Print) — includes overall summary</Button>
              </Space>
              <div style={{ marginTop: 12, fontSize: 12, color: "#888" }}>* {data?.activityByUser?.length || 0} staff rows will be exported</div>
            </div>
          </Modal>
        </Space>
      </AppLayout>
    </AuthGuard>
  );
}
