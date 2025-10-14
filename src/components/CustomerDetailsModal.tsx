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
} from "@ant-design/icons";
import { Customer } from "@/types/customer";
import { useCustomerStats } from "@/hooks/useCustomers";
import { useCustomerInvoices } from "@/hooks/useInvoices";
import {
  useCustomerPayments,
  useOutstandingBalance,
} from "@/hooks/usePayments";

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

  // Fetch customer statistics
  const { data: stats, isLoading: statsLoading } = useCustomerStats(
    customer?.id || ""
  );

  // Fetch customer balance
  const { data: balance, isLoading: balanceLoading } = useOutstandingBalance(
    customer?.id || ""
  );

  // Fetch recent invoices (last 5)
  const { data: recentInvoices, isLoading: invoicesLoading } =
    useCustomerInvoices(customer?.id || "", { limit: 5 });

  // Fetch recent payments (last 5)
  const { data: paymentHistory } = useCustomerPayments(customer?.id || "", {
    limit: 5,
  });

  if (!customer) return null;

  // Combine recent activity from invoices and payments
  const recentActivity: RecentActivity[] = [
    ...(recentInvoices?.data?.map((invoice) => ({
      id: invoice.id,
      type: "invoice" as const,
      amount: invoice.totalAmount,
      currency: "GBP", // Assuming default currency from context
      date: invoice.createdAt,
      status: invoice.status,
      invoiceNumber: invoice.invoiceNumber,
    })) || []),
    ...(paymentHistory?.data?.map((payment) => ({
      id: payment.id,
      type: "payment" as const,
      amount: payment.amount,
      currency: payment.currency,
      date: payment.createdAt,
    })) || []),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const invoiceColumns = [
    {
      title: "Invoice #",
      dataIndex: "invoiceNumber",
      key: "invoiceNumber",
    },
    {
      title: "Amount (GBP)",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amount: number) => `£${amount.toFixed(2)}`,
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
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  const activityColumns = [
    {
      title: "Type",
      key: "type",
      render: (record: RecentActivity) => (
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
      title: "Details",
      key: "details",
      render: (record: RecentActivity) => (
        <>
          {record.invoiceNumber && <div>Invoice: #{record.invoiceNumber}</div>}
          <div>
            Amount:{" "}
            {record.currency === "USD"
              ? "$"
              : record.currency === "GHS"
              ? "₵"
              : "£"}
            {record.amount.toFixed(2)}
          </div>
        </>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status?: string) => {
        if (!status) return <Tag color="default">Completed</Tag>;
        return (
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
        );
      },
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  const tabItems = [
    {
      key: "stats",
      label: "Statistics",
      children: (
        <div className="space-y-6">
          {/* Summary Statistics */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Card loading={statsLoading}>
                <Statistic
                  title="Total Invoices"
                  value={stats?.totalInvoices || 0}
                  prefix={<ShoppingCartOutlined />}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card loading={statsLoading}>
                <Statistic
                  title="Total Payments"
                  value={stats?.totalPayments || 0}
                  prefix={<CreditCardOutlined />}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card loading={balanceLoading}>
                <Statistic
                  title="Outstanding Balance"
                  value={balance?.totalOutstanding || 0}
                  prefix={<DollarOutlined />}
                  suffix={balance?.currency || "GBP"}
                  valueStyle={{
                    color:
                      (balance?.totalOutstanding || 0) > 0
                        ? "#cf1322"
                        : "#3f8600",
                  }}
                />
              </Card>
            </Col>
          </Row>

          {/* Outstanding Details */}
          <Card title="Outstanding Balance Details" loading={balanceLoading}>
            {balance ? (
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="Total Outstanding"
                    value={balance.totalOutstanding}
                    suffix={balance.currency}
                    valueStyle={{ fontSize: "1.2em", color: "#cf1322" }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Invoice Count"
                    value={balance.invoiceCount || 0}
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
              dataSource={recentInvoices?.data || []}
              loading={invoicesLoading}
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
      label: "Recent Activity",
      children: (
        <Card title="Latest Transactions">
          <Table
            columns={activityColumns}
            dataSource={recentActivity}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            size="small"
            locale={{
              emptyText: <Empty description="No recent activity" />,
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
