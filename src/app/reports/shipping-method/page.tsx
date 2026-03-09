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
  Alert,
  Statistic,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { RocketOutlined, CarOutlined } from "@ant-design/icons";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { SHIPPING_METHOD_REPORT_ACCESS_ROLES } from "@/lib/access-control";
import { useShippingMethodReport } from "@/hooks/useReports";
import { useAuth } from "@/hooks/useAuth";
import { useWarehouses } from "@/hooks/useWarehouse";
import { ReportFilters, ShippingMethodTopCustomer } from "@/types/report";

const { Title } = Typography;
const { RangePicker } = DatePicker;

export default function ShippingMethodReportPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<ReportFilters>({});

  const { data, isLoading, error } = useShippingMethodReport(
    filters,
    user?.role
  );

  const { data: warehousesData } = useWarehouses({ page: 1, limit: 100 });

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

  const topCustomersColumns: ColumnsType<ShippingMethodTopCustomer> = [
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
    },
    {
      title: "Revenue",
      dataIndex: "revenue",
      key: "revenue",
      align: "right",
      render: (value) =>
        `$${value.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
    },
  ];

  return (
    <AuthGuard requiredRoles={SHIPPING_METHOD_REPORT_ACCESS_ROLES}>
      <AppLayout>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2}>Shipping Method Report</Title>
            </Col>
            <Col>
              <Space>
                <Select
                  placeholder="Select Warehouse"
                  allowClear
                  style={{ width: 200 }}
                  onChange={handleWarehouseChange}
                  options={warehousesData?.data?.map((w: any) => ({
                    label: w.name,
                    value: w.id,
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

          {/* Shipping Method Comparison */}
          {data?.shippingMethods.map((method) => (
            <Card
              key={method.mode}
              title={
                <Space>
                  {method.mode === "AIR" ? <RocketOutlined /> : <CarOutlined />}
                  <span>{method.mode} Shipping</span>
                </Space>
              }
              loading={isLoading}
            >
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                  <Statistic
                    title="Revenue"
                    value={method.revenue}
                    precision={2}
                    prefix="$"
                  />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Statistic title="Invoices" value={method.invoiceCount} />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Statistic
                    title="Outstanding"
                    value={method.outstandingCount}
                    valueStyle={{ color: "#cf1322" }}
                  />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Statistic title="Customers" value={method.customerCount} />
                </Col>
              </Row>

              <Typography.Title level={5}>Top Customers</Typography.Title>
              <Table
                columns={topCustomersColumns}
                dataSource={method.topCustomers}
                rowKey="customerCode"
                pagination={false}
                size="small"
              />
            </Card>
          ))}
        </Space>
      </AppLayout>
    </AuthGuard>
  );
}
