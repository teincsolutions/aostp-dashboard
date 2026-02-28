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
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  DollarOutlined,
  TeamOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
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

export default function DebtorsReportPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<ReportFilters>({});

  const { data, isLoading, error } = useDebtorsReport(filters, user?.role);
  const { data: warehousesData } = useWarehouses({ page: 1, limit: 100 });
  const { data: customersData } = useCustomers({ page: 1, limit: 100 });

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
        </Space>
      </AppLayout>
    </AuthGuard>
  );
}
