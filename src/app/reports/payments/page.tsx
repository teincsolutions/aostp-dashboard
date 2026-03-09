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
  Tag,
  Alert,
  Button,
  Modal,
  Checkbox,
  Divider,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  DollarOutlined,
  WalletOutlined,
  BankOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { usePaymentsReport } from "@/hooks/useReports";
import { useAuth } from "@/hooks/useAuth";
import { useWarehouses } from "@/hooks/useWarehouse";
import { useCustomers } from "@/hooks/useCustomers";
import { useUsers } from "@/hooks/useUsers";
import { ReportFilters, PaymentReportItem } from "@/types/report";
import { Warehouse } from "@/types/warehouse";
import { Customer } from "@/types/customer";
import { User } from "@/types/user";
import { PAYMENT_REPORT_ACCESS_ROLES } from "@/lib/access-control";
import { toast } from "sonner";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function PaymentsReportPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<ReportFilters>({});

  // Export states
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [selectedExportColumns, setSelectedExportColumns] = useState<string[]>([
    "paymentCode",
    "customerName",
    "amount",
    "localAmount",
    "currency",
    "paymentMethod",
    "paymentSource",
    "warehouse",
    "processedAt",
    "processedBy",
  ]);

  const { data, isLoading, error } = usePaymentsReport(filters, user?.role);

  // Fetch warehouses for filter dropdown
  const { data: warehousesData } = useWarehouses({ page: 1, limit: 100 });

  // Fetch customers for filter dropdown
  const { data: customersData } = useCustomers({ page: 1, limit: 100 });

  // Fetch users for filter dropdown
  const { data: usersData } = useUsers({ page: 1, limit: 100, isActive: true });

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

  const handleUserChange = (value: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      processedById: value || undefined,
    }));
  };

  // Export helpers
  const getProcessedByName = (processedBy: string): string =>
    processedBy || "N/A";

  const exportColumnOptions = [
    { label: "Payment Code", value: "paymentCode" },
    { label: "Customer Name", value: "customerName" },
    { label: "Customer Code", value: "customerCode" },
    { label: "Amount (USD)", value: "amount" },
    { label: "Amount (GHS)", value: "localAmount" },
    { label: "Currency", value: "currency" },
    { label: "Payment Method", value: "paymentMethod" },
    { label: "Payment Source", value: "paymentSource" },
    { label: "Warehouse", value: "warehouse" },
    { label: "Processed At", value: "processedAt" },
    { label: "Processed By", value: "processedBy" },
  ];

  const buildExportData = () => {
    const payments = data?.payments || [];
    if (payments.length === 0) return [];

    return payments.map((payment) => {
      const row: Record<string, string> = {};
      selectedExportColumns.forEach((col) => {
        switch (col) {
          case "paymentCode":
            row["Payment Code"] = payment.paymentCode;
            break;
          case "customerName":
            row["Customer Name"] = payment.customerName;
            break;
          case "customerCode":
            row["Customer Code"] = payment.customerCode;
            break;
          case "amount":
            row["Amount (USD)"] = payment.amount.toFixed(2);
            break;
          case "localAmount":
            row["Amount (GHS)"] = payment.localAmount.toFixed(2);
            break;
          case "currency":
            row["Currency"] = payment.currency;
            break;
          case "paymentMethod":
            row["Payment Method"] = payment.paymentMethod;
            break;
          case "paymentSource":
            row["Payment Source"] = payment.paymentSource || "N/A";
            break;
          case "warehouse":
            row["Warehouse"] = payment.warehouse || "N/A";
            break;
          case "processedAt":
            row["Processed At"] = dayjs(payment.processedAt).format(
              "DD MMM, YYYY HH:mm"
            );
            break;
          case "processedBy":
            row["Processed By"] = getProcessedByName(payment.processedBy);
            break;
        }
      });
      return row;
    });
  };

  const exportToCSV = (exportData: Record<string, string>[]) => {
    if (!exportData.length) {
      toast.error("No data to export");
      return;
    }
    const headers = Object.keys(exportData[0]);
    const csvContent = [
      headers.join(","),
      ...exportData.map((row) =>
        headers.map((header) => `"${row[header] || ""}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `payments-report-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const exportToExcel = (exportData: Record<string, string>[]) => {
    if (!exportData.length) {
      toast.error("No data to export");
      return;
    }
    const headers = Object.keys(exportData[0]);
    const csvContent = [
      headers.join(","),
      ...exportData.map((row) =>
        headers.map((header) => `"${row[header] || ""}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `payments-report-${new Date().toISOString().split("T")[0]}.xlsx`;
    link.click();
  };

  const exportToPDF = (exportData: Record<string, string>[]) => {
    if (!exportData.length) {
      toast.error("No data to export");
      return;
    }
    const headers = Object.keys(exportData[0]);
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payments Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #4CAF50; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            .summary { margin-top: 10px; font-size: 14px; }
          </style>
        </head>
        <body>
          <h1>Payments Report - ${new Date().toLocaleDateString()}</h1>
          <div class="summary">
            <p><strong>Total USD:</strong> ${(data?.totals.usdTotal || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p><strong>Total GHS:</strong> ${(data?.totals.ghsTotal || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p><strong>Total Payments:</strong> ${data?.totalCount || 0}</p>
          </div>
          <table>
            <thead>
              <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${exportData
                .map(
                  (row) =>
                    `<tr>${headers.map((h) => `<td>${row[h] || ""}</td>`).join("")}</tr>`
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleBulkExport = (format: "csv" | "excel" | "pdf") => {
    if (selectedExportColumns.length === 0) {
      toast.error("Please select at least one column to export");
      return;
    }

    const exportData = buildExportData();
    if (!exportData.length) {
      toast.error("No payments to export");
      return;
    }

    if (format === "csv") {
      exportToCSV(exportData);
    } else if (format === "excel") {
      exportToExcel(exportData);
    } else if (format === "pdf") {
      exportToPDF(exportData);
    }

    setIsExportModalVisible(false);
    toast.success(`Data exported as ${format.toUpperCase()} successfully`);
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
            USD:{" "}
            {value.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            GHS:{" "}
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
      title: "Payment Source",
      dataIndex: "paymentSource",
      key: "paymentSource",
      render: (source) => {
        if (!source) return "N/A";
        const colors: Record<string, string> = {
          PAID_IN_GHANA: "green",
          PAID_IN_CHINA: "blue",
        };
        const labels: Record<string, string> = {
          PAID_IN_GHANA: "Ghana",
          PAID_IN_CHINA: "China",
        };
        return (
          <Tag color={colors[source] || "default"}>
            {labels[source] || source}
          </Tag>
        );
      },
      width: 120,
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
      render: (processedBy) => getProcessedByName(processedBy),
    },
  ];

  return (
    <AuthGuard requiredRoles={PAYMENT_REPORT_ACCESS_ROLES}>
      <AppLayout>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2}>Payments Report</Title>
            </Col>
            <Col>
              <Space wrap>
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
                <Select
                  placeholder="Filter by User"
                  allowClear
                  style={{ width: 200 }}
                  showSearch
                  filterOption={(input, option) =>
                    String(option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  onChange={handleUserChange}
                  options={usersData?.data?.map((u: User) => ({
                    label: `${u.firstName} ${u.lastName}`,
                    value: u.id,
                  }))}
                />
                <RangePicker onChange={handleDateRangeChange} />
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => setIsExportModalVisible(true)}
                >
                  Export Data
                </Button>
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

          {/* Export Data Modal */}
          <Modal
            title="Export Payments Report"
            open={isExportModalVisible}
            onCancel={() => setIsExportModalVisible(false)}
            footer={null}
            width={600}
          >
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Select Columns to Export:</h4>
                <Checkbox.Group
                  options={exportColumnOptions}
                  value={selectedExportColumns}
                  onChange={(values) =>
                    setSelectedExportColumns(values as string[])
                  }
                  className="flex flex-col gap-2"
                />
              </div>

              <Divider />

              <div>
                <h4 className="font-medium mb-3">Select Export Format:</h4>
                <Space size="middle" className="w-full" direction="vertical">
                  <Button
                    block
                    icon={<DownloadOutlined />}
                    onClick={() => handleBulkExport("csv")}
                    disabled={selectedExportColumns.length === 0}
                  >
                    Export as CSV
                  </Button>
                  <Button
                    block
                    icon={<DownloadOutlined />}
                    onClick={() => handleBulkExport("excel")}
                    disabled={selectedExportColumns.length === 0}
                  >
                    Export as Excel
                  </Button>
                  <Button
                    block
                    icon={<DownloadOutlined />}
                    onClick={() => handleBulkExport("pdf")}
                    disabled={selectedExportColumns.length === 0}
                  >
                    Export as PDF (Print)
                  </Button>
                </Space>
              </div>

              <div className="text-xs text-gray-500 mt-4">
                * {data?.payments?.length || 0} rows will be exported
              </div>
            </div>
          </Modal>
        </Space>
      </AppLayout>
    </AuthGuard>
  );
}
