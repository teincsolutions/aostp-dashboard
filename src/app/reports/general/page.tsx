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
  Tag,
  Statistic,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { UserOutlined } from "@ant-design/icons";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { useGeneralReport } from "@/hooks/useReports";
import { useAuth } from "@/hooks/useAuth";
import { useWarehouses } from "@/hooks/useWarehouse";
import { useCustomers } from "@/hooks/useCustomers";
import { GENERAL_REPORT_ACCESS_ROLES } from "@/lib/access-control";
import { ReportFilters, GeneralReportCustomer } from "@/types/report";
import dayjs from "dayjs";

const { Title } = Typography;
const { RangePicker } = DatePicker;

export default function GeneralReportPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<ReportFilters>({});

  const { data, isLoading, error } = useGeneralReport(filters, user?.role);

  const { data: warehousesData } = useWarehouses({ page: 1, limit: 100 });
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

  const columns: ColumnsType<GeneralReportCustomer> = [
    {
      title: "Customer",
      key: "customer",
      fixed: "left",
      width: 200,
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
      title: "Invoices",
      key: "invoices",
      align: "center",
      width: 120,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.totalInvoices}</div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            $
            {record.totalInvoiceAmount.toLocaleString("en-US", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </div>
        </div>
      ),
    },
    {
      title: "Payments",
      key: "payments",
      align: "center",
      width: 120,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.totalPayments}</div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            $
            {record.totalPaymentAmount.toLocaleString("en-US", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </div>
        </div>
      ),
    },
    {
      title: "Pickup Rate",
      dataIndex: "pickupRate",
      key: "pickupRate",
      align: "center",
      width: 120,
      render: (value) => `${(value * 100).toFixed(1)}%`,
    },
    {
      title: "Shipping Modes",
      dataIndex: "shippingModesUsed",
      key: "shippingModesUsed",
      width: 150,
      render: (modes) => (
        <>
          {modes.map((mode: string) => (
            <Tag key={mode} color={mode === "AIR" ? "blue" : "green"}>
              {mode}
            </Tag>
          ))}
        </>
      ),
    },
    {
      title: "First Transaction",
      dataIndex: "firstDate",
      key: "firstDate",
      width: 130,
      render: (date) => dayjs(date).format("MMM DD, YYYY"),
    },
    {
      title: "Last Transaction",
      dataIndex: "lastDate",
      key: "lastDate",
      width: 130,
      render: (date) => dayjs(date).format("MMM DD, YYYY"),
    },
  ];

  return (
    <AuthGuard requiredRoles={GENERAL_REPORT_ACCESS_ROLES}>
      <AppLayout>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2}>General Report</Title>
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
                  options={customersData?.data?.map((c: any) => ({
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

          {/* Summary */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Card>
                <Statistic
                  title="Total Customers"
                  value={data?.totalCustomers || 0}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12}>
              <Card>
                <Statistic
                  title="Top Customers Shown"
                  value={data?.topCustomers?.length || 0}
                />
              </Card>
            </Col>
          </Row>

          {/* Customers Table */}
          <Card>
            <Table
              columns={columns}
              dataSource={data?.topCustomers || []}
              loading={isLoading}
              rowKey="customerCode"
              scroll={{ x: 1100 }}
              pagination={{
                pageSize: 50,
                showTotal: (total) => `Total ${total} customers`,
              }}
            />
          </Card>
        </Space>
      </AppLayout>
    </AuthGuard>
  );
}
