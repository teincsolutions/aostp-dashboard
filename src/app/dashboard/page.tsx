"use client";

import { useState, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  Typography,
  Space,
  Statistic,
  Empty,
  Table,
  Tag,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { Column, DualAxes, Line, Pie, Bar } from "@ant-design/charts";
import {
  DollarOutlined,
  InboxOutlined,
  TruckOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  ContainerOutlined,
  UserOutlined,
  ArrowRightOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { useDashboard } from "@/hooks/useDashboard";
import { useAuth } from "@/hooks/useAuth";
import { DashboardGraphParams } from "@/types/dashboard";
import dayjs from "dayjs";
import Link from "next/link";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function DashboardPage() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();

  const [filters, setFilters] = useState<DashboardGraphParams>({
    year: currentYear,
  });

  const dashboard = useDashboard(filters, user?.role);

  const handleYearChange = (value: number) => {
    setFilters((prev) => ({ ...prev, year: value }));
  };

  const handleDateRangeChange = (dates: any) => {
    if (dates) {
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

  const yearOptions = useMemo(() => {
    const years = [];
    for (let i = currentYear; i >= currentYear - 5; i--) {
      years.push({ label: i.toString(), value: i });
    }
    return years;
  }, [currentYear]);

  return (
    <AuthGuard>
      <AppLayout>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2}>Dashboard</Title>
            </Col>
            <Col>
              <Space>
                <Select
                  placeholder="Year"
                  value={filters.year}
                  onChange={handleYearChange}
                  options={yearOptions}
                  style={{ width: 120 }}
                />
                <RangePicker onChange={handleDateRangeChange} />
              </Space>
            </Col>
          </Row>

          {/* KPI Cards - Main Row */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Link href="/customers" style={{ textDecoration: "none" }}>
                <Card hoverable style={{ height: "140px", cursor: "pointer" }}>
                  <Statistic
                    title={
                      <Space>
                        <span>Total Customers</span>
                        <ArrowRightOutlined style={{ color: "#1890ff" }} />
                      </Space>
                    }
                    value={dashboard.kpis?.customersTotal ?? 0}
                    prefix={<UserOutlined />}
                    loading={dashboard.isLoading.kpis}
                  />
                </Card>
              </Link>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Link href="/packages" style={{ textDecoration: "none" }}>
                <Card hoverable style={{ height: "140px", cursor: "pointer" }}>
                  <Statistic
                    title={
                      <Space>
                        <span>Packages Total</span>
                        <ArrowRightOutlined style={{ color: "#1890ff" }} />
                      </Space>
                    }
                    value={dashboard.kpis?.packagesTotal ?? 0}
                    prefix={<InboxOutlined />}
                    loading={dashboard.isLoading.kpis}
                  />
                  <Space
                    style={{ marginTop: 8, fontSize: "12px", color: "#666" }}
                  >
                    <Text type="secondary">
                      AIR: {dashboard.kpis?.airTotal ?? 0}
                    </Text>
                    <Text type="secondary">|</Text>
                    <Text type="secondary">
                      SEA: {dashboard.kpis?.seaTotal ?? 0}
                    </Text>
                  </Space>
                </Card>
              </Link>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Link href="/invoices" style={{ textDecoration: "none" }}>
                <Card hoverable style={{ height: "140px", cursor: "pointer" }}>
                  <Statistic
                    title={
                      <Space>
                        <span>Invoices Total</span>
                        <ArrowRightOutlined style={{ color: "#1890ff" }} />
                      </Space>
                    }
                    value={
                      (dashboard.kpis?.paidInvoicesCount ?? 0) +
                      (dashboard.kpis?.outstandingInvoicesCount ?? 0)
                    }
                    prefix={<FileTextOutlined />}
                    loading={dashboard.isLoading.kpis}
                  />
                  <Space
                    style={{ marginTop: 8, fontSize: "12px", color: "#666" }}
                  >
                    <Text type="success">
                      Paid: {dashboard.kpis?.paidInvoicesCount ?? 0}
                    </Text>
                    <Text type="secondary">|</Text>
                    <Text type="danger">
                      Outstanding:{" "}
                      {dashboard.kpis?.outstandingInvoicesCount ?? 0}
                    </Text>
                  </Space>
                </Card>
              </Link>
            </Col>
            {dashboard.hasFinanceAccess && (
              <Col xs={24} sm={12} lg={6}>
                <Link href="/payments" style={{ textDecoration: "none" }}>
                  <Card
                    hoverable
                    style={{ height: "140px", cursor: "pointer" }}
                  >
                    <Statistic
                      title={
                        <Space>
                          <span>Payments Total</span>
                          <ArrowRightOutlined style={{ color: "#1890ff" }} />
                        </Space>
                      }
                      value={dashboard.kpis?.paymentsTotals?.amount ?? 0}
                      prefix={<DollarOutlined />}
                      precision={2}
                      loading={dashboard.isLoading.kpis}
                      suffix="USD"
                    />
                    <Space
                      style={{ marginTop: 8, fontSize: "12px", color: "#666" }}
                    >
                      <Text type="secondary">
                        GHS:{" "}
                        {dashboard.kpis?.paymentsTotals?.localAmount?.toFixed(
                          2,
                        ) ?? "0.00"}
                      </Text>
                    </Space>
                  </Card>
                </Link>
              </Col>
            )}
          </Row>

          {/* Additional KPIs - Finance View */}
          {dashboard.hasFinanceAccess && (
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <Link href="/containers" style={{ textDecoration: "none" }}>
                  <Card
                    hoverable
                    style={{ height: "140px", cursor: "pointer" }}
                  >
                    <Statistic
                      title={
                        <Space>
                          <span>Active Containers</span>
                          <ArrowRightOutlined style={{ color: "#1890ff" }} />
                        </Space>
                      }
                      value={dashboard.kpis?.activeContainers ?? 0}
                      prefix={<ContainerOutlined />}
                      loading={dashboard.isLoading.kpis}
                    />
                  </Card>
                </Link>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Link href="/invoices" style={{ textDecoration: "none" }}>
                  <Card
                    hoverable
                    style={{ height: "140px", cursor: "pointer" }}
                  >
                    <Statistic
                      title={
                        <Space>
                          <span>Outstanding Amount</span>
                          <ArrowRightOutlined style={{ color: "#1890ff" }} />
                        </Space>
                      }
                      value={dashboard.kpis?.outstandingInvoicesAmount ?? 0}
                      prefix={<DollarOutlined />}
                      precision={2}
                      valueStyle={{ color: "#cf1322" }}
                      loading={dashboard.isLoading.topCustomersByAmount}
                    />
                  </Card>
                </Link>
              </Col>
            </Row>
          )}

          {/* Charts: Invoices by Month & Payments AIR vs SEA */}
          {dashboard.hasFinanceAccess && dashboard.hasOperationsAccess && (
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card
                  title={`Invoices by Month ${
                    dashboard.invoicesByMonth?.year
                      ? `(${dashboard.invoicesByMonth.year})`
                      : ""
                  }`}
                  loading={dashboard.isLoading.invoicesByMonth}
                >
                  {dashboard.invoicesByMonth?.series &&
                  dashboard.invoicesByMonth.series.some((s) => s.count > 0) ? (
                    <Column
                      data={dashboard.invoicesByMonth.series}
                      xField="month"
                      yField="count"
                      label={{
                        position: "top",
                      }}
                      xAxis={{
                        label: {
                          autoHide: false,
                          autoRotate: false,
                        },
                      }}
                      meta={{
                        month: { alias: "Month" },
                        count: { alias: "Invoices" },
                      }}
                    />
                  ) : (
                    <Empty description="No data available" />
                  )}
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card
                  title={`Payments: AIR vs SEA ${
                    dashboard.paymentsByMonth?.year
                      ? `(${dashboard.paymentsByMonth.year})`
                      : ""
                  }`}
                  loading={dashboard.isLoading.paymentsByMonth}
                >
                  {dashboard.paymentsByMonth?.series &&
                  dashboard.paymentsByMonth.series.some(
                    (s) => s.air > 0 || s.sea > 0,
                  ) ? (
                    <Column
                      data={dashboard.paymentsByMonth.series.flatMap((item) => [
                        {
                          month: item.month,
                          type: "AIR",
                          amount: item.air,
                        },
                        {
                          month: item.month,
                          type: "SEA",
                          amount: item.sea,
                        },
                      ])}
                      xField="month"
                      yField="amount"
                      seriesField="type"
                      isGroup={true}
                      dodgePadding={4}
                      intervalPadding={20}
                      color={["#5B8FF9", "#5AD8A6"]}
                      columnStyle={{
                        radius: [4, 4, 0, 0],
                      }}
                      xAxis={{
                        label: {
                          autoHide: false,
                          autoRotate: false,
                        },
                      }}
                      yAxis={{
                        label: {
                          formatter: (v: string) => `$${v}`,
                        },
                      }}
                      tooltip={{
                        formatter: (datum: any) => {
                          return {
                            name: datum.type,
                            value: `$${datum.amount?.toFixed(2) ?? "0.00"}`,
                          };
                        },
                      }}
                      label={{
                        position: "top",
                        formatter: (datum: any) => {
                          if (!datum || !datum.amount || datum.amount === 0)
                            return "";
                          return `$${datum.amount.toFixed(0)}`;
                        },
                      }}
                      legend={{
                        position: "top-right",
                      }}
                    />
                  ) : (
                    <Empty description="No data available" />
                  )}
                </Card>
              </Col>
            </Row>
          )}

          {/* Charts: Intakes and Pickups by Month */}
          {dashboard.hasOperationsAccess && (
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card
                  title={`Package Intakes by Month ${
                    dashboard.intakesByMonth?.year
                      ? `(${dashboard.intakesByMonth.year})`
                      : ""
                  }`}
                  loading={dashboard.isLoading.intakesByMonth}
                >
                  {dashboard.intakesByMonth?.series &&
                  dashboard.intakesByMonth.series.some((s) => s.count > 0) ? (
                    <Line
                      data={dashboard.intakesByMonth.series}
                      xField="month"
                      yField="count"
                      point={{
                        size: 5,
                        shape: "diamond",
                      }}
                      label={{
                        position: "top",
                      }}
                    />
                  ) : (
                    <Empty description="No data available" />
                  )}
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card
                  title={`Pickups/Deliveries by Month ${
                    dashboard.pickupsByMonth?.year
                      ? `(${dashboard.pickupsByMonth.year})`
                      : ""
                  }`}
                  loading={dashboard.isLoading.pickupsByMonth}
                >
                  {dashboard.pickupsByMonth?.series &&
                  dashboard.pickupsByMonth.series.some((s) => s.count > 0) ? (
                    <Line
                      data={dashboard.pickupsByMonth.series}
                      xField="month"
                      yField="count"
                      smooth
                      point={{
                        size: 5,
                        shape: "circle",
                      }}
                    />
                  ) : (
                    <Empty description="No data available" />
                  )}
                </Card>
              </Col>
            </Row>
          )}

          {/* Charts: Payment Methods & Shipping Modes */}
          <Row gutter={[16, 16]}>
            {dashboard.hasFinanceAccess && (
              <Col xs={24} lg={12}>
                <Card
                  title="Payment Methods Distribution"
                  loading={dashboard.isLoading.paymentMethods}
                >
                  {dashboard.paymentMethods?.methods &&
                  dashboard.paymentMethods.methods.length > 0 ? (
                    <Pie
                      data={dashboard.paymentMethods.methods}
                      angleField="amount"
                      colorField="method"
                      radius={0.8}
                      label={{
                        formatter: (datum: any) => {
                          if (!datum) return "";
                          return `${datum.method ?? "Unknown"}: ${(
                            (datum.percent ?? 0) * 100
                          ).toFixed(1)}%`;
                        },
                      }}
                      legend={{ position: "bottom" }}
                    />
                  ) : (
                    <Empty description="No data available" />
                  )}
                </Card>
              </Col>
            )}
            {dashboard.hasOperationsAccess && (
              <Col xs={24} lg={12}>
                <Card
                  title="Shipping Modes Distribution"
                  loading={dashboard.isLoading.shippingModes}
                >
                  {dashboard.shippingModes &&
                  (dashboard.shippingModes.air > 0 ||
                    dashboard.shippingModes.sea > 0) ? (
                    <Pie
                      data={[
                        { mode: "AIR", count: dashboard.shippingModes.air },
                        { mode: "SEA", count: dashboard.shippingModes.sea },
                      ]}
                      angleField="count"
                      colorField="mode"
                      radius={0.8}
                      label={{
                        formatter: (datum: any) => {
                          if (!datum) return "";
                          return `${datum.mode ?? ""}\n${datum.count ?? 0}`;
                        },
                      }}
                      legend={{ position: "bottom" }}
                    />
                  ) : (
                    <Empty description="No data available" />
                  )}
                </Card>
              </Col>
            )}
          </Row>

          {/* Tables: Top Customers */}
          <Row gutter={[16, 16]}>
            {dashboard.hasFinanceAccess && (
              <Col xs={24} lg={12}>
                <Card
                  title={`Top 10 Customers by Revenue ${
                    dashboard.topCustomersByAmount?.year
                      ? `(${dashboard.topCustomersByAmount.year})`
                      : ""
                  }`}
                  loading={dashboard.isLoading.topCustomersByAmount}
                >
                  <Table
                    columns={[
                      {
                        title: "Rank",
                        key: "rank",
                        width: 60,
                        align: "center",
                        render: (_, __, index) => index + 1,
                      },
                      {
                        title: "Customer",
                        key: "customer",
                        render: (_, record) => (
                          <Space direction="vertical" size={0}>
                            <Text strong>{record.customerName}</Text>
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                              {record.customerCode}
                            </Text>
                          </Space>
                        ),
                      },
                      {
                        title: "Total Amount",
                        dataIndex: "totalAmount",
                        key: "totalAmount",
                        align: "right",
                        render: (val) => `$${val?.toFixed(2) ?? "0.00"}`,
                      },
                      {
                        title: "Paid",
                        dataIndex: "totalPaid",
                        key: "totalPaid",
                        align: "right",
                        render: (val) => `$${val?.toFixed(2) ?? "0.00"}`,
                      },
                      {
                        title: "Balance",
                        dataIndex: "balance",
                        key: "balance",
                        align: "right",
                        render: (val) => (
                          <Text strong type={val > 0 ? "danger" : "success"}>
                            ${val?.toFixed(2) ?? "0.00"}
                          </Text>
                        ),
                      },
                      {
                        title: "Invoices",
                        dataIndex: "invoiceCount",
                        key: "invoiceCount",
                        align: "center",
                        width: 80,
                      },
                    ]}
                    dataSource={dashboard.topCustomersByAmount?.top || []}
                    rowKey="customerCode"
                    pagination={false}
                    size="small"
                  />
                </Card>
              </Col>
            )}
            {dashboard.hasOperationsAccess && (
              <Col xs={24} lg={12}>
                <Card
                  title={`Top 10 Customers by CBM ${
                    dashboard.topCustomersShipping?.year
                      ? `(${dashboard.topCustomersShipping.year})`
                      : ""
                  }`}
                  loading={dashboard.isLoading.topCustomersShipping}
                >
                  <Table
                    columns={[
                      {
                        title: "Rank",
                        dataIndex: "rank",
                        key: "rank",
                        width: 60,
                        align: "center",
                      },
                      {
                        title: "Customer",
                        key: "customer",
                        render: (_, record) => (
                          <Space direction="vertical" size={0}>
                            <Text strong>{record.customerName}</Text>
                            <Text type="secondary" style={{ fontSize: "12px" }}>
                              {record.customerCode}
                            </Text>
                          </Space>
                        ),
                      },
                      {
                        title: "Total CBM",
                        dataIndex: "totalCBM",
                        key: "totalCBM",
                        align: "right",
                        render: (val) => `${val?.toFixed(2) ?? "0.00"}`,
                      },
                      {
                        title: "Weight (kg)",
                        dataIndex: "totalWeight",
                        key: "totalWeight",
                        align: "right",
                        render: (val) => `${val?.toFixed(2) ?? "0.00"}`,
                      },
                      {
                        title: "Invoice Amount",
                        dataIndex: "totalInvoiceAmount",
                        key: "totalInvoiceAmount",
                        align: "right",
                        render: (val) => `$${val?.toFixed(2) ?? "0.00"}`,
                      },
                      {
                        title: "Paid",
                        dataIndex: "totalPaid",
                        key: "totalPaid",
                        align: "right",
                        render: (val) => `$${val?.toFixed(2) ?? "0.00"}`,
                      },
                    ]}
                    dataSource={
                      dashboard.topCustomersShipping?.topCustomers || []
                    }
                    rowKey="customerCode"
                    pagination={false}
                    size="small"
                  />
                </Card>
              </Col>
            )}
          </Row>

          {/* Recent Activity Tables */}
          <RecentActivitySection dashboard={dashboard} />
        </Space>
      </AppLayout>
    </AuthGuard>
  );
}

// Recent Activity Tables Component
function RecentActivitySection({ dashboard }: { dashboard: any }) {
  // Recent Intakes Columns
  const recentIntakesColumns: ColumnsType<any> = [
    {
      title: "Tracking Code",
      dataIndex: "intakeTrackingCode",
      key: "intakeTrackingCode",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Customer",
      key: "customer",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.customerName}</Text>
          <Text type="secondary">{record.customerCode}</Text>
        </Space>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      width: 300,
      key: "description",
      render: (text) => (
        <Text
          style={{
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {text}
        </Text>
      ),
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      align: "center",
    },
    {
      title: "Weight (kg)",
      dataIndex: "weight",
      key: "weight",
      align: "right",
      render: (val) => val?.toFixed(2),
    },
    {
      title: "CBM",
      dataIndex: "cbm",
      key: "cbm",
      align: "right",
      render: (val) => val?.toFixed(2),
    },
    {
      title: "Warehouse",
      dataIndex: "warehouse",
      key: "warehouse",
    },
    {
      title: "Intake Date",
      dataIndex: "intakeDate",
      key: "intakeDate",
      render: (date) => dayjs(date).format("MMM DD, YYYY HH:mm"),
    },
  ];

  // Recent Invoices Columns
  const recentInvoicesColumns: ColumnsType<any> = [
    {
      title: "Invoice #",
      dataIndex: "invoiceNumber",
      key: "invoiceNumber",
      render: (text, record) => (
        <Link href={`/invoices/${record.id}`}>{text}</Link>
      ),
    },
    {
      title: "Customer",
      key: "customer",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.customerName}</Text>
          <Text type="secondary">{record.customerCode}</Text>
        </Space>
      ),
    },
    {
      title: "Total",
      dataIndex: "totalAmount",
      key: "totalAmount",
      align: "right",
      render: (val) => `$${val?.toFixed(2)}`,
    },
    {
      title: "Paid",
      dataIndex: "paidAmount",
      key: "paidAmount",
      align: "right",
      render: (val) => `$${val?.toFixed(2)}`,
    },
    {
      title: "Balance",
      dataIndex: "balance",
      key: "balance",
      align: "right",
      render: (val) => (
        <Text strong type={val > 0 ? "danger" : "success"}>
          ${val?.toFixed(2)}
        </Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const color =
          status === "PAID"
            ? "success"
            : status === "PARTIALLY_PAID"
              ? "warning"
              : "error";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Payments",
      dataIndex: "paymentCount",
      key: "paymentCount",
      align: "center",
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => dayjs(date).format("MMM DD, YYYY"),
    },
  ];

  // Aged Packages Columns
  const agedPackagesColumns: ColumnsType<any> = [
    {
      title: "Tracking Code",
      dataIndex: "trackingCode",
      key: "trackingCode",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Customer",
      key: "customer",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.customerName}</Text>
          <Text type="secondary">{record.customerCode}</Text>
        </Space>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag color="blue">{status}</Tag>,
    },
    {
      title: "Days in Warehouse",
      dataIndex: "daysInWarehouse",
      key: "daysInWarehouse",
      align: "center",
      render: (days) => (
        <Tag color={days > 90 ? "red" : days > 60 ? "orange" : "yellow"}>
          {days} days
        </Tag>
      ),
      sorter: (a, b) => a.daysInWarehouse - b.daysInWarehouse,
    },
    {
      title: "Received Date",
      dataIndex: "receivedDate",
      key: "receivedDate",
      render: (date) => dayjs(date).format("MMM DD, YYYY"),
    },
    {
      title: "Warehouse",
      dataIndex: "warehouse",
      key: "warehouse",
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      {/* Recent Intakes */}
      {dashboard.hasOperationsAccess && (
        <Card
          title={
            <Space>
              <InboxOutlined />
              20 Recent Package Intakes
            </Space>
          }
          extra={
            dashboard.recentIntakes?.hasMore && (
              <Tag color="blue">More data available</Tag>
            )
          }
          loading={dashboard.isLoading.recentIntakes}
        >
          <Table
            columns={recentIntakesColumns}
            dataSource={dashboard.recentIntakes?.items || []}
            rowKey="id"
            pagination={{
              pageSize: 10,
              total: dashboard.recentIntakes?.total || 0,
              showTotal: (total) => `Total ${total} items`,
            }}
            scroll={{ x: 1200 }}
          />
        </Card>
      )}

      {/* Recent Invoices & Payments */}
      {dashboard.hasFinanceAccess && (
        <Card
          title={
            <Space>
              <DollarOutlined />
              20 Recent Invoices & Payments
            </Space>
          }
          extra={
            dashboard.recentInvoicesPayments?.hasMore && (
              <Tag color="blue">More data available</Tag>
            )
          }
          loading={dashboard.isLoading.recentInvoicesPayments}
        >
          <Table
            columns={recentInvoicesColumns}
            dataSource={dashboard.recentInvoicesPayments?.items || []}
            rowKey="id"
            pagination={{
              pageSize: 10,
              total: dashboard.recentInvoicesPayments?.total || 0,
              showTotal: (total) => `Total ${total} items`,
            }}
            scroll={{ x: 1400 }}
          />
        </Card>
      )}

      {/* Aged Packages */}
      {dashboard.hasOperationsAccess && (
        <Card
          title={
            <Space>
              <ClockCircleOutlined />
              20 Aged Packages (Over 30 Days)
            </Space>
          }
          extra={
            dashboard.recentAgedPackages?.hasMore && (
              <Tag color="orange">More data available</Tag>
            )
          }
          loading={dashboard.isLoading.recentAgedPackages}
        >
          <Table
            columns={agedPackagesColumns}
            dataSource={dashboard.recentAgedPackages?.items || []}
            rowKey="id"
            pagination={{
              pageSize: 10,
              total: dashboard.recentAgedPackages?.total || 0,
              showTotal: (total) => `Total ${total} aged packages`,
            }}
            scroll={{ x: 1000 }}
          />
        </Card>
      )}
    </Space>
  );
}
