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
  Popconfirm,
  DatePicker,
  Tag,
  Dropdown,
  Modal,
  MenuProps,
} from "antd";
import { toast } from "sonner";
import {
  SearchOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileTextOutlined,
  UserOutlined,
  DollarOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  MinusCircleOutlined,
  MoreOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { InvoiceModal } from "@/components/InvoiceModal";
import { PackingListSearchSelect } from "@/components/PackingListSearchSelect";
import {
  useInvoices,
  useRegenerateInvoicePdf,
  useUpdateInvoice,
  useDeleteInvoice,
} from "@/hooks/useInvoices";
import { useAuth } from "@/hooks/useAuth";
import { INVOICE_ACCESS_ROLES } from "@/lib/access-control";
import { Invoice, InvoiceStatus } from "@/types/invoice";
import dayjs, { Dayjs } from "dayjs";

const { Option } = Select;
const { RangePicker } = DatePicker;

export default function InvoicesPage() {
  // State for filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [packingListFilter, setPackingListFilter] = useState<string>("");
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    null,
    null,
  ]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [invoiceModalInvoiceId, setInvoiceModalInvoiceId] = useState<
    string | null
  >(null);
  const [regeneratingInvoiceId, setRegeneratingInvoiceId] = useState<
    string | null
  >(null);

  // React Query hooks
  const {
    data: invoices,
    isLoading,
    refetch,
  } = useInvoices({
    page: currentPage,
    limit: pageSize,
    search: search || undefined,
    status: statusFilter || undefined,
    packingListId: packingListFilter || undefined,
    dateFrom: dateRange[0] ? dateRange[0].toISOString() : undefined,
    dateTo: dateRange[1] ? dateRange[1].toISOString() : undefined,
  });
  const { mutateAsync: regenerateInvoicePdfMutation } =
    useRegenerateInvoicePdf();
  const { mutateAsync: updateInvoiceMutation } = useUpdateInvoice();
  const { mutateAsync: deleteInvoiceMutation } = useDeleteInvoice();
  const { user } = useAuth();

  // Handlers
  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handlePackingListFilter = (packingListId: string) => {
    setPackingListFilter(packingListId);
    setCurrentPage(1);
  };

  const handleDateRangeChange = (
    dates: null | [Dayjs | null, Dayjs | null],
  ) => {
    setDateRange(dates || [null, null]);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPackingListFilter("");
    setDateRange([null, null]);
    setCurrentPage(1);
  };

  const handleViewInvoice = (invoiceId: string) => {
    setInvoiceModalInvoiceId(invoiceId);
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    setInvoiceModalInvoiceId(invoiceId);
  };

  const handleRegenerateInvoice = async (record: Invoice) => {
    setRegeneratingInvoiceId(record.id);
    try {
      await regenerateInvoicePdfMutation(record.id);
      toast.success("Invoice PDF regenerated successfully");
      refetch();
    } catch (error: any) {
      console.error("Regenerate invoice failed:", error);
      const errorMessage =
        error?.response?.data?.message || "Failed to regenerate invoice PDF";
      toast.error(errorMessage);
    } finally {
      setRegeneratingInvoiceId(null);
    }
  };

  const handleMarkInvoiceStatus = async (
    invoice: Invoice,
    status: InvoiceStatus,
  ) => {
    try {
      let paidAmount = invoice.paidAmount;

      // Set paidAmount based on status
      if (status === InvoiceStatus.PAID) {
        paidAmount = invoice.totalAmount;
      } else if (status === InvoiceStatus.UNPAID) {
        paidAmount = 0;
      }
      // For PARTIALLY_PAID, keep the current paidAmount

      await updateInvoiceMutation({
        invoiceId: invoice.id,
        data: {
          status,
          paidAmount,
          notes: `Invoice marked as ${status} by admin on ${dayjs().format(
            "DD MMM, YYYY HH:mm",
          )}`,
        },
      });
      toast.success(`Invoice marked as ${status.replace("_", " ")}`);
      refetch();
    } catch (error) {
      console.error("Update invoice status failed:", error);
      toast.error("Failed to update invoice status");
    }
  };

  const handleDeleteInvoice = async (invoice: Invoice) => {
    try {
      await deleteInvoiceMutation(invoice.id);
      toast.success(`Invoice ${invoice.invoiceNumber} deleted successfully`);
      refetch();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Failed to delete invoice";
      toast.error(errorMessage);
    }
  };

  // Table columns
  const columns = [
    {
      title: "Invoice #",
      dataIndex: "invoiceNumber",
      key: "invoiceNumber",
      sorter: true,
      render: (invoiceNumber: string) => (
        <span
          style={{ fontFamily: "monospace", fontWeight: 500, fontSize: 13 }}
        >
          {invoiceNumber}
        </span>
      ),
    },
    {
      title: "Customer",
      dataIndex: "customer",
      key: "customer",
      width: 150,
      render: (customer: any) =>
        customer
          ? `${customer.firstName} ${customer.lastName || "" || ""}`
          : "N/A",
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
      title: "Package Info",
      render: (_: any, record: Invoice) => {
        if (!record.package) {
          return "N/A";
        }
        return (
          <div>
            <div style={{ fontFamily: "monospace", fontSize: "12px" }}>
              <strong>Tracking:</strong> {record.package.trackingCode}
            </div>
            {record.package.pickupCode && (
              <div style={{ fontFamily: "monospace", fontSize: "12px" }}>
                <strong>Pickup:</strong> {record.package.pickupCode}
              </div>
            )}
          </div>
        );
      },
      key: "package",
    },
    {
      title: "Total (in USD)",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amount: number, record: Invoice) => `${amount?.toFixed(2)}`,
      align: "right" as const,
    },
    {
      title: "Total (in GHS)",
      dataIndex: "localAmount",
      key: "localAmount",
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
      render: (date: string) => dayjs(date).format("DD MMM, YYYY"),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right" as const,
      width: 200,
      render: (_: any, record: Invoice) => {
        const menuItems: MenuProps["items"] = [
          {
            key: "view",
            icon: <EyeOutlined />,
            label: "View Details",
            onClick: () => handleViewInvoice(record.id),
          },
          {
            key: "download",
            icon: <DownloadOutlined />,
            label: "Download PDF",
            onClick: () => handleDownloadInvoice(record.id),
          },
          {
            key: "regenerate",
            icon: <ReloadOutlined spin={regeneratingInvoiceId === record.id} />,
            label:
              regeneratingInvoiceId === record.id
                ? "Regenerating..."
                : "Regenerate PDF",
            disabled: regeneratingInvoiceId === record.id,
            onClick: () => handleRegenerateInvoice(record),
          },
          {
            type: "divider",
          },
          {
            key: "mark-paid",
            icon: <CheckCircleOutlined />,
            label: "Mark as Paid",
            disabled: record.status === InvoiceStatus.PAID,
            onClick: () => handleMarkInvoiceStatus(record, InvoiceStatus.PAID),
          },
          {
            key: "mark-partial",
            icon: <MinusCircleOutlined />,
            label: "Mark as Partially Paid",
            disabled: record.status === InvoiceStatus.PARTIALLY_PAID,
            onClick: () =>
              handleMarkInvoiceStatus(record, InvoiceStatus.PARTIALLY_PAID),
          },
          {
            key: "mark-unpaid",
            icon: <CloseCircleOutlined />,
            label: "Mark as Unpaid",
            disabled: record.status === InvoiceStatus.UNPAID,
            onClick: () =>
              handleMarkInvoiceStatus(record, InvoiceStatus.UNPAID),
          },
          ...(user?.role === "SUPER_ADMIN"
            ? [
                {
                  type: "divider" as const,
                },
                {
                  key: "delete",
                  icon: <DeleteOutlined />,
                  label: "Delete Invoice",
                  danger: true,
                  disabled: record.status !== InvoiceStatus.UNPAID,
                  onClick: () => {
                    Modal.confirm({
                      title: "Delete Invoice",
                      content: `Are you sure you want to delete invoice ${record.invoiceNumber}? This action cannot be undone. Only invoices with no associated payments can be deleted.`,
                      okText: "Yes, Delete",
                      okButtonProps: { danger: true },
                      cancelText: "Cancel",
                      onOk: () => handleDeleteInvoice(record),
                    });
                  },
                },
              ]
            : []),
        ];

        return (
          <Space>
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewInvoice(record.id)}
            />
            <Button
              type="link"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleDownloadInvoice(record.id)}
            />
            <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
              <Button type="link" size="small" icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  // Statistics
  const totalInvoices = invoices?.meta.total || 0;
  const paidInvoices =
    invoices?.data?.filter((inv: Invoice) => inv.status === InvoiceStatus.PAID)
      .length || 0;
  const unpaidInvoices =
    invoices?.data?.filter(
      (inv: Invoice) => inv.status === InvoiceStatus.UNPAID,
    ).length || 0;
  const partialInvoices =
    invoices?.data?.filter(
      (inv: Invoice) => inv.status === InvoiceStatus.PARTIALLY_PAID,
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
    <AuthGuard requiredRoles={INVOICE_ACCESS_ROLES}>
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
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input
                  placeholder="Search by invoice #, tracking code, pickup code, container..."
                  prefix={<SearchOutlined />}
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  allowClear
                />
                <Select
                  placeholder="Filter by status"
                  value={statusFilter || undefined}
                  onChange={handleStatusFilter}
                  allowClear
                  style={{ width: "100%" }}
                >
                  <Option value={InvoiceStatus.PAID}>Paid</Option>
                  <Option value={InvoiceStatus.UNPAID}>Unpaid</Option>
                  <Option value={InvoiceStatus.PARTIALLY_PAID}>
                    Partially Paid
                  </Option>
                </Select>
                <PackingListSearchSelect
                  value={packingListFilter || undefined}
                  onChange={handlePackingListFilter}
                  placeholder="Filter by packing list"
                />
                <RangePicker
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  format="DD MMM, YYYY"
                  placeholder={["Start Date", "End Date"]}
                  style={{ width: "100%" }}
                />
                <Button
                  onClick={handleClearFilters}
                  disabled={
                    !search &&
                    !statusFilter &&
                    !packingListFilter &&
                    !dateRange[0] &&
                    !dateRange[1]
                  }
                >
                  Clear Filters
                </Button>
              </div>
            </Space>
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
