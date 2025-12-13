"use client";

import React, { useState } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Modal,
  Form,
  message,
  Card,
  Row,
  Col,
  Statistic,
  Drawer,
  Descriptions,
  List,
  Tag,
  Checkbox,
  Typography,
  DatePicker,
  Divider,
} from "antd";

import { toast } from "sonner";
import {
  SearchOutlined,
  DollarOutlined,
  FileTextOutlined,
  PrinterOutlined,
  UserOutlined,
  CalculatorOutlined,
  EyeOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { CustomerSearchSelect } from "@/components/CustomerSearchSelect";
import { InvoiceModal } from "@/components/InvoiceModal";
import dayjs from "dayjs";

import {
  useAllPayments,
  usePaymentMutations,
  usePaymentDetail,
  usePaymentReceipt,
  usePaymentStats,
} from "@/hooks/usePayments";
import { useCustomerInvoices, usePendingInvoices } from "@/hooks/useInvoices";
import {
  Invoice,
  PaymentCreatePayload,
  InvoiceStatus,
  PaymentMethod,
  Currency,
} from "@/types/invoice";
import { getPaymentColumns } from "./columns";
import { Empty } from "antd";
import { useCustomerById } from "@/hooks/useCustomers";
import { Package } from "@/types/package";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { handleError } from "@/utils/forms/errorUtils";
import { Payment } from "@/types/payment";

const { Option } = Select;
const { Title, Text } = Typography;
const { TextArea } = Input;

export default function PaymentsPage() {
  // State for UI
  const [selectedInvoices, setSelectedInvoices] = useState<Invoice[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    Currency.USD
  );
  const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isReceiptDrawerVisible, setIsReceiptDrawerVisible] = useState(false);
  const [currentPayment, setCurrentPayment] = useState<Payment | null>(null);
  const [paymentModalStep, setPaymentModalStep] = useState<"currency" | "form">(
    "currency"
  );
  const [selectedPaymentCurrency, setSelectedPaymentCurrency] =
    useState<Currency>(Currency.USD);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  // Filter states for payments table
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filterCustomerId, setFilterCustomerId] = useState<string>("");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>("");
  const [filterCurrency, setFilterCurrency] = useState<string>("");
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  // Export states
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [selectedExportColumns, setSelectedExportColumns] = useState<string[]>([
    "paymentCode",
    "customerName",
    "amount",
    "currency",
    "processedAt",
    "paymentMethod",
  ]);

  // Invoice modal for viewing specific invoice from payment receipt
  const [viewInvoiceId, setViewInvoiceId] = useState<string | null>(null);

  // Forms
  const [paymentForm] = Form.useForm();

  const { data: allPaymentsResponse, isLoading: isLoadingAllPayments } =
    useAllPayments({
      page,
      limit,
      sortBy: "processedAt",
      sortOrder: "desc",
      customerId: filterCustomerId || undefined,
      paymentMethod: filterPaymentMethod || undefined,
      currency: filterCurrency || undefined,
      dateFrom: dateRange?.[0] || undefined,
      dateTo: dateRange?.[1] || undefined,
    });

  const allPaymentsData = allPaymentsResponse?.data || [];
  const paymentsMeta = allPaymentsResponse?.meta;

  // Fetch payment statistics with same filters
  const { data: paymentStats } = usePaymentStats({
    dateFrom: dateRange?.[0] || undefined,
    dateTo: dateRange?.[1] || undefined,
    customerId: filterCustomerId || undefined,
  });

  const { makePayment, isProcessingPayment, deletePayment } =
    usePaymentMutations();

  // Hook for single payment detail - to be used when viewing
  const { data: paymentDetail } = usePaymentDetail(currentPayment?.id || "");

  // Hook for payment receipt
  const { data: receiptData, isLoading: receiptLoading } = usePaymentReceipt(
    currentPayment?.id
  );

  const { data: customerData } = useCustomerById(selectedCustomerId);
  const { data: unpaidInvoices = [], isLoading: isLoadingUnpaidInvoices } =
    usePendingInvoices({
      customerId: selectedCustomerId,
    });

  const { activeRate } = useExchangeRate();

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setSelectedInvoices([]);
  };

  const handleSelectAllInvoices = (checked: boolean) => {
    if (checked && unpaidInvoices.length > 0) {
      setSelectedInvoices(unpaidInvoices);
    } else {
      setSelectedInvoices([]);
    }
  };

  const calculateTotalSelected = () => {
    return selectedInvoices.reduce(
      (total, invoice) => total + invoice.balance,
      0
    );
  };

  const convertAmount = (
    amount: number,
    fromCurrency: Currency,
    toCurrency: Currency
  ) => {
    if (fromCurrency === toCurrency) return amount;
    if (!activeRate) return amount;

    // Assuming activeRate is always USD to GHS
    if (fromCurrency === Currency.USD && toCurrency === Currency.GHS) {
      return amount * activeRate.rate;
    } else if (fromCurrency === Currency.GHS && toCurrency === Currency.USD) {
      return amount / activeRate.rate;
    }
    return amount;
  };

  const getConvertedBalance = (invoice: Invoice) => {
    const usdBalance =
      invoice.currency === Currency.USD
        ? invoice.balance
        : convertAmount(invoice.balance, invoice.currency, Currency.USD);
    const selectedBalance =
      selectedCurrency === Currency.USD
        ? usdBalance
        : convertAmount(usdBalance, Currency.USD, selectedCurrency);
    const ghsEquivalent = convertAmount(usdBalance, Currency.USD, Currency.GHS);
    return { selectedBalance, ghsEquivalent };
  };

  const calculateTotalSelectedConverted = () => {
    return selectedInvoices.reduce((total, invoice) => {
      const { selectedBalance } = getConvertedBalance(invoice);
      return total + selectedBalance;
    }, 0);
  };

  // Watch payment method to conditionally make reference required
  const paymentMethod = Form.useWatch("paymentMethod", paymentForm);

  const handlePaymentSubmit = async (
    values: PaymentCreatePayload & { amount: string }
  ) => {
    if (selectedInvoices.length === 0) {
      toast.error("Please select at least one invoice to pay");
      return;
    }

    // Calculate total balance in the selected payment currency
    const totalSelectedInPaymentCurrency = selectedInvoices.reduce(
      (total, invoice) => {
        const usdBalance =
          invoice.currency === Currency.USD
            ? invoice.balance
            : convertAmount(invoice.balance, invoice.currency, Currency.USD);
        const balanceInPaymentCurrency =
          values.currency === Currency.USD
            ? usdBalance
            : convertAmount(usdBalance, Currency.USD, values.currency);
        return total + balanceInPaymentCurrency;
      },
      0
    );

    const amount = parseFloat(values.amount);

    if (amount > totalSelectedInPaymentCurrency) {
      toast.error(
        `Payment amount cannot exceed the total balance of ${totalSelectedInPaymentCurrency.toFixed(
          2
        )} ${values.currency}`
      );
      return;
    }

    try {
      const paymentData: PaymentCreatePayload = {
        customerId: selectedCustomerId,
        exchangeRateId: activeRate ? activeRate.id : null,
        invoiceIds: selectedInvoices.map((inv) => inv.id),
        amount: amount,
        currency: values.currency,
        paymentMethod: values.paymentMethod,
        reference: values.reference,
        notes: values.notes,
      };

      const payment = await makePayment(paymentData);
      toast.success("Payment processed successfully");
      paymentForm.resetFields();
      setSelectedCustomerId("");
      setSelectedInvoices([]);
      setCurrentPayment(payment);
      setIsPaymentModalVisible(false);
      setIsReceiptDrawerVisible(true);
      setPaymentModalStep("currency");
      setPaymentAmount("");
    } catch (error) {
      handleError(error);
    }
  };

  const handlePrintReceipt = () => {
    if (receiptData?.url) {
      const w = window.open(receiptData.url, "_blank");
      if (w) {
        w.onload = () => {
          w.print();
          setTimeout(() => w.close(), 500); // Close after a delay
        };
      } else {
        toast.error("Failed to open receipt");
      }
    }
  };

  // Export column options
  const exportColumnOptions = [
    { label: "Payment Code", value: "paymentCode" },
    { label: "Customer Name", value: "customerName" },
    { label: "Amount", value: "amount" },
    { label: "Currency", value: "currency" },
    { label: "Payment Method", value: "paymentMethod" },
    { label: "Processed At", value: "processedAt" },
    { label: "Reference Number", value: "referenceNumber" },
  ];

  const handleBulkExport = (format: "csv" | "excel" | "pdf") => {
    if (selectedExportColumns.length === 0) {
      toast.error("Please select at least one column to export");
      return;
    }

    const payments = allPaymentsData;

    if (!payments || payments.length === 0) {
      toast.error("No payments to export");
      return;
    }

    // Get data to export based on selected columns
    const dataToExport = payments.map((payment: Payment) => {
      const row: any = {};
      selectedExportColumns.forEach((col) => {
        switch (col) {
          case "paymentCode":
            row["Payment Code"] = payment.paymentCode;
            break;
          case "customerName":
            row[
              "Customer Name"
            ] = `${payment.customer.firstName} ${payment.customer.lastName}`;
            break;
          case "amount":
            row["Amount"] = payment.amount.toFixed(2);
            break;
          case "currency":
            row["Currency"] = payment.currency;
            break;
          case "paymentMethod":
            row["Payment Method"] = payment.paymentMethod;
            break;
          case "processedAt":
            row["Processed At"] = dayjs(payment.processedAt).format(
              "DD MMM, YYYY"
            );
            break;
          case "referenceNumber":
            row["Reference Number"] = (payment as any).referenceNumber || "N/A";
            break;
        }
      });
      return row;
    });

    // Export based on format
    if (format === "csv") {
      exportToCSV(dataToExport);
    } else if (format === "excel") {
      exportToExcel(dataToExport);
    } else if (format === "pdf") {
      exportToPDF(dataToExport);
    }

    setIsExportModalVisible(false);
    toast.success(`Data exported as ${format.toUpperCase()} successfully`);
  };

  const exportToCSV = (data: any[]) => {
    if (!data || data.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((header) => `"${row[header] || ""}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `payments-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const exportToExcel = (data: any[]) => {
    if (!data || data.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((header) => `"${row[header] || ""}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `payments-${new Date().toISOString().split("T")[0]}.xlsx`;
    link.click();
  };

  const exportToPDF = (data: any[]) => {
    if (!data || data.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = Object.keys(data[0]);
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payments Export</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #4CAF50; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Payments - ${new Date().toLocaleDateString()}</h1>
          <table>
            <thead>
              <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${data
                .map(
                  (row) =>
                    `<tr>${headers
                      .map((h) => `<td>${row[h] || ""}</td>`)
                      .join("")}</tr>`
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <AuthGuard>
      <AppLayout>
        <div className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
            <h1 className="text-2xl font-bold">Payment Processing</h1>
            <Space>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => setIsExportModalVisible(true)}
              >
                Export Data
              </Button>
              <Button
                type="primary"
                icon={<CalculatorOutlined />}
                onClick={() => setIsPaymentModalVisible(true)}
                disabled={selectedInvoices.length === 0}
              >
                Process Payment ({selectedInvoices.length} selected)
              </Button>
            </Space>
          </div>

          {/* Search Section */}
          <Card className="mb-6">
            <div className="flex flex-col gap-4 md:flex-row md:gap-4 mb-4">
              <CustomerSearchSelect
                placeholder="Search and select customer"
                onSelect={handleCustomerSelect}
                showAddNew={true}
              />
              {selectedCustomerId && (
                <>
                  <Select
                    placeholder="Select currency"
                    value={selectedCurrency}
                    onChange={setSelectedCurrency}
                    style={{ minWidth: 120 }}
                  >
                    <Option value={Currency.USD}>USD</Option>
                    <Option value={Currency.GHS}>GHS</Option>
                  </Select>
                  <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => setIsInvoiceModalVisible(true)}
                  >
                    View All Invoices
                  </Button>
                </>
              )}
            </div>
          </Card>

          {/* Statistics Cards */}
          {selectedCustomerId && (
            <>
              <Row gutter={[16, 16]} className="mb-6">
                <Col xs={24} sm={12} md={6}>
                  <Card>
                    <Statistic
                      title="Invoice Count"
                      value={unpaidInvoices.length}
                      prefix={<FileTextOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card>
                    <Statistic
                      title={`Selected Amount (${selectedCurrency})`}
                      value={calculateTotalSelectedConverted()}
                      prefix={<DollarOutlined />}
                      precision={2}
                      valueStyle={{ color: "#1890ff" }}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card>
                    <Statistic
                      title="Unpaid Invoices"
                      value={unpaidInvoices.length}
                      prefix={<UserOutlined />}
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card>
                    <Statistic
                      title="Total Selected"
                      value={selectedInvoices.length}
                      prefix={<CalculatorOutlined />}
                      valueStyle={{ color: "#52c41a" }}
                    />
                  </Card>
                </Col>
              </Row>

              {/* Invoices Table */}
              <Card className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <Title level={4}>
                    ({customerData?.customerCode}) {customerData?.firstName}{" "}
                    {customerData?.lastName}&apos;s Invoices
                  </Title>
                  {unpaidInvoices.length > 0 && (
                    <Space>
                      <Checkbox
                        onChange={(e) =>
                          handleSelectAllInvoices(e.target.checked)
                        }
                        disabled={unpaidInvoices.length === 0}
                      >
                        Select All Unpaid ({unpaidInvoices.length})
                      </Checkbox>
                      <Text type="secondary">
                        Selected: {selectedInvoices.length} invoices
                      </Text>
                    </Space>
                  )}
                </div>

                <Table
                  dataSource={unpaidInvoices}
                  loading={isLoadingUnpaidInvoices}
                  rowKey="id"
                  scroll={{ x: true }}
                  pagination={{
                    pageSize: 10,
                    showTotal: (total, range) =>
                      `${range[0]}-${range[1]} of ${total} invoices`,
                  }}
                  rowSelection={{
                    selectedRowKeys: selectedInvoices.map((inv) => inv.id),
                    onChange: (selectedRowKeys) => {
                      const selected = unpaidInvoices.filter(
                        (inv) =>
                          selectedRowKeys.includes(inv.id) &&
                          inv.status !== InvoiceStatus.PAID
                      );
                      setSelectedInvoices(selected);
                    },
                    getCheckboxProps: (record) => ({
                      disabled: record.status === InvoiceStatus.PAID,
                    }),
                  }}
                >
                  <Table.Column
                    title="Invoice #"
                    dataIndex="invoiceNumber"
                    key="invoiceNumber"
                    render={(invoiceNumber: string) => (
                      <Text strong style={{ fontFamily: "monospace" }}>
                        {invoiceNumber}
                      </Text>
                    )}
                  />
                  <Table.Column
                    title="Package"
                    dataIndex="package"
                    key="package"
                    render={(_package: Package) => (
                      <div>
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          {_package?.trackingCode
                            ? _package.trackingCode
                            : "N/A"}
                        </Text>
                      </div>
                    )}
                  />
                  <Table.Column
                    title="Total Amount"
                    dataIndex="totalAmount"
                    key="totalAmount"
                    render={(amount: number, record: Invoice) => (
                      <Text strong>
                        {record.currency} {amount?.toFixed(2)}
                      </Text>
                    )}
                    align="right"
                  />
                  <Table.Column
                    title="Balance"
                    dataIndex="balance"
                    key="balance"
                    render={(balance: number, record: Invoice) => {
                      const { selectedBalance, ghsEquivalent } =
                        getConvertedBalance(record);
                      return (
                        <div style={{ textAlign: "right" }}>
                          <Text
                            strong
                            style={{
                              color:
                                selectedBalance > 0 ? "#ff4d4f" : "#52c41a",
                            }}
                          >
                            {selectedCurrency} {selectedBalance?.toFixed(2)}
                          </Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: "12px" }}>
                            GHS {ghsEquivalent?.toFixed(2)}
                          </Text>
                        </div>
                      );
                    }}
                    align="right"
                  />
                  <Table.Column
                    title="Status"
                    dataIndex="status"
                    key="status"
                    render={(status: InvoiceStatus) => (
                      <Tag
                        color={
                          status === InvoiceStatus.PAID
                            ? "success"
                            : status === InvoiceStatus.UNPAID
                            ? "error"
                            : status === InvoiceStatus.PARTIALLY_PAID
                            ? "warning"
                            : "default"
                        }
                      >
                        {status?.replace("_", " ")}
                      </Tag>
                    )}
                  />
                  <Table.Column
                    title="Due Date"
                    dataIndex="dueDate"
                    key="dueDate"
                    render={(date: string) =>
                      dayjs(date).format("DD MMM, YYYY")
                    }
                  />
                </Table>
              </Card>
            </>
          )}

          {!selectedCustomerId && (
            <Card className="mb-6">
              <div className="text-center py-12">
                <FileTextOutlined
                  style={{
                    fontSize: "48px",
                    color: "#d9d9d9",
                    marginBottom: "16px",
                  }}
                />
                <Title level={4} style={{ color: "#999", marginBottom: "8px" }}>
                  Select a Customer
                </Title>
                <Text type="secondary">
                  Search and select a customer to view their invoices and make
                  payments
                </Text>
              </div>
            </Card>
          )}

          {/* Invoice Modal for Customer Invoices */}
          <InvoiceModal
            visible={isInvoiceModalVisible}
            onClose={() => setIsInvoiceModalVisible(false)}
            invoiceId={null} // Show all customer invoices in the modal
          />

          {/* Invoice Modal for Viewing Specific Invoice from Payment Receipt */}
          <InvoiceModal
            visible={!!viewInvoiceId}
            onClose={() => setViewInvoiceId(null)}
            invoiceId={viewInvoiceId}
          />

          {/* Payment Statistics */}
          {paymentStats && (
            <Row gutter={[16, 16]} className="mb-6">
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Total Payments"
                    value={paymentStats.totalPayments || 0}
                    prefix={<FileTextOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Total Amount"
                    value={paymentStats.totalAmount || 0}
                    prefix={<DollarOutlined />}
                    precision={2}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Average Payment"
                    value={paymentStats.averagePaymentAmount || 0}
                    prefix={<DollarOutlined />}
                    precision={2}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="Cash Payments"
                    value={paymentStats.paymentsByMethod?.CASH || 0}
                  />
                </Card>
              </Col>
            </Row>
          )}

          {/* Payment History */}
          <Card
            title="All Payments"
            className="mt-6"
            extra={
              <Button
                onClick={() => {
                  setFilterCustomerId("");
                  setFilterPaymentMethod("");
                  setFilterCurrency("");
                  setDateRange(null);
                  setPage(1);
                }}
                disabled={
                  !filterCustomerId &&
                  !filterPaymentMethod &&
                  !filterCurrency &&
                  !dateRange
                }
              >
                Clear All Filters
              </Button>
            }
          >
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <Space.Compact style={{ width: "100%" }}>
                <CustomerSearchSelect
                  placeholder="Filter by customer"
                  onSelect={(customerId) => {
                    setFilterCustomerId(customerId);
                    setPage(1);
                  }}
                  value={filterCustomerId || undefined}
                />
                {filterCustomerId && (
                  <Button
                    onClick={() => {
                      setFilterCustomerId("");
                      setPage(1);
                    }}
                  >
                    Clear
                  </Button>
                )}
              </Space.Compact>
              <Select
                placeholder="Payment method"
                value={filterPaymentMethod || undefined}
                onChange={(value) => {
                  setFilterPaymentMethod(value || "");
                  setPage(1);
                }}
                allowClear
              >
                <Option value="CASH">Cash</Option>
                <Option value="BANK_TRANSFER">Bank Transfer</Option>
                <Option value="DIRECT_MOMO_TRANSFER">
                  Direct Momo Transfer
                </Option>
                <Option value="MOBILE_MONEY">Mobile Money</Option>
                <Option value="CARD">Card</Option>
                <Option value="CREDIT_CARD">Credit Card</Option>
              </Select>
              <Select
                placeholder="Currency"
                value={filterCurrency || undefined}
                onChange={(value) => {
                  setFilterCurrency(value || "");
                  setPage(1);
                }}
                allowClear
              >
                <Option value="USD">USD</Option>
                <Option value="GHS">GHS</Option>
              </Select>
              <DatePicker.RangePicker
                placeholder={["From date", "To date"]}
                onChange={(dates, dateStrings) => {
                  setDateRange(
                    dateStrings[0] && dateStrings[1]
                      ? [dateStrings[0], dateStrings[1]]
                      : null
                  );
                  setPage(1);
                }}
                className="w-full"
              />
            </div>

            {/* Active Filters Summary */}
            {(filterCustomerId ||
              filterPaymentMethod ||
              filterCurrency ||
              dateRange) && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <Space size={[0, 8]} wrap>
                  <Text strong>Active Filters:</Text>
                  {filterCustomerId && (
                    <Tag closable onClose={() => setFilterCustomerId("")}>
                      Customer: {filterCustomerId.substring(0, 8)}...
                    </Tag>
                  )}
                  {filterPaymentMethod && (
                    <Tag closable onClose={() => setFilterPaymentMethod("")}>
                      Method: {filterPaymentMethod}
                    </Tag>
                  )}
                  {filterCurrency && (
                    <Tag closable onClose={() => setFilterCurrency("")}>
                      Currency: {filterCurrency}
                    </Tag>
                  )}
                  {dateRange && (
                    <Tag closable onClose={() => setDateRange(null)}>
                      Date: {dateRange[0]} to {dateRange[1]}
                    </Tag>
                  )}
                </Space>
              </div>
            )}

            <Table
              columns={getPaymentColumns({
                handleDelete: async (id: string) => {
                  try {
                    await deletePayment(id);
                    toast.success("Payment deleted successfully");
                  } catch (error) {
                    handleError(error);
                  }
                },
                handleView: (payment) => {
                  setCurrentPayment(payment);
                  setIsReceiptDrawerVisible(true);
                },
              })}
              dataSource={allPaymentsData}
              loading={isLoadingAllPayments}
              rowKey="id"
              pagination={{
                current: page,
                pageSize: limit,
                total: paymentsMeta?.total || 0,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} payments`,
                showSizeChanger: true,
                pageSizeOptions: ["10", "20", "50", "100"],
                onChange: (newPage, newPageSize) => {
                  setPage(newPage);
                  if (newPageSize !== limit) {
                    setLimit(newPageSize);
                    setPage(1);
                  }
                },
              }}
              locale={{ emptyText: <Empty description="No payments found" /> }}
              scroll={{ x: true }}
              size="middle"
            />
          </Card>

          {/* Payment Modal */}
          <Modal
            title={
              paymentModalStep === "currency"
                ? "Select Payment Currency"
                : "Process Payment"
            }
            open={isPaymentModalVisible}
            onCancel={() => {
              setIsPaymentModalVisible(false);
              paymentForm.resetFields();
              setPaymentModalStep("currency");
            }}
            footer={null}
            width="95%"
            style={{ maxWidth: 600, margin: "16px auto" }}
          >
            {paymentModalStep === "currency" ? (
              <div>
                <Card size="small" className="mb-4">
                  <div className="flex justify-between">
                    <span>Selected Invoices:</span>
                    <strong>{selectedInvoices.length}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Balance:</span>
                    <div style={{ textAlign: "right" }}>
                      <strong style={{ color: "#1890ff" }}>
                        USD {calculateTotalSelected().toFixed(2)}
                      </strong>
                      <br />
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        GHS{" "}
                        {convertAmount(
                          calculateTotalSelected(),
                          Currency.USD,
                          Currency.GHS
                        ).toFixed(2)}
                      </Text>
                    </div>
                  </div>
                </Card>

                <Form layout="vertical">
                  <Form.Item label="Select Payment Currency">
                    <Select
                      value={selectedPaymentCurrency}
                      onChange={setSelectedPaymentCurrency}
                      size="large"
                    >
                      <Option value={Currency.USD}>USD - US Dollar</Option>
                      <Option value={Currency.GHS}>GHS - Ghana Cedi</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item>
                    <Space>
                      <Button
                        type="primary"
                        onClick={() => setPaymentModalStep("form")}
                      >
                        Continue to Payment Details
                      </Button>
                      <Button
                        onClick={() => {
                          setIsPaymentModalVisible(false);
                          setPaymentModalStep("currency");
                        }}
                      >
                        Cancel
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              </div>
            ) : (
              <Form
                form={paymentForm}
                layout="vertical"
                onFinish={handlePaymentSubmit}
                initialValues={{
                  currency: selectedPaymentCurrency,
                  paymentMethod: PaymentMethod.CASH,
                }}
              >
                <Card size="small" className="mb-4">
                  <div className="flex justify-between">
                    <span>Selected Invoices:</span>
                    <strong>{selectedInvoices.length}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Balance:</span>
                    <div style={{ textAlign: "right" }}>
                      <strong style={{ color: "#1890ff" }}>
                        USD {calculateTotalSelected().toFixed(2)}
                      </strong>
                      <br />
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        GHS{" "}
                        {convertAmount(
                          calculateTotalSelected(),
                          Currency.USD,
                          Currency.GHS
                        ).toFixed(2)}
                      </Text>
                    </div>
                  </div>
                </Card>

                <Form.Item
                  name="amount"
                  label={
                    <div>
                      Payment Amount
                      {paymentAmount && parseFloat(paymentAmount) > 0 && (
                        <Text
                          type="secondary"
                          style={{ fontSize: "12px", marginLeft: "8px" }}
                        >
                          (GHS{" "}
                          {convertAmount(
                            parseFloat(paymentAmount),
                            selectedPaymentCurrency,
                            Currency.GHS
                          ).toFixed(2)}
                          )
                        </Text>
                      )}
                    </div>
                  }
                  rules={[
                    { required: true, message: "Please enter payment amount" },
                    {
                      validator: (_, value) => {
                        if (!value) return Promise.resolve();
                        const amount = parseFloat(value);
                        // Calculate total balance in the selected payment currency
                        const totalSelectedInPaymentCurrency =
                          selectedInvoices.reduce((total, invoice) => {
                            const usdBalance =
                              invoice.currency === Currency.USD
                                ? invoice.balance
                                : convertAmount(
                                    invoice.balance,
                                    invoice.currency,
                                    Currency.USD
                                  );
                            const balanceInPaymentCurrency =
                              selectedPaymentCurrency === Currency.USD
                                ? usdBalance
                                : convertAmount(
                                    usdBalance,
                                    Currency.USD,
                                    selectedPaymentCurrency
                                  );
                            return total + balanceInPaymentCurrency;
                          }, 0);
                        if (amount > totalSelectedInPaymentCurrency) {
                          return Promise.reject(
                            new Error(
                              `Amount cannot exceed total balance of ${totalSelectedInPaymentCurrency.toFixed(
                                2
                              )} ${selectedPaymentCurrency}`
                            )
                          );
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <Input
                    type="number"
                    step="0.01"
                    prefix={<DollarOutlined />}
                    placeholder="Enter payment amount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="currency"
                      label="Currency"
                      rules={[
                        { required: true, message: "Please select currency" },
                      ]}
                    >
                      <Select placeholder="Select currency">
                        <Option value={Currency.USD}>USD</Option>
                        <Option value={Currency.GHS}>GHS</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="paymentMethod"
                      label="Payment Method"
                      rules={[
                        {
                          required: true,
                          message: "Please select payment method",
                        },
                      ]}
                    >
                      <Select placeholder="Select payment method">
                        <Option value={PaymentMethod.CASH}>Cash</Option>
                        <Option value={PaymentMethod.BANK_TRANSFER}>
                          Bank Transfer
                        </Option>
                        <Option value={PaymentMethod.MOBILE_MONEY}>
                          Mobile Money
                        </Option>
                        <Option value={PaymentMethod.CARD}>Credit Card</Option>
                        <Option value={PaymentMethod.DIRECT_MOMO_TRANSFER}>
                          Direct MoMo Transfer
                        </Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="reference"
                  label={`Reference ${
                    paymentMethod === PaymentMethod.DIRECT_MOMO_TRANSFER
                      ? "(Required)"
                      : "(Optional)"
                  }`}
                  rules={[
                    {
                      required:
                        paymentMethod === PaymentMethod.DIRECT_MOMO_TRANSFER,
                      message: "Reference is required for Direct MoMo Transfer",
                    },
                  ]}
                >
                  <Input placeholder="Transaction reference or receipt number" />
                </Form.Item>

                <Form.Item name="notes" label="Notes (Optional)">
                  <TextArea rows={3} placeholder="Additional notes" />
                </Form.Item>

                <Form.Item>
                  <Space>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={isProcessingPayment}
                    >
                      Process Payment
                    </Button>
                    <Button
                      onClick={() => {
                        setPaymentModalStep("currency");
                        paymentForm.resetFields();
                      }}
                    >
                      Back to Currency Selection
                    </Button>
                    <Button
                      onClick={() => {
                        setIsPaymentModalVisible(false);
                        paymentForm.resetFields();
                        setPaymentModalStep("currency");
                      }}
                    >
                      Cancel
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            )}
          </Modal>

          {/* Receipt Drawer */}
          <Drawer
            title="Payment Receipt"
            open={isReceiptDrawerVisible}
            onClose={() => {
              setIsReceiptDrawerVisible(false);
              setCurrentPayment(null);
            }}
            width={500}
            extra={
              <Button
                type="primary"
                icon={<PrinterOutlined />}
                onClick={handlePrintReceipt}
                loading={receiptLoading}
                disabled={!receiptData}
              >
                Print Receipt
              </Button>
            }
          >
            {currentPayment && (
              <div>
                <Card className="mb-4">
                  <Descriptions column={1} bordered size="small">
                    <Descriptions.Item label="Receipt Number">
                      <strong>
                        {currentPayment.receipt?.receiptNumber || "N/A"}
                      </strong>
                    </Descriptions.Item>
                    <Descriptions.Item label="Payment Code">
                      <strong>{currentPayment.paymentCode}</strong>
                    </Descriptions.Item>
                    <Descriptions.Item label="Customer">
                      {currentPayment.customer.firstName}{" "}
                      {currentPayment.customer.lastName}
                    </Descriptions.Item>
                    <Descriptions.Item label="Phone">
                      {currentPayment.customer.phoneNumber}
                    </Descriptions.Item>
                    <Descriptions.Item label="Payment Method">
                      <Tag>
                        {currentPayment.paymentMethod?.replace("_", " ")}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Amount Paid">
                      <strong style={{ color: "#52c41a" }}>
                        {currentPayment.currency}{" "}
                        {currentPayment.amount?.toFixed(2)}
                      </strong>
                    </Descriptions.Item>
                    <Descriptions.Item label="Reference">
                      {currentPayment.reference || "N/A"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Processed At">
                      {new Date(currentPayment.processedAt).toLocaleString()}
                    </Descriptions.Item>
                    <Descriptions.Item label="Processed By">
                      {currentPayment.processedBy.firstName}{" "}
                      {currentPayment.processedBy.lastName}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                <Card title="Invoice Details" size="small">
                  <List
                    size="small"
                    dataSource={paymentDetail?.invoices}
                    renderItem={(invoice: Invoice) => (
                      <List.Item
                        actions={[
                          <Button
                            key="view"
                            type="link"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => setViewInvoiceId(invoice.id)}
                          >
                            View Invoice
                          </Button>,
                        ]}
                      >
                        <List.Item.Meta
                          title={
                            <div className="flex justify-between items-center">
                              <span>Invoice {invoice.invoiceNumber}</span>
                              <Tag
                                color={
                                  invoice.status === InvoiceStatus.PAID
                                    ? "success"
                                    : invoice.status === InvoiceStatus.UNPAID
                                    ? "error"
                                    : invoice.status ===
                                      InvoiceStatus.PARTIALLY_PAID
                                    ? "warning"
                                    : "default"
                                }
                              >
                                {invoice.status?.replace("_", " ")}
                              </Tag>
                            </div>
                          }
                          description={
                            <div>
                              <div>
                                Total: {invoice.currency}{" "}
                                {invoice.totalAmount?.toFixed(2)}
                              </div>
                              <div>
                                Balance: {invoice.currency}{" "}
                                {invoice.balance?.toFixed(2)}
                              </div>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </div>
            )}
          </Drawer>

          {/* Export Data Modal */}
          <Modal
            title="Export Payments"
            open={isExportModalVisible}
            onCancel={() => setIsExportModalVisible(false)}
            footer={null}
            width={600}
          >
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Select Columns to Export:</h4>
                <Checkbox.Group
                  options={exportColumnOptions}
                  value={selectedExportColumns}
                  onChange={(values) =>
                    setSelectedExportColumns(values as string[])
                  }
                  className="flex flex-col gap-2"
                />
              </div>

              <Divider />

              <div>
                <h4 className="font-medium mb-3">Select Export Format:</h4>
                <Space size="middle" className="w-full" direction="vertical">
                  <Button
                    block
                    icon={<DownloadOutlined />}
                    onClick={() => handleBulkExport("csv")}
                    disabled={selectedExportColumns.length === 0}
                  >
                    Export as CSV
                  </Button>
                  <Button
                    block
                    icon={<DownloadOutlined />}
                    onClick={() => handleBulkExport("excel")}
                    disabled={selectedExportColumns.length === 0}
                  >
                    Export as Excel
                  </Button>
                  <Button
                    block
                    icon={<DownloadOutlined />}
                    onClick={() => handleBulkExport("pdf")}
                    disabled={selectedExportColumns.length === 0}
                  >
                    Export as PDF (Print)
                  </Button>
                </Space>
              </div>

              <div className="text-xs text-gray-500 mt-4">
                * {allPaymentsData?.length || 0} rows will be exported
              </div>
            </div>
          </Modal>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
