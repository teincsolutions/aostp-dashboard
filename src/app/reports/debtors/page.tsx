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
  Progress,
  Descriptions,
  Button,
  Modal,
  Checkbox,
  Divider,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  DollarOutlined,
  TeamOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { useDebtorsReport } from "@/hooks/useReports";
import { useAuth } from "@/hooks/useAuth";
import { useWarehouses } from "@/hooks/useWarehouse";
import { useCustomers } from "@/hooks/useCustomers";
import {
  ReportFilters,
  DebtorItem,
  DebtorInvoice,
  DebtorPackingList,
} from "@/types/report";
import dayjs from "dayjs";
import { toast } from "sonner";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const INVOICE_STATUS_COLORS: Record<string, string> = {
  UNPAID: "red",
  PARTIALLY_PAID: "orange",
  PAID: "green",
};

// Sub-table: invoices per debtor
const invoiceColumns: ColumnsType<DebtorInvoice> = [
  {
    title: "Invoice No.",
    dataIndex: "invoiceNumber",
    key: "invoiceNumber",
    width: 150,
  },
  {
    title: "Packing List",
    dataIndex: "packingListName",
    key: "packingListName",
    width: 150,
  },
  {
    title: "Status",
    dataIndex: "status",
    key: "status",
    width: 130,
    render: (s: string) => (
      <Tag color={INVOICE_STATUS_COLORS[s] || "default"}>
        {s.replace(/_/g, " ")}
      </Tag>
    ),
  },
  {
    title: "Invoice Amount",
    dataIndex: "totalAmount",
    key: "totalAmount",
    align: "right",
    width: 140,
    render: (v: number, r: DebtorInvoice) =>
      `${r.currency} ${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
  },
  {
    title: "Paid",
    dataIndex: "paidAmount",
    key: "paidAmount",
    align: "right",
    width: 140,
    render: (v: number, r: DebtorInvoice) =>
      `${r.currency} ${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
  },
  {
    title: "Balance",
    dataIndex: "balance",
    key: "balance",
    align: "right",
    width: 140,
    render: (v: number, r: DebtorInvoice) => (
      <Text type="danger">
        {r.currency} {v.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </Text>
    ),
  },
  {
    title: "Invoice Date",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 130,
    render: (d: string) => dayjs(d).format("MMM DD, YYYY"),
  },
];

// Sub-table: packing list summary per debtor
const plColumns: ColumnsType<DebtorPackingList> = [
  { title: "Packing List", dataIndex: "name", key: "name" },
  {
    title: "Invoice Count",
    dataIndex: "invoiceCount",
    key: "invoiceCount",
    align: "right",
  },
  {
    title: "Outstanding Balance",
    dataIndex: "outstandingBalance",
    key: "outstandingBalance",
    align: "right",
    render: (v: number) => (
      <Text type="danger">
        ${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </Text>
    ),
  },
];

const expandedRowRender = (record: DebtorItem) => (
  <Space direction="vertical" size="middle" style={{ width: "100%", padding: "0 24px 16px" }}>
    <Descriptions size="small" column={3} bordered>
      <Descriptions.Item label="Phone">{record.phoneNumber || "—"}</Descriptions.Item>
      <Descriptions.Item label="Email">{record.email || "—"}</Descriptions.Item>
      <Descriptions.Item label="Warehouse">{record.warehouse || "—"}</Descriptions.Item>
    </Descriptions>

    <Text strong>
      <FileTextOutlined /> Packing List Breakdown
    </Text>
    <Table
      columns={plColumns}
      dataSource={record.packingLists}
      rowKey="id"
      size="small"
      pagination={false}
    />

    <Text strong>
      <FileTextOutlined /> Outstanding Invoices
    </Text>
    <Table
      columns={invoiceColumns}
      dataSource={record.invoices}
      rowKey="invoiceNumber"
      size="small"
      scroll={{ x: 900 }}
      pagination={{ pageSize: 10 }}
    />
  </Space>
);

const debtorColumns: ColumnsType<DebtorItem> = [
  {
    title: "Rank",
    dataIndex: "rank",
    key: "rank",
    width: 70,
    fixed: "left",
    render: (rank: number) => (
      <Tag color={rank <= 3 ? "red" : rank <= 10 ? "orange" : "default"}>
        #{rank}
      </Tag>
    ),
  },
  {
    title: "Customer",
    key: "customer",
    fixed: "left",
    width: 200,
    render: (_: unknown, r: DebtorItem) => (
      <div>
        <div style={{ fontWeight: 500 }}>{r.customerName}</div>
        <div style={{ fontSize: "12px", color: "#666" }}>{r.customerCode}</div>
      </div>
    ),
  },
  {
    title: "Invoices",
    dataIndex: "invoiceCount",
    key: "invoiceCount",
    align: "center",
    width: 90,
  },
  {
    title: "Packing Lists",
    dataIndex: "packingListCount",
    key: "packingListCount",
    align: "center",
    width: 110,
  },
  {
    title: "Invoice Amount",
    dataIndex: "totalInvoiceAmount",
    key: "totalInvoiceAmount",
    align: "right",
    width: 150,
    render: (v: number) =>
      `$${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    sorter: (a, b) => a.totalInvoiceAmount - b.totalInvoiceAmount,
  },
  {
    title: "Paid",
    dataIndex: "totalPaidAmount",
    key: "totalPaidAmount",
    align: "right",
    width: 140,
    render: (v: number) => (
      <Text type="success">
        ${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </Text>
    ),
  },
  {
    title: "Outstanding Balance",
    dataIndex: "outstandingBalance",
    key: "outstandingBalance",
    align: "right",
    width: 160,
    defaultSortOrder: "descend",
    sorter: (a, b) => a.outstandingBalance - b.outstandingBalance,
    render: (v: number) => (
      <Text type="danger" strong>
        ${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </Text>
    ),
  },
  {
    title: "Last Invoice",
    dataIndex: "lastInvoiceDate",
    key: "lastInvoiceDate",
    width: 130,
    render: (d: string) => (d ? dayjs(d).format("MMM DD, YYYY") : "—"),
  },
];

const exportColumnOptions = [
  { label: "Rank", value: "rank" },
  { label: "Customer Code", value: "customerCode" },
  { label: "Customer Name", value: "customerName" },
  { label: "Phone", value: "phoneNumber" },
  { label: "Email", value: "email" },
  { label: "Warehouse", value: "warehouse" },
  { label: "Invoice Count", value: "invoiceCount" },
  { label: "Packing List Count", value: "packingListCount" },
  { label: "Invoice Amount", value: "totalInvoiceAmount" },
  { label: "Paid Amount", value: "totalPaidAmount" },
  { label: "Outstanding Balance", value: "outstandingBalance" },
  { label: "Last Invoice Date", value: "lastInvoiceDate" },
];

export default function DebtorsReportPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<ReportFilters>({});
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [selectedExportColumns, setSelectedExportColumns] = useState<string[]>(
    exportColumnOptions.map((c) => c.value)
  );

  const { data, isLoading, error } = useDebtorsReport(filters, user?.role);
  const { data: warehousesData } = useWarehouses({ page: 1, limit: 100 });
  const { data: customersData } = useCustomers({ page: 1, limit: 100 });

  const buildExportData = () =>
    (data?.debtors || []).map((d) => {
      const row: Record<string, string> = {};
      selectedExportColumns.forEach((col) => {
        switch (col) {
          case "rank": row["Rank"] = String(d.rank); break;
          case "customerCode": row["Customer Code"] = d.customerCode; break;
          case "customerName": row["Customer Name"] = d.customerName; break;
          case "phoneNumber": row["Phone"] = d.phoneNumber || "—"; break;
          case "email": row["Email"] = d.email || "—"; break;
          case "warehouse": row["Warehouse"] = d.warehouse || "—"; break;
          case "invoiceCount": row["Invoice Count"] = String(d.invoiceCount); break;
          case "packingListCount": row["Packing List Count"] = String(d.packingListCount); break;
          case "totalInvoiceAmount": row["Invoice Amount ($)"] = d.totalInvoiceAmount.toFixed(2); break;
          case "totalPaidAmount": row["Paid Amount ($)"] = d.totalPaidAmount.toFixed(2); break;
          case "outstandingBalance": row["Outstanding Balance ($)"] = d.outstandingBalance.toFixed(2); break;
          case "lastInvoiceDate": row["Last Invoice Date"] = d.lastInvoiceDate ? dayjs(d.lastInvoiceDate).format("DD MMM YYYY") : "—"; break;
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
    link.download = `debtors-report-${dayjs().format("YYYY-MM-DD")}.${ext}`;
    link.click();
  };

  const exportToPDF = (rows: Record<string, string>[]) => {
    if (!rows.length) { toast.error("No data to export"); return; }
    const headers = Object.keys(rows[0]);
    const summary = data?.summary;
    const html = `<!DOCTYPE html><html><head><title>Debtors Report</title>
      <style>body{font-family:Arial,sans-serif;margin:20px}h1{text-align:center}
      table{width:100%;border-collapse:collapse;margin-top:20px;font-size:11px}
      th,td{border:1px solid #ddd;padding:6px;text-align:left}
      th{background:#cf1322;color:#fff}tr:nth-child(even){background:#f9f9f9}
      .summary{margin:10px 0;font-size:13px}</style></head><body>
      <h1>Debtors Report — ${dayjs().format("DD MMM YYYY")}</h1>
      <div class="summary">
        <p><strong>Total Debtors:</strong> ${summary?.totalDebtors || 0}</p>
        <p><strong>Total Outstanding:</strong> $${(summary?.totalOutstanding || 0).toFixed(2)}</p>
        <p><strong>Collection Rate:</strong> ${(summary?.collectionRate || 0).toFixed(2)}%</p>
      </div>
      <table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((r) => `<tr>${headers.map((h) => `<td>${r[h] || ""}</td>`).join("")}</tr>`).join("")}</tbody>
      </table></body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); w.print(); }
  };

  const handleExport = (format: "csv" | "excel" | "pdf") => {
    if (!selectedExportColumns.length) { toast.error("Select at least one column"); return; }
    const rows = buildExportData();
    if (!rows.length) { toast.error("No data to export"); return; }
    if (format === "csv") exportToCSV(rows, "csv");
    else if (format === "excel") exportToCSV(rows, "xlsx");
    else exportToPDF(rows);
    setIsExportModalVisible(false);
    toast.success(`Exported as ${format.toUpperCase()}`);
  };

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      setFilters((prev) => ({
        ...prev,
        fromDate: dates[0].toISOString(),
        toDate: dates[1].toISOString(),
      }));
    } else {
      setFilters((prev) => {
        const { fromDate, toDate, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleWarehouseChange = (value: string | undefined) => {
    setFilters((prev) => ({ ...prev, warehouseId: value || undefined }));
  };

  const handleCustomerChange = (value: string | undefined) => {
    setFilters((prev) => ({ ...prev, customerId: value || undefined }));
  };

  const collectionRate = data?.summary?.collectionRate ?? 0;

  const expandable = {
    expandedRowRender,
    rowExpandable: (record: DebtorItem) =>
      record.invoices?.length > 0 || record.packingLists?.length > 0,
  };

  return (
    <AuthGuard>
      <AppLayout>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* Header */}
          <Row justify="space-between" align="middle" wrap>
            <Col>
              <Title level={2}>Debtors Report</Title>
              <Text type="secondary">
                Customers with outstanding invoice balances, ranked by highest debt
              </Text>
            </Col>
            <Col>
              <Space wrap>
                <Select
                  placeholder="All Customers"
                  allowClear
                  style={{ width: 220 }}
                  showSearch
                  filterOption={(input, option) =>
                    String(option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  onChange={handleCustomerChange}
                  options={customersData?.data?.map((c: any) => ({
                    label: `${c.firstName} ${c.lastName} (${c.customerCode})`,
                    value: c.id,
                  }))}
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
                <RangePicker onChange={handleDateRangeChange} />
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => setIsExportModalVisible(true)}
                  disabled={!data?.debtors?.length}
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

          {/* Summary Cards */}
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Card loading={isLoading}>
                <Statistic
                  title="Total Debtors"
                  value={data?.summary?.totalDebtors || 0}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: "#cf1322" }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card loading={isLoading}>
                <Statistic
                  title="Total Outstanding"
                  value={data?.summary?.totalOutstanding || 0}
                  precision={2}
                  prefix={<ExclamationCircleOutlined />}
                  valueStyle={{ color: "#cf1322" }}
                  formatter={(v) => `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card loading={isLoading}>
                <Statistic
                  title="Total Invoiced"
                  value={data?.summary?.totalInvoiceAmount || 0}
                  precision={2}
                  prefix={<DollarOutlined />}
                  formatter={(v) => `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card loading={isLoading}>
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">Collection Rate</Text>
                </div>
                <Progress
                  type="circle"
                  percent={Math.round(collectionRate)}
                  size={80}
                  strokeColor={
                    collectionRate >= 70
                      ? "#52c41a"
                      : collectionRate >= 40
                      ? "#fa8c16"
                      : "#ff4d4f"
                  }
                />
              </Card>
            </Col>
          </Row>

          {/* Debtors Table */}
          <Card
            title={
              <Space>
                <ExclamationCircleOutlined style={{ color: "#cf1322" }} />
                <span>
                  Debtors ({data?.totalCount || 0}) — click row to expand details
                </span>
              </Space>
            }
          >
            <Table
              columns={debtorColumns}
              dataSource={data?.debtors || []}
              loading={isLoading}
              rowKey={(r) => r.customerCode}
              expandable={expandable}
              scroll={{ x: 1200 }}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} debtors`,
              }}
            />
          </Card>
          {/* Export Modal */}
          <Modal
            title="Export Debtors Report"
            open={isExportModalVisible}
            onCancel={() => setIsExportModalVisible(false)}
            footer={null}
            width={560}
          >
            <div>
              <h4 style={{ fontWeight: 600, marginBottom: 12 }}>Select columns to export:</h4>
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
                <Button block icon={<DownloadOutlined />} onClick={() => handleExport("pdf")} disabled={!selectedExportColumns.length}>Export as PDF (Print)</Button>
              </Space>
              <div style={{ marginTop: 12, fontSize: 12, color: "#888" }}>* {data?.debtors?.length || 0} rows will be exported</div>
            </div>
          </Modal>
        </Space>
      </AppLayout>
    </AuthGuard>
  );
}
