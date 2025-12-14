"use client";

import React, { useState } from "react";
import {
  Modal,
  Tabs,
  Card,
  Statistic,
  Row,
  Col,
  Table,
  Avatar,
  Tag,
  Empty,
} from "antd";
import {
  DollarOutlined,
  ShoppingCartOutlined,
  CreditCardOutlined,
  CalendarOutlined,
  EyeOutlined,
  CheckOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import { Customer } from "@/types/customer";
import { useCustomerStats } from "@/hooks/useCustomers";
import { useCustomerInvoices } from "@/hooks/useInvoices";
import { useCustomerPayments } from "@/hooks/usePayments";
import { useDeliveriesByCustomer } from "@/hooks/usePackageDelivery";
import dayjs from "dayjs";
import { Invoice } from "@/types/invoice";

interface CustomerDetailsModalProps {
  visible: boolean;
  onCancel: () => void;
  customer: Customer | null;
}

interface RecentActivity {
  id: string;
  type: "invoice" | "payment";
  amount: number;
  currency: string;
  date: string;
  status?: string;
  invoiceNumber?: string;
}

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  visible,
  onCancel,
  customer,
}) => {
  const [activeTab, setActiveTab] = useState("stats");
  const [invoicePage, setInvoicePage] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);
  const [pickupPage, setPickupPage] = useState(1);

  // Fetch customer statistics and details
  const { data: customerStatsData, isLoading: statsLoading } = useCustomerStats(
    customer?.id || ""
  );

  // Fetch customer invoices
  const { data: invoicesData, isLoading: invoicesLoading } =
    useCustomerInvoices(customer?.id || "", { page: invoicePage, limit: 10 });

  // Fetch customer payments
  const { data: paymentsData, isLoading: paymentsLoading } =
    useCustomerPayments(customer?.id || "", { page: paymentPage, limit: 10 });

  // Fetch customer pickups/deliveries
  const { data: pickupsData, isLoading: pickupsLoading } =
    useDeliveriesByCustomer(customer?.id || null);

  if (!customer) return null;

  // Combine and sort all transactions for history
  const allTransactions = [
    ...(customerStatsData?.customer?.invoices?.map((invoice: Invoice) => {
      // Build description with exchange rate and alternate currency amount
      let description = `Invoice #${invoice.invoiceNumber}`;

      // Show amount in alternate currency
      if (invoice.currency === "USD") {
        description += ` USD ${invoice.totalAmount.toFixed(2)}`;
      } else if (invoice.currency === "GHS") {
        description += ` GHS ${invoice.localAmount.toFixed(2)}`;
      }

      return {
        id: invoice.id,
        type: "invoice" as const,
        amount: invoice.totalAmount, // Invoices are already in USD
        localAmount: invoice.localAmount,
        displayAmount: invoice.totalAmount,
        currency: invoice.currency || "USD",
        date: invoice.createdAt,
        description,
        status: invoice.status,
      };
    }) || []),
    ...(customerStatsData?.customer?.payments?.map((payment: any) => {
      // Build description with exchange rate and alternate currency amount
      let description = `Payment - ${payment.paymentMethod || "N/A"}`;

      if (payment.invoice?.invoiceNumber) {
        description += ` | Invoice #${payment.invoice.invoiceNumber}`;
      }

      if (payment.exchangeRate?.rate) {
        description += ` • Rate: ${payment.exchangeRate.rate.toFixed(2)} ${
          payment.exchangeRate.fromCurrency
        } ⇄ 1${payment.exchangeRate.toCurrency}`;

        // Show amount in alternate currency
        // Show amount in alternate currency
        if (payment.currency === "USD") {
          description += ` GHS ${payment.totalAmount.toFixed(2)}`;
        } else if (payment.currency === "GHS") {
          description += ` USD ${payment.localAmount.toFixed(2)}`;
        }
      }

      return {
        id: payment.id,
        type: "payment" as const,
        amount: payment.amount,
        localAmount: payment.localAmount,
        exchangeRate: payment.exchangeRate?.rate || 1,
        displayAmount: payment.amount,
        currency: payment.currency,
        date: payment.createdAt,
        description,
      };
    }) || []),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Oldest first for running balance

  // Calculate running balance
  let runningBalance = 0;
  const transactionHistory = allTransactions.map((transaction) => {
    if (transaction.type === "invoice") {
      const workingAmt = transaction.amount;
      runningBalance += workingAmt;
    } else {
      const workingAmt =
        transaction.currency === "USD"
          ? transaction.amount
          : Number(
              (transaction.localAmount * transaction.exchangeRate).toFixed(2)
            );
      runningBalance -= workingAmt;
    }
    return {
      ...transaction,
      balance: runningBalance,
    };
  });

  // Reverse for display (newest first)
  const displayTransactions = [...transactionHistory].reverse();

  const invoiceColumns = [
    {
      title: "Invoice #",
      dataIndex: "invoiceNumber",
      key: "invoiceNumber",
    },
    {
      title: "Amount",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amount: number, record: any) => {
        const currencySymbol =
          record.currency === "USD"
            ? "$"
            : record.currency === "GHS"
            ? "₵"
            : "$";
        return `${currencySymbol}${amount.toFixed(2)}`;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag
          color={
            status === "PAID"
              ? "green"
              : status === "PENDING"
              ? "orange"
              : "red"
          }
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => dayjs(date).format("DD MMM, YYYY"),
    },
  ];

  const transactionColumns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date: string) => dayjs(date).format("DD MMM, YYYY"),
    },
    {
      title: "Type",
      key: "type",
      render: (record: any) => (
        <span>
          {record.type === "invoice" ? (
            <Avatar
              size="small"
              icon={<ShoppingCartOutlined />}
              style={{ backgroundColor: "#1890ff" }}
            />
          ) : (
            <Avatar
              size="small"
              icon={<CreditCardOutlined />}
              style={{ backgroundColor: "#52c41a" }}
            />
          )}
          <span style={{ marginLeft: 8 }}>
            {record.type === "invoice" ? "Invoice" : "Payment"}
          </span>
        </span>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Amount",
      dataIndex: "displayAmount",
      key: "displayAmount",
      render: (displayAmount: number, record: any) => {
        const currencySymbol =
          record.currency === "USD"
            ? "$"
            : record.currency === "GHS"
            ? "₵"
            : "$";
        const sign = record.type === "invoice" ? "+" : "-";
        return `${sign}${currencySymbol}${displayAmount.toFixed(2)}`;
      },
    },
    {
      title: "Balance",
      dataIndex: "balance",
      key: "balance",
      render: (balance: number) => {
        const color = balance >= 0 ? "#52c41a" : "#cf1322";
        return (
          <span style={{ color, fontWeight: "bold" }}>
            ${balance.toFixed(2)}
          </span>
        );
      },
    },
  ];

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Transaction History - ${customer.firstName} ${
        customer.lastName || ""
      }</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #1890ff; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f5f5f5; }
              .positive { color: #52c41a; }
              .negative { color: #cf1322; }
              .header { margin-bottom: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Transaction History</h1>
              <p><strong>Customer:</strong> ${customer.firstName} ${
        customer.lastName || ""
      }</p>
              <p><strong>Code:</strong> ${customer.customerCode}</p>
              <p><strong>Phone:</strong> ${customer.phoneNumber}</p>
              <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                ${displayTransactions
                  .map(
                    (transaction) => `
                      <tr>
                        <td>${dayjs(transaction.date).format(
                          "DD MMM, YYYY"
                        )}</td>
                        <td>${
                          transaction.type === "invoice" ? "Invoice" : "Payment"
                        }</td>
                        <td>${transaction.description}</td>
                        <td>${transaction.type === "invoice" ? "+" : "-"}${
                      transaction.currency
                    }${transaction.displayAmount.toFixed(2)}</td>
                        <td class="${
                          transaction.balance >= 0 ? "positive" : "negative"
                        }">${transaction.currency}${transaction.balance.toFixed(
                      2
                    )}</td>
                      </tr>
                    `
                  )
                  .join("")}
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const tabItems = [
    {
      key: "info",
      label: "Customer Info",
      children: (
        <Card title="Customer Information">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <div>
                <strong>Customer Code:</strong>
                <div>{customer.customerCode}</div>
              </div>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <div>
                <strong>Full Name:</strong>
                <div>
                  {customer.firstName} {customer.lastName || "" || ""}
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <div>
                <strong>Status:</strong>
                <div>
                  <Tag color={customer.isActive ? "green" : "red"}>
                    {customer.isActive ? "Active" : "Inactive"}
                  </Tag>
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <div>
                <strong>Email:</strong>
                <div>{customer.email || "N/A"}</div>
              </div>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <div>
                <strong>Phone Number:</strong>
                <div>{customer.phoneNumber}</div>
              </div>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <div>
                <strong>Alternate Phone:</strong>
                <div>{customer.alternatePhone || "N/A"}</div>
              </div>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <div>
                <strong>Address:</strong>
                <div>{customer.address}</div>
              </div>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <div>
                <strong>ID Type:</strong>
                <div>{customer.idType || "N/A"}</div>
              </div>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <div>
                <strong>ID Number:</strong>
                <div>{customer.idNumber || "N/A"}</div>
              </div>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <div>
                <strong>Preferred Channel:</strong>
                <div>
                  <Tag color="blue">{customer.preferredChannel || "SMS"}</Tag>
                </div>
              </div>
            </Col>
          </Row>

          {/* Warehouse and City References */}
          {(customer.warehouse || customer.cityRef) && (
            <>
              <div style={{ marginTop: 24, marginBottom: 16 }}>
                <strong>Associated Locations</strong>
              </div>
              <Row gutter={[16, 16]}>
                {customer.warehouse && (
                  <Col xs={24} sm={12}>
                    <Card size="small" title="Warehouse">
                      <div>
                        <strong>Name:</strong> {customer.warehouse.name}
                      </div>
                      {customer.warehouse.location && (
                        <div>
                          <strong>Location:</strong>{" "}
                          {customer.warehouse.location}
                        </div>
                      )}
                    </Card>
                  </Col>
                )}
                {customer.cityRef && (
                  <Col xs={24} sm={12}>
                    <Card size="small" title="City">
                      <div>
                        <strong>City:</strong> {customer.cityRef.name}
                      </div>
                      {customer.cityRef.country && (
                        <div>
                          <strong>Country:</strong> {customer.cityRef.country}
                        </div>
                      )}
                    </Card>
                  </Col>
                )}
              </Row>
            </>
          )}

          {/* Timestamps */}
          <div style={{ marginTop: 24 }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <div>
                  <strong>Created At:</strong>
                  <div>
                    {dayjs(customer.createdAt).format("DD MMM, YYYY HH:mm")}
                  </div>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div>
                  <strong>Updated At:</strong>
                  <div>
                    {dayjs(customer.updatedAt).format("DD MMM, YYYY HH:mm")}
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        </Card>
      ),
    },
    {
      key: "stats",
      label: "Statistics",
      children: (
        <div className="space-y-6">
          {/* Summary Statistics */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card loading={statsLoading}>
                <Statistic
                  title="Total Packages"
                  value={
                    customerStatsData?.customer?._count?.packages ||
                    customerStatsData?.stats?.totalPackages ||
                    0
                  }
                  prefix={<ShoppingCartOutlined />}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card loading={statsLoading}>
                <Statistic
                  title="Pending Packages"
                  value={customerStatsData?.stats?.pendingPackages || 0}
                  prefix={<CalendarOutlined />}
                  valueStyle={{ color: "#faad14" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card loading={statsLoading}>
                <Statistic
                  title="Delivered Packages"
                  value={customerStatsData?.stats?.deliveredPackages || 0}
                  prefix={<CheckOutlined />}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card loading={statsLoading}>
                <Statistic
                  title="Total Spent"
                  value={(customerStatsData?.stats?.totalSpent || 0).toFixed(2)}
                  prefix={<DollarOutlined />}
                  suffix="USD"
                  valueStyle={{ color: "#722ed1" }}
                />
              </Card>
            </Col>
          </Row>

          {/* Invoice and Payment Statistics */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Card loading={statsLoading}>
                <Statistic
                  title="Total Invoices"
                  value={
                    customerStatsData?.customer?._count?.invoices ||
                    customerStatsData?.stats?.totalInvoices ||
                    0
                  }
                  prefix={<ShoppingCartOutlined />}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card loading={statsLoading}>
                <Statistic
                  title="Unpaid Invoices"
                  value={customerStatsData?.stats?.unpaidInvoices || 0}
                  prefix={<CreditCardOutlined />}
                  valueStyle={{ color: "#cf1322" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card loading={statsLoading}>
                <Statistic
                  title="Total Payments"
                  value={
                    customerStatsData?.customer?._count?.payments ||
                    customerStatsData?.stats?.totalPayments ||
                    0
                  }
                  prefix={<CreditCardOutlined />}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
          </Row>

          {/* Outstanding Details */}
          <Card title="Outstanding Balance Details" loading={statsLoading}>
            {customerStatsData?.customer?.invoices ? (
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="Total Outstanding"
                    value={customerStatsData.customer.invoices
                      .filter((inv: any) => inv.status !== "PAID")
                      .reduce(
                        (sum: number, inv: any) => sum + (inv.balance || 0),
                        0
                      )
                      .toFixed(2)}
                    suffix="USD"
                    valueStyle={{ fontSize: "1.2em", color: "#cf1322" }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Unpaid Invoice Count"
                    value={
                      customerStatsData.customer.invoices.filter(
                        (inv: any) => inv.status !== "PAID"
                      ).length
                    }
                    prefix={<ShoppingCartOutlined />}
                  />
                </Col>
              </Row>
            ) : (
              <Empty description="No outstanding balance data available" />
            )}
          </Card>

          {/* Recent Invoices */}
          <Card title="Recent Invoices">
            <Table
              columns={invoiceColumns}
              dataSource={
                customerStatsData?.customer?.invoices?.slice(0, 5) || []
              }
              loading={statsLoading}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </div>
      ),
    },
    {
      key: "activity",
      label: "Transaction History",
      children: (
        <Card
          title="Transaction History"
          extra={
            <PrinterOutlined
              onClick={handlePrint}
              style={{ fontSize: "18px", cursor: "pointer", color: "#1890ff" }}
              title="Print Transaction History"
            />
          }
        >
          <Table
            columns={transactionColumns}
            dataSource={displayTransactions}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            size="small"
            locale={{
              emptyText: <Empty description="No transactions found" />,
            }}
          />
        </Card>
      ),
    },
    {
      key: "invoices",
      label: "Invoices",
      children: (
        <Card title="Customer Invoices">
          <Table
            columns={[
              {
                title: "Invoice #",
                dataIndex: "invoiceNumber",
                key: "invoiceNumber",
              },
              {
                title: "Total Amount",
                dataIndex: "totalAmount",
                key: "totalAmount",
                render: (amount: number, record: any) => {
                  const currencySymbol =
                    record.currency === "USD"
                      ? "$"
                      : record.currency === "GHS"
                      ? "₵"
                      : "$";
                  return `${currencySymbol}${amount.toFixed(2)}`;
                },
              },
              {
                title: "Paid Amount",
                dataIndex: "paidAmount",
                key: "paidAmount",
                render: (amount: number, record: any) => {
                  const currencySymbol =
                    record.currency === "USD"
                      ? "$"
                      : record.currency === "GHS"
                      ? "₵"
                      : "$";
                  return `${currencySymbol}${(amount || 0).toFixed(2)}`;
                },
              },
              {
                title: "Balance",
                dataIndex: "balance",
                key: "balance",
                render: (balance: number, record: any) => {
                  const currencySymbol =
                    record.currency === "USD"
                      ? "$"
                      : record.currency === "GHS"
                      ? "₵"
                      : "$";
                  const color = balance > 0 ? "#cf1322" : "#52c41a";
                  return (
                    <span style={{ color, fontWeight: "bold" }}>
                      {currencySymbol}
                      {(balance || 0).toFixed(2)}
                    </span>
                  );
                },
              },
              {
                title: "Status",
                dataIndex: "status",
                key: "status",
                render: (status: string) => (
                  <Tag
                    color={
                      status === "PAID"
                        ? "green"
                        : status === "PENDING"
                        ? "orange"
                        : status === "OVERDUE"
                        ? "red"
                        : "blue"
                    }
                  >
                    {status}
                  </Tag>
                ),
              },
              {
                title: "Due Date",
                dataIndex: "dueDate",
                key: "dueDate",
                render: (date: string) =>
                  date ? dayjs(date).format("DD MMM, YYYY") : "N/A",
              },
              {
                title: "Created",
                dataIndex: "createdAt",
                key: "createdAt",
                render: (date: string) => dayjs(date).format("DD MMM, YYYY"),
              },
            ]}
            dataSource={invoicesData?.data || []}
            loading={invoicesLoading}
            rowKey="id"
            pagination={{
              current: invoicePage,
              pageSize: 10,
              total: invoicesData?.meta?.total || 0,
              onChange: (page) => setInvoicePage(page),
              showSizeChanger: false,
              showTotal: (total) => `Total ${total} invoices`,
            }}
            size="small"
            locale={{
              emptyText: <Empty description="No invoices found" />,
            }}
          />
        </Card>
      ),
    },
    {
      key: "payments",
      label: "Payments",
      children: (
        <Card title="Customer Payments">
          <Table
            columns={[
              {
                title: "Payment ID",
                dataIndex: "id",
                key: "id",
                render: (id: string) => id.substring(0, 8) + "...",
              },
              {
                title: "Amount",
                dataIndex: "amount",
                key: "amount",
                render: (amount: number, record: any) => {
                  const currencySymbol =
                    record.currency === "USD"
                      ? "$"
                      : record.currency === "GHS"
                      ? "₵"
                      : "$";
                  return (
                    <span style={{ color: "#52c41a", fontWeight: "bold" }}>
                      {currencySymbol}
                      {amount.toFixed(2)}
                    </span>
                  );
                },
              },
              {
                title: "Payment Method",
                dataIndex: "paymentMethod",
                key: "paymentMethod",
                render: (method: string) => (
                  <Tag color="blue">{method || "N/A"}</Tag>
                ),
              },
              {
                title: "Invoice #",
                key: "invoice",
                render: (record: any) => record.invoice?.invoiceNumber || "N/A",
              },
              {
                title: "Reference",
                dataIndex: "transactionReference",
                key: "transactionReference",
                render: (ref: string) => ref || "N/A",
              },
              {
                title: "Payment Date",
                dataIndex: "paymentDate",
                key: "paymentDate",
                render: (date: string) =>
                  date ? dayjs(date).format("DD MMM, YYYY HH:mm") : "N/A",
              },
              {
                title: "Created",
                dataIndex: "createdAt",
                key: "createdAt",
                render: (date: string) =>
                  dayjs(date).format("DD MMM, YYYY HH:mm"),
              },
            ]}
            dataSource={paymentsData?.data || []}
            loading={paymentsLoading}
            rowKey="id"
            pagination={{
              current: paymentPage,
              pageSize: 10,
              total: paymentsData?.meta?.total || 0,
              onChange: (page) => setPaymentPage(page),
              showSizeChanger: false,
              showTotal: (total) => `Total ${total} payments`,
            }}
            size="small"
            locale={{
              emptyText: <Empty description="No payments found" />,
            }}
          />
        </Card>
      ),
    },
    {
      key: "pickups",
      label: "Pickups/Deliveries",
      children: (
        <Card title="Package Pickups & Deliveries">
          <Table
            columns={[
              {
                title: "Delivery ID",
                dataIndex: "id",
                key: "id",
                render: (id: string) => id.substring(0, 8) + "...",
              },
              {
                title: "Invoice #",
                key: "invoice",
                render: (record: any) => record.invoice?.invoiceNumber || "N/A",
              },
              {
                title: "Packages Count",
                key: "packagesCount",
                render: (record: any) => record.packages?.length || 0,
              },
              {
                title: "Delivery Method",
                dataIndex: "deliveryMethod",
                key: "deliveryMethod",
                render: (method: string) => (
                  <Tag color="purple">{method || "N/A"}</Tag>
                ),
              },
              {
                title: "Receiver Name",
                dataIndex: "receiverName",
                key: "receiverName",
                render: (name: string) => name || "N/A",
              },
              {
                title: "Receiver Phone",
                dataIndex: "receiverPhone",
                key: "receiverPhone",
                render: (phone: string) => phone || "N/A",
              },
              {
                title: "Status",
                dataIndex: "status",
                key: "status",
                render: (status: string) => (
                  <Tag
                    color={
                      status === "DELIVERED"
                        ? "green"
                        : status === "PENDING"
                        ? "orange"
                        : status === "IN_TRANSIT"
                        ? "blue"
                        : "default"
                    }
                  >
                    {status || "PENDING"}
                  </Tag>
                ),
              },
              {
                title: "Delivery Date",
                dataIndex: "deliveryDate",
                key: "deliveryDate",
                render: (date: string) =>
                  date ? dayjs(date).format("DD MMM, YYYY HH:mm") : "N/A",
              },
              {
                title: "Created",
                dataIndex: "createdAt",
                key: "createdAt",
                render: (date: string) =>
                  dayjs(date).format("DD MMM, YYYY HH:mm"),
              },
            ]}
            dataSource={pickupsData || []}
            loading={pickupsLoading}
            rowKey="id"
            pagination={{
              current: pickupPage,
              pageSize: 10,
              onChange: (page) => setPickupPage(page),
              showSizeChanger: false,
              showTotal: (total) => `Total ${total} deliveries`,
            }}
            size="small"
            locale={{
              emptyText: <Empty description="No pickups/deliveries found" />,
            }}
            expandable={{
              expandedRowRender: (record: any) => (
                <div style={{ padding: "16px", backgroundColor: "#fafafa" }}>
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <strong>Delivery Address:</strong>
                      <div>{record.deliveryAddress || "N/A"}</div>
                    </Col>
                    <Col span={12}>
                      <strong>Notes:</strong>
                      <div>{record.notes || "N/A"}</div>
                    </Col>
                  </Row>
                  {record.packages && record.packages.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <strong>Packages:</strong>
                      <ul style={{ marginTop: 8 }}>
                        {record.packages.map((pkg: any) => (
                          <li key={pkg.id}>
                            Tracking: {pkg.trackingId} -{" "}
                            {pkg.description || "N/A"}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ),
            }}
          />
        </Card>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div>
          <div className="flex items-center gap-2">
            <EyeOutlined />
            Customer Details: {customer.firstName}{" "}
            {customer.lastName || "" || ""}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Code: {customer.customerCode} | Phone: {customer.phoneNumber}
          </div>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={1200}
      destroyOnHidden
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        type="card"
      />
    </Modal>
  );
};
