"use client";

import React, { useState } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Card,
  Row,
  Col,
  Statistic,
  message,
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileTextOutlined,
  UserOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { InvoiceModal } from "@/components/InvoiceModal";
import { useInvoices } from "@/hooks/useInvoices";
import { Invoice, InvoiceStatus } from "@/types/invoice";

const { Option } = Select;

export default function InvoicesPage() {
  // State for filters
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [customerId, setCustomerId] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [invoiceModalInvoiceId, setInvoiceModalInvoiceId] = useState<
    string | null
  >(null);

  // React Query hooks
  const { data: invoices, isLoading } = useInvoices({
    page: currentPage,
    limit: pageSize,
    customerId: customerId || undefined,
    status: statusFilter || undefined,
  });

  // Handlers
  const handleSearch = (value: string) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleCustomerFilter = (customer: string) => {
    setCustomerId(customer);
    setCurrentPage(1);
  };

  const handleViewInvoice = (invoiceId: string) => {
    setInvoiceModalInvoiceId(invoiceId);
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    setInvoiceModalInvoiceId(invoiceId);
  };

  // Table columns
  const columns = [
    {
      title: "Invoice #",
      dataIndex: "invoiceNumber",
      key: "invoiceNumber",
      sorter: true,
      render: (invoiceNumber: string) => (
        <span style={{ fontFamily: "monospace", fontWeight: 500 }}>
          {invoiceNumber}
        </span>
      ),
    },
    {
      title: "Customer",
      dataIndex: "customer",
      key: "customer",
      render: (customer: any) =>
        customer ? `${customer.firstName} ${customer.lastName}` : "N/A",
    },
    {
      title: "Packing List",
      dataIndex: "packingListId",
      key: "packingListId",
      render: (_: any, record: Invoice) => (
        <span style={{ fontFamily: "monospace", fontWeight: 500 }}>
          {record.packingList?.name || "N/A"}
        </span>
      ),
    },
    {
      title: "Packages",
      render: (_: any, record: Invoice) =>
        record.packingList?.totalPackages || 0,
      key: "packages",
      align: "right" as const,
    },
    {
      title: "Total",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amount: number, record: Invoice) => `${amount?.toFixed(2)}`,
      align: "right" as const,
    },
    {
      title: "Balance",
      dataIndex: "balance",
      key: "balance",
      render: (amount: number, record: Invoice) => `${amount?.toFixed(2)}`,
      align: "right" as const,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "Paid", value: InvoiceStatus.PAID },
        { text: "Unpaid", value: InvoiceStatus.UNPAID },
        { text: "Partially Paid", value: InvoiceStatus.PARTIALLY_PAID },
      ],
      render: (status: InvoiceStatus) => {
        const statusColors = {
          [InvoiceStatus.PAID]: "green",
          [InvoiceStatus.UNPAID]: "red",
          [InvoiceStatus.PARTIALLY_PAID]: "orange",
        };
        return (
          <span
            style={{
              color: statusColors[status] || "default",
              fontWeight: 500,
            }}
          >
            {status?.replace("_", " ")}
          </span>
        );
      },
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: true,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Invoice) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewInvoice(record.id)}
          >
            View
          </Button>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadInvoice(record.id)}
          >
            Download
          </Button>
        </Space>
      ),
    },
  ];

  // Statistics
  const totalInvoices = invoices?.meta.total || 0;
  const paidInvoices =
    invoices?.data?.filter((inv: Invoice) => inv.status === InvoiceStatus.PAID)
      .length || 0;
  const unpaidInvoices =
    invoices?.data?.filter(
      (inv: Invoice) => inv.status === InvoiceStatus.UNPAID
    ).length || 0;
  const partialInvoices =
    invoices?.data?.filter(
      (inv: Invoice) => inv.status === InvoiceStatus.PARTIALLY_PAID
    ).length || 0;

  const totalUSD =
    invoices?.data
      ?.filter((inv: Invoice) => inv.currency === "USD")
      .reduce((sum: number, inv: Invoice) => sum + inv.totalAmount, 0) || 0;

  const totalGHS =
    invoices?.data
      ?.filter((inv: Invoice) => inv.currency === "GHS")
      .reduce((sum: number, inv: Invoice) => sum + inv.totalAmount, 0) || 0;

  return (
    <AuthGuard>
      <AppLayout>
        <div className="px-4 md:px-6 lg:px-8 py-4 w-full mx-auto space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h1 className="text-2xl font-bold">Invoice Management</h1>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <Statistic
                title="Total Invoices"
                value={totalInvoices}
                prefix={<FileTextOutlined />}
              />
            </Card>
            <Card>
              <Statistic
                title="Paid Invoices"
                value={paidInvoices}
                prefix={<UserOutlined />}
                valueStyle={{ color: "#3f8600" }}
              />
            </Card>
            <Card>
              <Statistic
                title="Unpaid Invoices"
                value={unpaidInvoices}
                prefix={<UserOutlined />}
                valueStyle={{ color: "#cf1322" }}
              />
            </Card>
            <Card>
              <Statistic
                title="Partial Payments"
                value={partialInvoices}
                prefix={<UserOutlined />}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </div>

          {/* Currency Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Card>
              <Statistic
                title="Total USD Value"
                value={totalUSD}
                prefix={<DollarOutlined />}
                suffix="USD"
                precision={2}
              />
            </Card>
            <Card>
              <Statistic
                title="Total GHS Value"
                value={totalGHS}
                prefix={<DollarOutlined />}
                suffix="GHS"
                precision={2}
              />
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <Input
                placeholder="Search invoices..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => handleSearch(e.target.value)}
                allowClear
              />
              <Select
                placeholder="Filter by status"
                value={statusFilter}
                onChange={handleStatusFilter}
                allowClear
              >
                <Option value={InvoiceStatus.PAID}>Paid</Option>
                <Option value={InvoiceStatus.UNPAID}>Unpaid</Option>
                <Option value={InvoiceStatus.PARTIALLY_PAID}>
                  Partially Paid
                </Option>
              </Select>
              <Input
                placeholder="Customer ID"
                value={customerId}
                onChange={(e) => handleCustomerFilter(e.target.value)}
                allowClear
              />
            </div>
          </Card>

          {/* Invoices Table */}
          <Card className="flex-1">
            <Table
              columns={columns}
              dataSource={invoices?.data || []}
              loading={isLoading}
              rowKey="id"
              scroll={{ x: true }}
              pagination={{
                current: currentPage,
                pageSize,
                total: invoices?.meta.total || 0,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} invoices`,
                onChange: (page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                },
              }}
            />
          </Card>

          {/* Invoice Modal */}
          <InvoiceModal
            visible={!!invoiceModalInvoiceId}
            onClose={() => setInvoiceModalInvoiceId(null)}
            invoiceId={invoiceModalInvoiceId}
          />
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
