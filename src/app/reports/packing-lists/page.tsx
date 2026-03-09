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
  Progress,
  Spin,
  Alert,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { usePackingListsReport } from "@/hooks/useReports";
import { useAuth } from "@/hooks/useAuth";
import { useWarehouses } from "@/hooks/useWarehouse";
import { PACKING_LIST_REPORT_ACCESS_ROLES } from "@/lib/access-control";
import { ReportFilters, PackingListReportItem } from "@/types/report";
import { Warehouse } from "@/types/warehouse";
import dayjs from "dayjs";

const { Title } = Typography;
const { RangePicker } = DatePicker;

export default function PackingListsReportPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<ReportFilters>({});

  const { data, isLoading, error } = usePackingListsReport(filters, user?.role);

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

  const columns: ColumnsType<PackingListReportItem> = [
    {
      title: "Packing List",
      key: "name",
      fixed: "left",
      width: 150,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.name}</div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            {record.containerNumber}
          </div>
        </div>
      ),
    },
    {
      title: "Packages",
      dataIndex: "totalPackages",
      key: "totalPackages",
      align: "center",
      width: 100,
    },
    {
      title: "Customers",
      dataIndex: "totalCustomers",
      key: "totalCustomers",
      align: "center",
      width: 100,
    },
    {
      title: "Weight (kg)",
      dataIndex: "totalWeight",
      key: "totalWeight",
      align: "right",
      width: 120,
      render: (value) =>
        value.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
    },
    {
      title: "CBM",
      dataIndex: "totalCBM",
      key: "totalCBM",
      align: "right",
      width: 100,
      render: (value) =>
        value.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
    },
    {
      title: "Shipping Cost",
      dataIndex: "totalShippingCost",
      key: "totalShippingCost",
      align: "right",
      width: 150,
      render: (value) =>
        `$${value.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
    },
    {
      title: "Invoice Status",
      key: "invoiceStats",
      width: 200,
      render: (_, record) => (
        <div>
          <Progress
            percent={record.invoiceStats.paidPercentage}
            success={{ percent: record.invoiceStats.paidPercentage }}
            format={(percent) => `${percent?.toFixed(0)}% Paid`}
          />
          <div style={{ fontSize: "12px", marginTop: 4 }}>
            {record.invoiceStats.paid}/{record.invoiceStats.total} invoices
          </div>
        </div>
      ),
    },
    {
      title: "Loading Date",
      dataIndex: "loadingDate",
      key: "loadingDate",
      render: (date) => dayjs(date).format("MMM DD, YYYY"),
      width: 130,
    },
    {
      title: "ETA",
      dataIndex: "eta",
      key: "eta",
      render: (date) => dayjs(date).format("MMM DD, YYYY"),
      width: 130,
    },
  ];

  return (
    <AuthGuard requiredRoles={PACKING_LIST_REPORT_ACCESS_ROLES}>
      <AppLayout>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2}>Packing List Report</Title>
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
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Invoices"
                  value={data?.totalInvoices || 0}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Paid"
                  value={data?.paid || 0}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: "#3f8600" }}
                  suffix={`(${data?.paidPercentage.toFixed(1) || 0}%)`}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Unpaid"
                  value={data?.unpaid || 0}
                  prefix={<CloseCircleOutlined />}
                  valueStyle={{ color: "#cf1322" }}
                  suffix={`(${data?.unpaidPercentage.toFixed(1) || 0}%)`}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Partial"
                  value={data?.partial || 0}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: "#fa8c16" }}
                  suffix={`(${data?.partialPercentage.toFixed(1) || 0}%)`}
                />
              </Card>
            </Col>
          </Row>

          {/* Metrics Summary */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Total Shipping Cost"
                  value={data?.totalShippingCost || 0}
                  precision={2}
                  prefix="$"
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Total CBM"
                  value={data?.totalCBM || 0}
                  precision={2}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Total Weight"
                  value={data?.totalWeight || 0}
                  precision={2}
                  suffix="kg"
                />
              </Card>
            </Col>
          </Row>

          {/* Packing Lists Table */}
          <Card>
            <Table
              columns={columns}
              dataSource={data?.packingLists || []}
              loading={isLoading}
              rowKey="id"
              scroll={{ x: 1300 }}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} packing lists`,
              }}
            />
          </Card>
        </Space>
      </AppLayout>
    </AuthGuard>
  );
}
