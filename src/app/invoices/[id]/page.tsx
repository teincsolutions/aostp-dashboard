"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  Descriptions,
  Space,
  Button,
  Typography,
  Row,
  Col,
  Statistic,
  Tag,
  Table,
  Spin,
  Empty,
  Divider,
  Alert,
  Popconfirm,
} from "antd";
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  FileTextOutlined,
  DollarOutlined,
  CalendarOutlined,
  UserOutlined,
  InboxOutlined,
  ReloadOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import {
  useInvoice,
  useInvoicePdf,
  useRegenerateInvoicePdf,
} from "@/hooks/useInvoices";
import { usePaymentHistory } from "@/hooks/usePayments";
import dayjs from "dayjs";
import { toast } from "sonner";
import { InvoiceStatus } from "@/types/invoice";
import Link from "next/link";

const { Title, Text } = Typography;

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [regeneratingPdf, setRegeneratingPdf] = useState(false);

  // Fetch invoice data
  const { data: invoice, isLoading, error } = useInvoice(invoiceId);

  // Fetch payment history for this invoice
  const { data: paymentHistory, isLoading: isLoadingPayments } =
    usePaymentHistory({
      invoiceId,
      limit: 100,
    });

  // Fetch invoice PDF
  const { data: pdfData } = useInvoicePdf(invoiceId);

  // Regenerate PDF mutation
  const { mutateAsync: regeneratePdf } = useRegenerateInvoicePdf();

  const handleDownloadPdf = () => {
    if (pdfData?.url) {
      window.open(pdfData.url, "_blank");
    }
  };

  const handleRegeneratePdf = async () => {
    try {
      setRegeneratingPdf(true);
      await regeneratePdf(invoiceId);
      toast.success("Invoice PDF regenerated successfully");
      // Refresh to get new PDF
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to regenerate invoice PDF"
      );
    } finally {
      setRegeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    if (pdfData?.url) {
      const printWindow = window.open(pdfData.url, "_blank");
      printWindow?.print();
    }
  };

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.PAID:
        return "success";
      case InvoiceStatus.PARTIALLY_PAID:
        return "warning";
      case InvoiceStatus.UNPAID:
        return "error";
      default:
        return "default";
    }
  };

  // Payment columns
  const paymentColumns = [
    {
      title: "Payment Code",
      dataIndex: "paymentCode",
      key: "paymentCode",
      render: (text: string, record: any) => (
        <Link href={`/payments/${record.id}`}>
          <Text strong style={{ color: "#1890ff", cursor: "pointer" }}>
            {text}
          </Text>
        </Link>
      ),
    },
    {
      title: "Amount Paid",
      dataIndex: "amount",
      key: "amount",
      align: "right" as const,
      render: (val: number, record: any) =>
        `${record.currency === "GHS" ? "GH₵" : "$"}${val?.toFixed(2)}`,
    },
    {
      title: "Payment Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      render: (method: string) => (
        <Tag color="blue">{method.replace(/_/g, " ")}</Tag>
      ),
    },
    {
      title: "Payment Source",
      dataIndex: "paymentSource",
      key: "paymentSource",
      render: (source?: string) =>
        source ? (
          <Tag color={source === "PAID_IN_GHANA" ? "green" : "orange"}>
            {source.replace(/_/g, " ")}
          </Tag>
        ) : (
          "-"
        ),
    },
    {
      title: "Reference",
      dataIndex: "reference",
      key: "reference",
      render: (ref?: string) => ref || "-",
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date: string) => dayjs(date).format("MMM DD, YYYY HH:mm"),
    },
    {
      title: "Processed By",
      key: "processedBy",
      render: (_: any, record: any) =>
        `${record.processedBy.firstName} ${record.processedBy.lastName}`,
    },
  ];

  if (isLoading) {
    return (
      <AuthGuard>
        <AppLayout>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "400px",
            }}
          >
            <Spin size="large" />
          </div>
        </AppLayout>
      </AuthGuard>
    );
  }

  if (error || !invoice) {
    return (
      <AuthGuard>
        <AppLayout>
          <Card>
            <Empty
              description={
                <Space direction="vertical">
                  <Text>Invoice not found</Text>
                  <Button
                    type="primary"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => router.push("/invoices")}
                  >
                    Back to Invoices
                  </Button>
                </Space>
              }
            />
          </Card>
        </AppLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <AppLayout>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {/* Header */}
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => router.push("/invoices")}
                >
                  Back
                </Button>
                <Title level={2} style={{ margin: 0 }}>
                  Invoice: {invoice.invoiceNumber}
                </Title>
                <Tag color={getStatusColor(invoice.status)} style={{ fontSize: "14px" }}>
                  {invoice.status}
                </Tag>
              </Space>
            </Col>
            <Col>
              <Space>
                <Button
                  icon={<PrinterOutlined />}
                  onClick={handlePrint}
                  disabled={!pdfData?.url}
                >
                  Print
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  type="primary"
                  onClick={handleDownloadPdf}
                  disabled={!pdfData?.url}
                >
                  Download PDF
                </Button>
                <Popconfirm
                  title="Regenerate Invoice PDF"
                  description="Are you sure you want to regenerate this invoice PDF?"
                  onConfirm={handleRegeneratePdf}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    icon={<ReloadOutlined />}
                    loading={regeneratingPdf}
                    danger
                  >
                    Regenerate PDF
                  </Button>
                </Popconfirm>
              </Space>
            </Col>
          </Row>

          {/* KPI Cards */}
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Total Amount"
                  value={invoice.totalAmount}
                  precision={2}
                  prefix={invoice.currency === "GHS" ? "GH₵" : "$"}
                  valueStyle={{ color: "#1890ff" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Paid Amount"
                  value={invoice.paidAmount}
                  precision={2}
                  prefix={invoice.currency === "GHS" ? "GH₵" : "$"}
                  valueStyle={{ color: "#52c41a" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="Balance"
                  value={invoice.balance}
                  precision={2}
                  prefix={invoice.currency === "GHS" ? "GH₵" : "$"}
                  valueStyle={{
                    color: invoice.balance > 0 ? "#ff4d4f" : "#52c41a",
                  }}
                />
              </Card>
            </Col>
          </Row>

          {/* Invoice Details */}
          <Card title={<Space><FileTextOutlined />Invoice Information</Space>}>
            <Descriptions bordered column={{ xs: 1, sm: 2, md: 2 }}>
              <Descriptions.Item
                label={<Space><CalendarOutlined />Invoice Number</Space>}
              >
                <Text strong>{invoice.invoiceNumber}</Text>
              </Descriptions.Item>
              <Descriptions.Item
                label={<Space><CalendarOutlined />Invoice Date</Space>}
              >
                {dayjs(invoice.createdAt).format("MMMM DD, YYYY")}
              </Descriptions.Item>
              <Descriptions.Item
                label={<Space><CalendarOutlined />Due Date</Space>}
              >
                {invoice.dueDate
                  ? dayjs(invoice.dueDate).format("MMMM DD, YYYY")
                  : "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Currency">
                <Tag color="blue">{invoice.currency}</Tag>
              </Descriptions.Item>
              {invoice.localAmount && invoice.currency === "USD" && (
                <Descriptions.Item label="Local Amount (GHS)">
                  GH₵{invoice.localAmount.toFixed(2)}
                </Descriptions.Item>
              )}
              <Descriptions.Item
                label={<Space><UserOutlined />Customer</Space>}
                span={2}
              >
                <Link href={`/customers/${invoice.customerId}`}>
                  <Space direction="vertical" size={0}>
                    <Text strong style={{ color: "#1890ff" }}>
                      {invoice.customer.firstName} {invoice.customer.lastName}
                    </Text>
                    <Text type="secondary">{invoice.customer.email}</Text>
                    <Text type="secondary">{invoice.customer.phoneNumber}</Text>
                  </Space>
                </Link>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Package & Packing List Information */}
          {invoice.packingList && (
            <Card title={<Space><InboxOutlined />Package & Shipping Details</Space>}>
              <Descriptions bordered column={{ xs: 1, sm: 2, md: 2 }}>
                <Descriptions.Item label="Packing List">
                  <Link href={`/packing-lists/${invoice.packingListId}`}>
                    <Text strong style={{ color: "#1890ff" }}>
                      {invoice.packingList.name}
                    </Text>
                  </Link>
                </Descriptions.Item>
                <Descriptions.Item label="Container">
                  {invoice.packingList.container ? (
                    <Link
                      href={`/containers/${invoice.packingList.container.id}`}
                    >
                      <Text strong style={{ color: "#1890ff" }}>
                        {invoice.packingList.container.containerNumber}
                      </Text>
                    </Link>
                  ) : (
                    "N/A"
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Shipping Mode">
                  <Tag
                    color={
                      invoice.packingList.container?.containerType === "BAG"
                        ? "blue"
                        : "cyan"
                    }
                  >
                    {invoice.packingList.container?.containerType === "BAG"
                      ? "AIR"
                      : "SEA"}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Warehouse">
                  {invoice.packingList.warehouseId || "N/A"}
                </Descriptions.Item>
              </Descriptions>

              {invoice.package && (
                <>
                  <Divider orientation="left">Package Details</Divider>
                  <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }}>
                    <Descriptions.Item label="Tracking Code">
                      <Link href={`/packages/${invoice.package.id}`}>
                        <Text strong style={{ color: "#1890ff" }}>
                          {invoice.package.trackingCode}
                        </Text>
                      </Link>
                    </Descriptions.Item>
                    <Descriptions.Item label="Description">
                      {invoice.package.description}
                    </Descriptions.Item>
                    <Descriptions.Item label="Quantity">
                      {invoice.package.quantity}
                    </Descriptions.Item>
                    <Descriptions.Item label="Weight">
                      {invoice.package.weight?.toFixed(2)} kg
                    </Descriptions.Item>
                    <Descriptions.Item label="CBM">
                      {invoice.package.cbm?.toFixed(4)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <Tag color="blue">{invoice.package.status}</Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </>
              )}
            </Card>
          )}

          {/* Payment History */}
          <Card
            title={
              <Space>
                <DollarOutlined />
                Payment History ({paymentHistory?.data?.length || 0})
              </Space>
            }
          >
            {isLoadingPayments ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <Spin />
              </div>
            ) : paymentHistory?.data && paymentHistory.data.length > 0 ? (
              <Table
                columns={paymentColumns}
                dataSource={paymentHistory.data}
                rowKey="id"
                pagination={false}
                scroll={{ x: 1000 }}
              />
            ) : (
              <Empty description="No payments recorded for this invoice" />
            )}
          </Card>

          {/* Additional Information */}
          <Card title="Timeline">
            <Space direction="vertical" style={{ width: "100%" }} size="small">
              <Row justify="space-between">
                <Col>
                  <Text type="secondary">Created</Text>
                </Col>
                <Col>
                  <Text>
                    {dayjs(invoice.createdAt).format("MMM DD, YYYY HH:mm")}
                  </Text>
                </Col>
              </Row>
              <Row justify="space-between">
                <Col>
                  <Text type="secondary">Last Updated</Text>
                </Col>
                <Col>
                  <Text>
                    {dayjs(invoice.updatedAt).format("MMM DD, YYYY HH:mm")}
                  </Text>
                </Col>
              </Row>
              {invoice.status === InvoiceStatus.PAID && (
                <Row justify="space-between">
                  <Col>
                    <Text type="secondary" strong style={{ color: "#52c41a" }}>
                      ✓ Fully Paid
                    </Text>
                  </Col>
                  <Col>
                    <Text strong style={{ color: "#52c41a" }}>
                      {dayjs(invoice.updatedAt).format("MMM DD, YYYY")}
                    </Text>
                  </Col>
                </Row>
              )}
            </Space>
          </Card>

          {/* Outstanding Balance Alert */}
          {invoice.balance > 0 && (
            <Alert
              message="Outstanding Balance"
              description={`This invoice has an outstanding balance of ${
                invoice.currency === "GHS" ? "GH₵" : "$"
              }${invoice.balance.toFixed(2)}. Please process payment to clear this invoice.`}
              type="warning"
              showIcon
              action={
                <Button size="small" type="primary">
                  <Link href="/payments">Make Payment</Link>
                </Button>
              }
            />
          )}
        </Space>
      </AppLayout>
    </AuthGuard>
  );
}
