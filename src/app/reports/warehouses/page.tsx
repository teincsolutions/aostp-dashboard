"use client";

import { useState } from "react";
import {
  Card,
  Row,
  Col,
  DatePicker,
  Typography,
  Space,
  Select,
  Alert,
  Statistic,
  List,
} from "antd";
import {
  ShopOutlined,
  UserOutlined,
  InboxOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { useWarehouseReport } from "@/hooks/useReports";
import { useAuth } from "@/hooks/useAuth";
import { useWarehouses } from "@/hooks/useWarehouse";
import { ReportFilters } from "@/types/report";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function WarehouseReportPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<ReportFilters>({});

  const { data, isLoading, error } = useWarehouseReport(filters, user?.role);

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

  return (
    <AuthGuard>
      <AppLayout>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2}>Warehouse Report</Title>
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

          {/* Overall Summary */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Packages"
                  value={data?.totalPackages || 0}
                  prefix={<InboxOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Customers"
                  value={data?.totalCustomers || 0}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Weight"
                  value={data?.totalWeight || 0}
                  precision={2}
                  suffix="kg"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total CBM"
                  value={data?.totalCBM || 0}
                  precision={2}
                />
              </Card>
            </Col>
          </Row>

          {/* Warehouse Details */}
          {data?.warehouses.map((warehouse) => (
            <Card
              key={warehouse.id}
              title={
                <Space>
                  <ShopOutlined />
                  <span>{warehouse.name}</span>
                </Space>
              }
              loading={isLoading}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                  <Statistic title="Packages" value={warehouse.totalPackages} />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Statistic
                    title="Customers"
                    value={warehouse.totalCustomers}
                  />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Statistic
                    title="Weight"
                    value={warehouse.totalWeight}
                    precision={2}
                    suffix="kg"
                  />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Statistic
                    title="CBM"
                    value={warehouse.totalCBM}
                    precision={2}
                  />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Statistic
                    title="Outstanding Invoices"
                    value={warehouse.outstandingInvoices}
                    valueStyle={{ color: "#cf1322" }}
                  />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Statistic
                    title="Outstanding Amount"
                    value={warehouse.outstandingAmount}
                    precision={2}
                    prefix={<DollarOutlined />}
                    valueStyle={{ color: "#cf1322" }}
                  />
                </Col>
              </Row>

              {warehouse.packingLists && warehouse.packingLists.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <Title level={5}>Packing Lists</Title>
                  <List
                    size="small"
                    bordered
                    dataSource={warehouse.packingLists}
                    renderItem={(item) => (
                      <List.Item>
                        <Space
                          style={{
                            width: "100%",
                            justifyContent: "space-between",
                          }}
                        >
                          <Text strong>{item.name}</Text>
                          <Text type="secondary">
                            {item.totalPackages} packages
                          </Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                </div>
              )}
            </Card>
          ))}
        </Space>
      </AppLayout>
    </AuthGuard>
  );
}
