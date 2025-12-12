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
import { ShoppingOutlined } from "@ant-design/icons";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { usePickupsReport } from "@/hooks/useReports";
import { useAuth } from "@/hooks/useAuth";
import { useCustomers } from "@/hooks/useCustomers";
import { ReportFilters, PickupReportItem } from "@/types/report";
import dayjs from "dayjs";

const { Title } = Typography;
const { RangePicker } = DatePicker;

export default function PickupsReportPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<ReportFilters>({});

  const { data, isLoading, error } = usePickupsReport(filters, user?.role);

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

  const handleCustomerChange = (value: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      customerId: value || undefined,
    }));
  };

  const columns: ColumnsType<PickupReportItem> = [
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
      title: "Invoice",
      dataIndex: "invoiceNumber",
      key: "invoiceNumber",
      width: 130,
    },
    {
      title: "Pickup Code",
      dataIndex: "pickupCode",
      key: "pickupCode",
      width: 130,
    },
    {
      title: "Delivery ID",
      dataIndex: "deliveryId",
      key: "deliveryId",
      width: 130,
    },
    {
      title: "Tracking",
      dataIndex: "trackingCode",
      key: "trackingCode",
      width: 150,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      width: 200,
      ellipsis: true,
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      align: "center",
      width: 100,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => {
        const colors: Record<string, string> = {
          RELEASED: "green",
          SHIPPED: "blue",
          ARRIVED: "orange",
          RECEIVED: "default",
        };
        return <Tag color={colors[status] || "default"}>{status}</Tag>;
      },
    },
    {
      title: "Warehouse",
      dataIndex: "warehouse",
      key: "warehouse",
      width: 150,
    },
    {
      title: "Receiver",
      dataIndex: "receiverName",
      key: "receiverName",
      width: 150,
    },
    {
      title: "Pickup Date",
      dataIndex: "pickupDate",
      key: "pickupDate",
      width: 150,
      render: (date) => dayjs(date).format("MMM DD, YYYY HH:mm"),
    },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      width: 200,
      ellipsis: true,
    },
  ];

  return (
    <AuthGuard>
      <AppLayout>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2}>Pickup Report</Title>
            </Col>
            <Col>
              <Space>
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
                  title="Total Pickups"
                  value={data?.totalCount || 0}
                  prefix={<ShoppingOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {/* Pickups Table */}
          <Card>
            <Table
              columns={columns}
              dataSource={data?.pickups || []}
              loading={isLoading}
              rowKey="deliveryId"
              scroll={{ x: 1800 }}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} pickups`,
              }}
            />
          </Card>
        </Space>
      </AppLayout>
    </AuthGuard>
  );
}
