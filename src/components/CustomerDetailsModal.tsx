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
import dayjs from "dayjs";

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

  // Fetch customer statistics and details
  const { data: customerStatsData, isLoading: statsLoading } = useCustomerStats(
    customer?.id || ""
  );

  if (!customer) return null;

  // Combine and sort all transactions for history
  const allTransactions = [
    ...(customerStatsData?.customer?.invoices?.map((invoice: any) => ({
      id: invoice.id,
      type: "invoice" as const,
      amount: invoice.totalAmount, // Invoices are already in USD
      displayAmount: invoice.totalAmount,
      currency: invoice.currency || "USD",
      date: invoice.createdAt,
      description: `Invoice #${invoice.invoiceNumber}${
        invoice.exchangeRate?.rate
          ? ` | Rate: ${invoice.exchangeRate.rate.toFixed(4)} ${
              invoice.exchangeRate.fromCurrency
            }/${invoice.exchangeRate.toCurrency}`
          : ""
      }`,
      status: invoice.status,
    })) || []),
    ...(customerStatsData?.customer?.payments?.map((payment: any) => {
      // Convert payment amount to USD using the exchangeRate.rate field
      const usdAmount = payment.exchangeRate?.rate
        ? payment.amount / payment.exchangeRate.rate
        : payment.amount;
      return {
        id: payment.id,
        type: "payment" as const,
        amount: usdAmount, // Use converted USD amount for balance calculation
        displayAmount: payment.amount,
        currency: payment.currency,
        date: payment.createdAt,
        description: `Payment - ${payment.paymentMethod || "N/A"}${
          payment.invoice?.invoiceNumber
            ? ` | Invoice #${payment.invoice.invoiceNumber}`
            : ""
        }`,
      };
    }) || []),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Oldest first for running balance

  // Calculate running balance
  let runningBalance = 0;
  const transactionHistory = allTransactions.map((transaction) => {
    if (transaction.type === "invoice") {
      runningBalance += transaction.amount;
    } else {
      runningBalance -= transaction.amount;
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
        customer.lastName
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
        customer.lastName
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
  ];

  return (
    <Modal
      title={
        <div>
          <div className="flex items-center gap-2">
            <EyeOutlined />
            Customer Details: {customer.firstName} {customer.lastName}
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
      destroyOnClose
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
