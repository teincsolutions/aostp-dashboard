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
  Tabs,
  Divider,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  DollarOutlined,
  ShoppingOutlined,
  InboxOutlined,
  UserOutlined,
  CalendarOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { useEndOfDayReport } from "@/hooks/useReports";
import { useAuth } from "@/hooks/useAuth";
import { useWarehouses } from "@/hooks/useWarehouse";
import { useUsers } from "@/hooks/useUsers";
import {
  ReportFilters,
  EndOfDayWarehouse,
  EndOfDayPaymentByMethod,
  EndOfDayPickupsByUser,
  EndOfDayActivityUser,
} from "@/types/report";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const METHOD_COLORS: Record<string, string> = {
  MOBILE_MONEY: "blue",
  CASH: "green",
  BANK_TRANSFER: "purple",
  CHEQUE: "orange",
};

const paymentMethodColumns: ColumnsType<EndOfDayPaymentByMethod> = [
  {
    title: "Payment Method",
    dataIndex: "method",
    key: "method",
    render: (m: string) => (
      <Tag color={METHOD_COLORS[m] || "default"}>
        {m.replace(/_/g, " ")}
      </Tag>
    ),
  },
  { title: "Count", dataIndex: "count", key: "count", align: "right" },
  {
    title: "GHS Total",
    dataIndex: "totalGhs",
    key: "totalGhs",
    align: "right",
    render: (v: number) => `GHS ${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
  },
  {
    title: "USD Total",
    dataIndex: "totalUsd",
    key: "totalUsd",
    align: "right",
    render: (v: number) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
  },
];

const userBreakdownColumns: ColumnsType<EndOfDayPickupsByUser> = [
  { title: "Staff Member", dataIndex: "userName", key: "userName" },
  { title: "Count", dataIndex: "count", key: "count", align: "right" },
  {
    title: "Total Qty",
    dataIndex: "totalQuantity",
    key: "totalQuantity",
    align: "right",
  },
];

const activityColumns: ColumnsType<EndOfDayActivityUser> = [
  {
    title: "Staff Member",
    dataIndex: "userName",
    key: "userName",
    fixed: "left",
    width: 180,
  },
  {
    title: "Role",
    dataIndex: "role",
    key: "role",
    width: 160,
    render: (r: string) => <Tag color="geekblue">{r.replace(/_/g, " ")}</Tag>,
  },
  {
    title: "Warehouse",
    dataIndex: "warehouse",
    key: "warehouse",
    width: 140,
  },
  {
    title: "Payments",
    key: "payments",
    width: 80,
    align: "right",
    render: (_: unknown, r: EndOfDayActivityUser) => r.paymentsProcessed,
  },
  {
    title: "GHS Received",
    key: "ghsReceived",
    width: 130,
    align: "right",
    render: (_: unknown, r: EndOfDayActivityUser) =>
      `GHS ${r.paymentsTotalGhs.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
  },
  {
    title: "USD Received",
    key: "usdReceived",
    width: 130,
    align: "right",
    render: (_: unknown, r: EndOfDayActivityUser) =>
      `$${r.paymentsTotalUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
  },
  {
    title: "Intakes",
    key: "intakes",
    width: 80,
    align: "right",
    render: (_: unknown, r: EndOfDayActivityUser) => r.packagesReceived,
  },
  {
    title: "Intake Qty",
    dataIndex: "intakeQuantity",
    key: "intakeQuantity",
    width: 100,
    align: "right",
  },
  {
    title: "Pickups",
    key: "pickups",
    width: 80,
    align: "right",
    render: (_: unknown, r: EndOfDayActivityUser) => r.pickupsReleased,
  },
  {
    title: "Pickup Qty",
    dataIndex: "pickupQuantity",
    key: "pickupQuantity",
    width: 100,
    align: "right",
  },
];

export default function EndOfDayReportPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<ReportFilters>({
    date: dayjs().format("YYYY-MM-DD"),
  });

  const { data, isLoading, error } = useEndOfDayReport(filters, user?.role);

  const { data: warehousesData } = useWarehouses({ page: 1, limit: 100 });
  const { data: usersData } = useUsers({ page: 1, limit: 100, isActive: true });

  const handleDateChange = (date: any) => {
    if (date) {
      setFilters((prev) => ({
        ...prev,
        date: date.format("YYYY-MM-DD"),
        fromDate: undefined,
        toDate: undefined,
      }));
    } else {
      setFilters((prev) => {
        const { date: _d, fromDate: _f, toDate: _t, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleWarehouseChange = (value: string | undefined) => {
    setFilters((prev) => ({ ...prev, warehouseId: value || undefined }));
  };

  const handleUserChange = (value: string | undefined) => {
    setFilters((prev) => ({ ...prev, userId: value || undefined }));
  };

  const warehouseTabs = (data?.warehouses || []).map((wh: EndOfDayWarehouse) => ({
    key: wh.warehouseId,
    label: wh.warehouseName,
    children: (
      <Row gutter={[16, 16]}>
        {/* Payment summary */}
        <Col xs={24}>
          <Card size="small" title={<><DollarOutlined /> Payments</>}>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Count"
                  value={wh.payments.count}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="GHS Total"
                  value={wh.payments.totalGhs}
                  precision={2}
                  prefix="GHS"
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="USD Total"
                  value={wh.payments.totalUsd}
                  precision={2}
                  prefix="$"
                />
              </Col>
            </Row>
            <Table
              columns={paymentMethodColumns}
              dataSource={wh.payments.byMethod}
              rowKey="method"
              size="small"
              pagination={false}
            />
          </Card>
        </Col>

        {/* Pickups */}
        <Col xs={24} sm={12}>
          <Card size="small" title={<><ShoppingOutlined /> Pickups</>}>
            <Row gutter={16} style={{ marginBottom: 12 }}>
              <Col span={12}>
                <Statistic title="Transactions" value={wh.pickups.count} />
              </Col>
              <Col span={12}>
                <Statistic title="Total Qty" value={wh.pickups.totalQuantity} />
              </Col>
            </Row>
            <Table
              columns={userBreakdownColumns}
              dataSource={wh.pickups.byUser}
              rowKey="userId"
              size="small"
              pagination={false}
            />
          </Card>
        </Col>

        {/* Intakes */}
        <Col xs={24} sm={12}>
          <Card size="small" title={<><InboxOutlined /> Intakes</>}>
            <Row gutter={16} style={{ marginBottom: 12 }}>
              <Col span={12}>
                <Statistic title="Transactions" value={wh.intakes.count} />
              </Col>
              <Col span={12}>
                <Statistic title="Total Qty" value={wh.intakes.totalQuantity} />
              </Col>
            </Row>
            <Table
              columns={userBreakdownColumns}
              dataSource={wh.intakes.byUser}
              rowKey="userId"
              size="small"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    ),
  }));

  return (
    <AuthGuard>
      <AppLayout>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* Header */}
          <Row justify="space-between" align="middle" wrap>
            <Col>
              <Title level={2}>End of Day Report</Title>
              {data && (
                <Text type="secondary">
                  <CalendarOutlined /> {data.reportDate} &nbsp;|&nbsp; Generated{" "}
                  {dayjs(data.generatedAt).format("HH:mm")}
                </Text>
              )}
            </Col>
            <Col>
              <Space wrap>
                <DatePicker
                  defaultValue={dayjs()}
                  onChange={handleDateChange}
                  allowClear
                  placeholder="Select date"
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
                <Select
                  placeholder="All Staff"
                  allowClear
                  style={{ width: 200 }}
                  showSearch
                  filterOption={(input, option) =>
                    String(option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  onChange={handleUserChange}
                  options={usersData?.data?.map((u: any) => ({
                    label: `${u.firstName} ${u.lastName}`,
                    value: u.id,
                  }))}
                />
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

          {/* Overall Summary */}
          <Card title="Overall Summary" loading={isLoading}>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Total Payments"
                  value={data?.overall?.totalPayments || 0}
                  prefix={<DollarOutlined />}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Revenue (GHS)"
                  value={data?.overall?.totalRevenueGhs || 0}
                  precision={2}
                  prefix="GHS"
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Revenue (USD)"
                  value={data?.overall?.totalRevenueUsd || 0}
                  precision={2}
                  prefix="$"
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Total Pickups"
                  value={data?.overall?.totalPickups || 0}
                  prefix={<ShoppingOutlined />}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Pickup Qty"
                  value={data?.overall?.totalPickupQuantity || 0}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Total Intakes"
                  value={data?.overall?.totalIntakes || 0}
                  prefix={<InboxOutlined />}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Intake Qty"
                  value={data?.overall?.totalIntakeQuantity || 0}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="Invoices Created"
                  value={data?.overall?.totalInvoicesCreated || 0}
                />
              </Col>
            </Row>
          </Card>

          {/* Per-Warehouse Breakdown */}
          <Card
            title={
              <Space>
                <ShopOutlined />
                <span>Warehouse Breakdown</span>
              </Space>
            }
            loading={isLoading}
          >
            {warehouseTabs.length > 0 ? (
              <Tabs items={warehouseTabs} />
            ) : (
              !isLoading && (
                <Text type="secondary">No warehouse data for this period.</Text>
              )
            )}
          </Card>

          {/* Activity by Staff */}
          <Card
            title={
              <Space>
                <UserOutlined />
                <span>Activity by Staff</span>
              </Space>
            }
            loading={isLoading}
          >
            <Divider orientation="left" plain>
              Staff summary for the selected period
            </Divider>
            <Table
              columns={activityColumns}
              dataSource={data?.activityByUser || []}
              loading={isLoading}
              rowKey="userId"
              scroll={{ x: 1200 }}
              pagination={{ pageSize: 20, showSizeChanger: true }}
              summary={(rows) => {
                const totals = rows.reduce(
                  (acc, r) => {
                    acc.paymentsProcessed += r.paymentsProcessed;
                    acc.paymentsTotalGhs += r.paymentsTotalGhs;
                    acc.paymentsTotalUsd += r.paymentsTotalUsd;
                    acc.packagesReceived += r.packagesReceived;
                    acc.intakeQuantity += r.intakeQuantity;
                    acc.pickupsReleased += r.pickupsReleased;
                    acc.pickupQuantity += r.pickupQuantity;
                    return acc;
                  },
                  {
                    paymentsProcessed: 0,
                    paymentsTotalGhs: 0,
                    paymentsTotalUsd: 0,
                    packagesReceived: 0,
                    intakeQuantity: 0,
                    pickupsReleased: 0,
                    pickupQuantity: 0,
                  }
                );
                return (
                  <Table.Summary.Row style={{ fontWeight: 600 }}>
                    <Table.Summary.Cell index={0} colSpan={3}>
                      TOTAL
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="right">
                      {totals.paymentsProcessed}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4} align="right">
                      GHS {totals.paymentsTotalGhs.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={5} align="right">
                      ${totals.paymentsTotalUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={6} align="right">
                      {totals.packagesReceived}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={7} align="right">
                      {totals.intakeQuantity}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={8} align="right">
                      {totals.pickupsReleased}
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={9} align="right">
                      {totals.pickupQuantity}
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                );
              }}
            />
          </Card>
        </Space>
      </AppLayout>
    </AuthGuard>
  );
}
