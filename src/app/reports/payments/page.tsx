"use client";

import { useState, useMemo } from "react";
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
  Tag,
  Spin,
  Alert,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  DollarOutlined,
  WalletOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { usePaymentsReport } from "@/hooks/useReports";
import { useAuth } from "@/hooks/useAuth";
import { useWarehouses } from "@/hooks/useWarehouse";
import { useCustomers } from "@/hooks/useCustomers";
import { ReportFilters, PaymentReportItem } from "@/types/report";
import { Warehouse } from "@/types/warehouse";
import { Customer } from "@/types/customer";
import dayjs from "dayjs";

const { Title } = Typography;
const { RangePicker } = DatePicker;

export default function PaymentsReportPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<ReportFilters>({});

  const { data, isLoading, error } = usePaymentsReport(filters, user?.role);

  // Fetch warehouses for filter dropdown
  const { data: warehousesData } = useWarehouses({ page: 1, limit: 100 });

  // Fetch customers for filter dropdown
  const { data: customersData } = useCustomers({ page: 1, limit: 100 });

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
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

  const handleWarehouseChange = (value: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      warehouseId: value || undefined,
    }));
  };

  const handleCustomerChange = (value: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      customerId: value || undefined,
    }));
  };

  const columns: ColumnsType<PaymentReportItem> = [
    {
      title: "Payment Code",
      dataIndex: "paymentCode",
      key: "paymentCode",
      fixed: "left",
      width: 150,
    },
    {
      title: "Customer",
      key: "customer",
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.customerName}</div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            {record.customerCode}
          </div>
        </div>
      ),
      width: 200,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      render: (value, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {record.currency}{" "}
            {value.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            Local:{" "}
            {record.localAmount.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      ),
      width: 150,
    },
    {
      title: "Payment Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      render: (method) => {
        const colors: Record<string, string> = {
          MOBILE_MONEY: "blue",
          BANK_TRANSFER: "green",
          CASH: "orange",
          CARD: "purple",
        };
        return <Tag color={colors[method] || "default"}>{method}</Tag>;
      },
      width: 150,
    },
    {
      title: "Warehouse",
      dataIndex: "warehouse",
      key: "warehouse",
      width: 150,
    },
    {
      title: "Processed At",
      dataIndex: "processedAt",
      key: "processedAt",
      render: (date) => dayjs(date).format("MMM DD, YYYY HH:mm"),
      width: 180,
    },
    {
      title: "Processed By",
      dataIndex: "processedBy",
      key: "processedBy",
      width: 200,
      render: (processedBy) => {
        if (typeof processedBy === "string") {
          return processedBy;
        }
        if (processedBy && typeof processedBy === "object") {
          return `${processedBy.firstName} ${processedBy.lastName}`;
        }
        return "N/A";
      },
    },
  ];

  return (
    <AuthGuard>
      <AppLayout>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2}>Payments Report</Title>
            </Col>
            <Col>
              <Space>
                <Select
                  placeholder="Select Warehouse"
                  allowClear
                  style={{ width: 200 }}
                  onChange={handleWarehouseChange}
                  options={warehousesData?.data?.map((w: Warehouse) => ({
                    label: w.name,
                    value: w.id,
                  }))}
                />
                <Select
                  placeholder="Select Customer"
                  allowClear
                  style={{ width: 200 }}
                  showSearch
                  filterOption={(input, option) =>
                    String(option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  onChange={handleCustomerChange}
                  options={customersData?.data?.map((c: Customer) => ({
                    label: `${c.firstName} ${c.lastName} (${c.customerCode})`,
                    value: c.id,
                  }))}
                />
                <RangePicker onChange={handleDateRangeChange} />
              </Space>
            </Col>
          </Row>

          {error && (
            <Alert
              message="Error"
              description={error.message}
              type="error"
              showIcon
            />
          )}

          {/* Summary Cards */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={8}>
              <Card>
                <Statistic
                  title="Total USD"
                  value={data?.totals.usdTotal || 0}
                  prefix={<DollarOutlined />}
                  precision={2}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card>
                <Statistic
                  title="Total GHS"
                  value={data?.totals.ghsTotal || 0}
                  prefix={<WalletOutlined />}
                  precision={2}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Card>
                <Statistic
                  title="Total Payments"
                  value={data?.totalCount || 0}
                  prefix={<BankOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {/* Other Currencies Summary */}
          {data?.totals.otherCurrencies &&
            data.totals.otherCurrencies.length > 0 && (
              <Card title="Other Currencies">
                <Row gutter={[16, 16]}>
                  {data.totals.otherCurrencies.map((curr) => (
                    <Col key={curr.currency} xs={24} sm={12} lg={6}>
                      <Statistic
                        title={curr.currency}
                        value={curr.total}
                        precision={2}
                      />
                    </Col>
                  ))}
                </Row>
              </Card>
            )}

          {/* Payments Table */}
          <Card>
            <Table
              columns={columns}
              dataSource={data?.payments || []}
              loading={isLoading}
              rowKey="paymentCode"
              scroll={{ x: 1200 }}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} payments`,
              }}
            />
          </Card>
        </Space>
      </AppLayout>
    </AuthGuard>
  );
}
