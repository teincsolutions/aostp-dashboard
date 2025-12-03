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
} from "@/hooks/usePayments";
import { useCustomerInvoices } from "@/hooks/useInvoices";
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
  const [searchTerm, setSearchTerm] = useState("");
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
  const [invoiceNumberFilter, setInvoiceNumberFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  // Forms
  const [paymentForm] = Form.useForm();

  // React Query hooks
  const { data: customerInvoices, isLoading: isLoadingCustomerInvoices } =
    useCustomerInvoices(selectedCustomerId, {
      page: 1,
      limit: 10,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  const { data: allPaymentsData, isLoading: isLoadingAllPayments } =
    useAllPayments({
      page: 1,
      limit: 10,
      sortBy: "createdAt",
      sortOrder: "desc",
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

  const { activeRate } = useExchangeRate();

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setSelectedInvoices([]);
  };

  const handleSelectAllInvoices = (checked: boolean) => {
    if (checked && customerInvoices?.data) {
      setSelectedInvoices(
        customerInvoices.data.filter((inv) => inv.status !== InvoiceStatus.PAID)
      );
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

  const currentInvoices = customerInvoices?.data || [];
  const unpaidInvoices = currentInvoices.filter(
    (inv: Invoice) => inv.status !== InvoiceStatus.PAID
  );

  return (
    <AuthGuard>
      <AppLayout>
        <div className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
            <h1 className="text-2xl font-bold">Payment Processing</h1>
            <Button
              type="primary"
              icon={<CalculatorOutlined />}
              onClick={() => setIsPaymentModalVisible(true)}
              disabled={selectedInvoices.length === 0}
              block
              className="max-w-xs"
            >
              Process Payment ({selectedInvoices.length} selected)
            </Button>
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
                      value={customerInvoices?.meta.total || 0}
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
                  dataSource={currentInvoices}
                  loading={isLoadingCustomerInvoices}
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
                      const selected = currentInvoices.filter(
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

          {/* Invoice Modal */}
          <InvoiceModal
            visible={isInvoiceModalVisible}
            onClose={() => setIsInvoiceModalVisible(false)}
            invoiceId={null} // Show all customer invoices in the modal
          />

          {/* Payment History */}
          <Card title="All Payments" className="mt-6">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <Input
                placeholder="Filter by invoice number"
                value={invoiceNumberFilter}
                onChange={(e) => setInvoiceNumberFilter(e.target.value)}
                allowClear
                prefix={<SearchOutlined />}
              />
              <Input
                placeholder="Filter by customer"
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                allowClear
                prefix={<UserOutlined />}
              />
              <Select
                placeholder="Payment status"
                value={paymentStatusFilter}
                onChange={setPaymentStatusFilter}
                allowClear
              >
                <Option value="COMPLETED">Completed</Option>
                <Option value="PENDING">Pending</Option>
                <Option value="FAILED">Failed</Option>
                <Option value="REFUNDED">Refunded</Option>
              </Select>
              <DatePicker.RangePicker
                placeholder={["From date", "To date"]}
                onChange={(dates, dateStrings) => {
                  setDateRange(
                    dateStrings[0] && dateStrings[1]
                      ? [dateStrings[0], dateStrings[1]]
                      : null
                  );
                }}
                className="w-full"
              />
            </div>

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
              dataSource={allPaymentsData || []}
              loading={isLoadingAllPayments}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} payments`,
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
                      <List.Item>
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
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
