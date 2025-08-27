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
} from "antd";
import {
  SearchOutlined,
  DollarOutlined,
  FileTextOutlined,
  PrinterOutlined,
  UserOutlined,
  CalculatorOutlined,
} from "@ant-design/icons";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import {
  useSearchInvoices,
  useCustomerInvoices,
  usePaymentHistory,
  useOutstandingBalance,
  usePaymentMutations,
  useExchangeRate,
} from "@/hooks/usePayments";
import {
  Invoice,
  PaymentCreatePayload,
  InvoiceStatus,
  PaymentMethod,
  Currency,
} from "@/types/invoice";
import { Payment } from "@/types/payment";
import { columns } from "./columns";
import { Empty } from "antd";

const { Option } = Select;
const { Title, Text } = Typography;
const { TextArea } = Input;

export default function PaymentsPage() {
  // State for UI
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoices, setSelectedInvoices] = useState<Invoice[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isReceiptDrawerVisible, setIsReceiptDrawerVisible] = useState(false);
  const [currentPayment, setCurrentPayment] = useState<Payment | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentCurrency, setPaymentCurrency] = useState<Currency>(Currency.USD);

  // Forms
  const [paymentForm] = Form.useForm();

  // React Query hooks
  const { data: searchResults, isLoading: isSearching } = useSearchInvoices({
    search: searchTerm,
    limit: 20,
  });

  const { data: customerInvoices } = useCustomerInvoices(selectedCustomerId);
  const { data: outstandingBalance } = useOutstandingBalance(selectedCustomerId);
  const { data: paymentHistory, isLoading: isLoadingHistory } = usePaymentHistory({
    customerId: selectedCustomerId,
    limit: 10,
  });

  const {
    makePayment,
    generateReceipt,
    isProcessingPayment,
  } = usePaymentMutations();

  const { data: exchangeRate } = useExchangeRate(Currency.USD, paymentCurrency);

  // Handlers
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setSelectedCustomerId("");
    setSelectedInvoices([]);
  };

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setSelectedInvoices([]);
  };


  const handleSelectAllInvoices = (checked: boolean) => {
    if (checked && customerInvoices?.data) {
      setSelectedInvoices(customerInvoices.data.filter(inv => inv.status !== InvoiceStatus.PAID));
    } else {
      setSelectedInvoices([]);
    }
  };

  const calculateTotalSelected = () => {
    return selectedInvoices.reduce((total, invoice) => total + invoice.balance, 0);
  };

  const handlePaymentSubmit = async (values: PaymentCreatePayload & { amount: string }) => {
    if (selectedInvoices.length === 0) {
      message.error("Please select at least one invoice to pay");
      return;
    }

    const totalSelected = calculateTotalSelected();
    const amount = parseFloat(values.amount);

    if (amount > totalSelected) {
      message.error("Payment amount cannot exceed the total balance of selected invoices");
      return;
    }

    try {
      const paymentData: PaymentCreatePayload = {
        customerId: selectedCustomerId,
        invoiceIds: selectedInvoices.map(inv => inv.id),
        amount: amount,
        currency: values.currency,
        paymentMethod: values.paymentMethod,
        reference: values.reference,
        notes: values.notes,
      };

      const payment = await makePayment(paymentData);
      message.success("Payment processed successfully");

      // Generate receipt automatically
      try {
        await generateReceipt(payment.id);
        message.success("Receipt generated successfully");
      } catch (error) {
        message.warning("Payment processed but receipt generation failed");
      }

      setIsPaymentModalVisible(false);
      paymentForm.resetFields();
      setSelectedInvoices([]);
      setCurrentPayment(payment);

      // Show receipt
      setTimeout(() => {
        setIsReceiptDrawerVisible(true);
      }, 500);

    } catch (error) {
      message.error("Failed to process payment");
    }
  };


  const handlePrintReceipt = () => {
    // Placeholder for print functionality
    message.info("Print functionality would be implemented here");
  };

  const currentInvoices = customerInvoices?.data || searchResults?.data || [];
  const unpaidInvoices = currentInvoices.filter(inv => inv.status !== InvoiceStatus.PAID);

  return (
    <AuthGuard>
      <AppLayout>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Payment Processing</h1>
            <Button
              type="primary"
              icon={<CalculatorOutlined />}
              onClick={() => setIsPaymentModalVisible(true)}
              disabled={selectedInvoices.length === 0}
            >
              Process Payment ({selectedInvoices.length} selected)
            </Button>
          </div>

          {/* Search Section */}
          <Card className="mb-6">
            <div className="flex gap-4 mb-4">
              <Input
                placeholder="Search by customer name, phone, or package tracking ID..."
                prefix={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="flex-1"
                allowClear
              />
              {searchResults?.data && searchResults.data.length > 0 && (
                <Select
                  placeholder="Select customer"
                  className="w-1/3"
                  onChange={handleCustomerSelect}
                  allowClear
                  showSearch
                  optionFilterProp="children"
                >
                  {searchResults.data.map((invoice) => (
                    <Option key={invoice.customerId} value={invoice.customerId}>
                      {invoice.customer.firstName} {invoice.customer.lastName} - {invoice.customer.phoneNumber}
                    </Option>
                  ))}
                </Select>
              )}
            </div>
          </Card>

          {/* Statistics Cards */}
          {selectedCustomerId && (
            <Row gutter={16} className="mb-6">
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Total Outstanding"
                    value={outstandingBalance?.totalOutstanding || 0}
                    prefix={<DollarOutlined />}
                    precision={2}
                    suffix={outstandingBalance?.currency}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Invoice Count"
                    value={outstandingBalance?.invoiceCount || 0}
                    prefix={<FileTextOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Selected Amount"
                    value={calculateTotalSelected()}
                    prefix={<DollarOutlined />}
                    precision={2}
                    valueStyle={{ color: "#1890ff" }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="Unpaid Invoices"
                    value={unpaidInvoices.length}
                    prefix={<UserOutlined />}
                  />
                </Card>
              </Col>
            </Row>
          )}

          {/* Invoices Table */}
          <Card className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <Title level={4}>Customer Invoices</Title>
              {unpaidInvoices.length > 0 && (
                <Space>
                  <Checkbox
                    onChange={(e) => handleSelectAllInvoices(e.target.checked)}
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
              loading={isSearching}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} invoices`,
              }}
              rowSelection={{
                selectedRowKeys: selectedInvoices.map(inv => inv.id),
                onChange: (selectedRowKeys) => {
                  const selected = currentInvoices.filter(inv =>
                    selectedRowKeys.includes(inv.id) && inv.status !== InvoiceStatus.PAID
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
                  <Text strong style={{ fontFamily: 'monospace' }}>
                    {invoiceNumber}
                  </Text>
                )}
              />
              <Table.Column
                title="Customer"
                key="customer"
                render={(_, record: Invoice) => (
                  <div>
                    <div style={{ fontWeight: 500 }}>
                      {record.customer.firstName} {record.customer.lastName}
                    </div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {record.customer.phoneNumber}
                    </Text>
                  </div>
                )}
              />
              <Table.Column
                title="Packages"
                dataIndex="packages"
                key="packages"
                render={(packages: Array<{ trackingCode: string }>) => (
                  <div>
                    <div>{packages.length} package{packages.length !== 1 ? 's' : ''}</div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {packages.map(pkg => pkg.trackingCode).join(', ')}
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
                    {record.currency} {amount?.toLocaleString()}
                  </Text>
                )}
                align="right"
              />
              <Table.Column
                title="Balance"
                dataIndex="balance"
                key="balance"
                render={(balance: number, record: Invoice) => (
                  <Text strong style={{ color: balance > 0 ? '#ff4d4f' : '#52c41a' }}>
                    {record.currency} {balance?.toLocaleString()}
                  </Text>
                )}
                align="right"
              />
              <Table.Column
                title="Status"
                dataIndex="status"
                key="status"
                render={(status: InvoiceStatus) => (
                  <Tag
                    color={
                      status === InvoiceStatus.PAID ? 'success' :
                      status === InvoiceStatus.UNPAID ? 'error' :
                      status === InvoiceStatus.PARTIALLY_PAID ? 'warning' : 'default'
                    }
                  >
                    {status?.replace('_', ' ')}
                  </Tag>
                )}
              />
              <Table.Column
                title="Due Date"
                dataIndex="dueDate"
                key="dueDate"
                render={(date: string) => new Date(date).toLocaleDateString()}
              />
            </Table>
          </Card>

          {/* Payment History */}
          {selectedCustomerId && (
            <Card>
              <Title level={4} className="mb-4">Recent Payment History</Title>
              <Table
                columns={columns}
                dataSource={paymentHistory?.data || []}
                loading={isLoadingHistory}
                rowKey="id"
                pagination={{
                  pageSize: 5,
                  showTotal: (total, range) =>
                    `${range[0]}-${range[1]} of ${total} payments`,
                }}
                locale={{ emptyText: <Empty description="No data" /> }}
                scroll={{ x: true }}
                size="middle"
              />
            </Card>
          )}

          {/* Payment Modal */}
          <Modal
            title="Process Payment"
            open={isPaymentModalVisible}
            onCancel={() => {
              setIsPaymentModalVisible(false);
              paymentForm.resetFields();
            }}
            footer={null}
            width={600}
          >
            <Form
              form={paymentForm}
              layout="vertical"
              onFinish={handlePaymentSubmit}
              initialValues={{
                currency: Currency.USD,
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
                  <strong style={{ color: '#1890ff' }}>
                    USD {calculateTotalSelected().toLocaleString()}
                  </strong>
                </div>
              </Card>

              <Form.Item
                name="amount"
                label="Payment Amount"
                rules={[
                  { required: true, message: "Please enter payment amount" },
                  {
                    validator: (_, value) => {
                      const amount = parseFloat(value);
                      const total = calculateTotalSelected();
                      if (amount > total) {
                        return Promise.reject(new Error("Amount cannot exceed total balance"));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <Input
                  type="number"
                  step="0.01"
                  prefix={<DollarOutlined />}
                  placeholder="Enter payment amount"
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="currency"
                    label="Currency"
                    rules={[{ required: true, message: "Please select currency" }]}
                  >
                    <Select placeholder="Select currency">
                      <Option value={Currency.USD}>USD</Option>
                      <Option value={Currency.EUR}>EUR</Option>
                      <Option value={Currency.GBP}>GBP</Option>
                      <Option value={Currency.GHS}>GHS</Option>
                      <Option value={Currency.NGN}>NGN</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="paymentMethod"
                    label="Payment Method"
                    rules={[{ required: true, message: "Please select payment method" }]}
                  >
                    <Select placeholder="Select payment method">
                      <Option value={PaymentMethod.CASH}>Cash</Option>
                      <Option value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</Option>
                      <Option value={PaymentMethod.MOBILE_MONEY}>Mobile Money</Option>
                      <Option value={PaymentMethod.CARD}>Card</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="reference" label="Reference (Optional)">
                <Input placeholder="Transaction reference or receipt number" />
              </Form.Item>

              <Form.Item name="notes" label="Notes (Optional)">
                <TextArea rows={3} placeholder="Additional notes" />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={isProcessingPayment}>
                    Process Payment
                  </Button>
                  <Button
                    onClick={() => {
                      setIsPaymentModalVisible(false);
                      paymentForm.resetFields();
                    }}
                  >
                    Cancel
                  </Button>
                </Space>
              </Form.Item>
            </Form>
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
              >
                Print
              </Button>
            }
          >
            {currentPayment && (
              <div>
                <Card className="mb-4">
                  <Descriptions column={1} bordered size="small">
                    <Descriptions.Item label="Receipt Number">
                      <strong>{currentPayment.receipt?.receiptNumber || 'N/A'}</strong>
                    </Descriptions.Item>
                    <Descriptions.Item label="Payment Code">
                      <strong>{currentPayment.paymentCode}</strong>
                    </Descriptions.Item>
                    <Descriptions.Item label="Customer">
                      {currentPayment.customer.firstName} {currentPayment.customer.lastName}
                    </Descriptions.Item>
                    <Descriptions.Item label="Phone">
                      {currentPayment.customer.phoneNumber}
                    </Descriptions.Item>
                    <Descriptions.Item label="Payment Method">
                      <Tag>{currentPayment.paymentMethod?.replace('_', ' ')}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Amount Paid">
                      <strong style={{ color: '#52c41a' }}>
                        {currentPayment.currency} {currentPayment.amount?.toLocaleString()}
                      </strong>
                    </Descriptions.Item>
                    <Descriptions.Item label="Reference">
                      {currentPayment.reference || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Processed At">
                      {new Date(currentPayment.processedAt).toLocaleString()}
                    </Descriptions.Item>
                    <Descriptions.Item label="Processed By">
                      {currentPayment.processedBy}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                <Card title="Invoice Details" size="small">
                  <List
                    size="small"
                    dataSource={currentPayment.invoices}
                    renderItem={(invoice: Invoice) => (
                      <List.Item>
                        <List.Item.Meta
                          title={`Invoice ${invoice.invoiceNumber}`}
                          description={
                            <div>
                              <div>Total: {invoice.currency} {invoice.totalAmount?.toLocaleString()}</div>
                              <div>Balance: {invoice.currency} {invoice.balance?.toLocaleString()}</div>
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
