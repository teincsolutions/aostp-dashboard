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
  Tabs,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { TrophyOutlined } from "@ant-design/icons";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { useCustomerLeagueReport } from "@/hooks/useReports";
import { useAuth } from "@/hooks/useAuth";
import { useWarehouses } from "@/hooks/useWarehouse";
import { useCustomers } from "@/hooks/useCustomers";
import { CUSTOMER_LEAGUE_REPORT_ACCESS_ROLES } from "@/lib/access-control";
import { ReportFilters, CustomerLeagueItem } from "@/types/report";

const { Title } = Typography;
const { RangePicker } = DatePicker;

export default function CustomerLeagueReportPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<ReportFilters>({});

  const { data, isLoading, error } = useCustomerLeagueReport(
    filters,
    user?.role
  );

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

  const leagueColumns: ColumnsType<CustomerLeagueItem> = [
    {
      title: "Rank",
      dataIndex: "rank",
      key: "rank",
      width: 80,
      align: "center",
      render: (rank) => {
        const medal =
          rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "";
        return (
          <span style={{ fontSize: "16px", fontWeight: "bold" }}>
            {medal} #{rank}
          </span>
        );
      },
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
    },
    {
      title: "Value",
      dataIndex: "value",
      key: "value",
      align: "right",
      render: (value) =>
        value.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
    },
  ];

  const tabItems = [
    {
      key: "invoices",
      label: "Top by Invoices",
      children: (
        <Table
          columns={leagueColumns}
          dataSource={data?.topByInvoices || []}
          loading={isLoading}
          rowKey="customerCode"
          pagination={false}
        />
      ),
    },
    {
      key: "payments",
      label: "Top by Payments",
      children: (
        <Table
          columns={leagueColumns}
          dataSource={data?.topByPayments || []}
          loading={isLoading}
          rowKey="customerCode"
          pagination={false}
        />
      ),
    },
    {
      key: "cbm",
      label: "Top by CBM",
      children: (
        <Table
          columns={leagueColumns}
          dataSource={data?.topByCbm || []}
          loading={isLoading}
          rowKey="customerCode"
          pagination={false}
        />
      ),
    },
    {
      key: "weight",
      label: "Top by Weight",
      children: (
        <Table
          columns={leagueColumns}
          dataSource={data?.topByWeight || []}
          loading={isLoading}
          rowKey="customerCode"
          pagination={false}
        />
      ),
    },
  ];

  return (
    <AuthGuard requiredRoles={CUSTOMER_LEAGUE_REPORT_ACCESS_ROLES}>
      <AppLayout>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2}>
                <TrophyOutlined /> Customer League Report
              </Title>
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

          {/* League Tables */}
          <Card>
            <Tabs items={tabItems} />
          </Card>
        </Space>
      </AppLayout>
    </AuthGuard>
  );
}
