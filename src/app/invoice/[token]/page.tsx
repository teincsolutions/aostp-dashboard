// src/app/invoice/[token]/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  Descriptions,
  Table,
  Typography,
  Button,
  Empty,
  Spin,
  Result,
  Row,
  Col,
  Statistic,
  Tag,
  Divider,
} from "antd";
import {
  DownloadOutlined,
  PrinterOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { publicApiService } from "@/services/api";
import dayjs from "dayjs";
import { toast } from "sonner";

const { Title, Text } = Typography;

// Types based on PUBLIC_INVOICE_API.md
interface PublicCustomer {
  customerCode: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
}

interface PublicPackingList {
  name: string;
  eta: string;
}

interface PublicPackage {
  trackingCode: string;
  description: string;
  weight: number;
  cbm: number;
  shippingMode: "AIR" | "SEA";
  quantity: number;
}

interface PublicPayment {
  id: string;
  paymentCode: string;
  amount: number;
  currency: string;
  localAmount: number;
  paymentMethod: string;
  processedAt: string;
}

type InvoiceStatus = "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED";

interface PublicInvoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  currency: string;
  exchangeRate: number;
  localAmount: number;
  status: InvoiceStatus;
  dueDate: string;
  paidAmount: number;
  balance: number;
  notes: string;
  createdAt: string;
  customer: PublicCustomer;
  packingList: PublicPackingList | null;
  package: PublicPackage | null;
  payments: PublicPayment[];
}

export default function PublicInvoiceView() {
  const params = useParams();
  const token = params.token as string;

  const [invoice, setInvoice] = useState<PublicInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await publicApiService.get<PublicInvoice>(
          `/public/invoices/${token}`
        );
        setInvoice(response.data);
      } catch (err: any) {
        console.error("Failed to load invoice:", err);
        const errorMessage =
          err.response?.status === 404
            ? "Invoice not found or the link has expired"
            : err.response?.data?.message || "Failed to load invoice";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchInvoice();
    }
  }, [token]);

  const handlePrint = () => {
    window.print();
  };

  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPDF = async () => {
    setDownloadingPdf(true);
    try {
      // API returns a signed URL for the PDF
      const response = await publicApiService.get<{ url: string }>(
        `/public/invoices/${token}/pdf`
      );

      if (response.data?.url) {
        // Open the signed URL in a new tab to download/view the PDF
        window.open(response.data.url, "_blank");
        toast.success("PDF opened in new tab");
      } else {
        throw new Error("No PDF URL returned");
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to download PDF";
      toast.error(errorMessage);
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spin size="large" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Result
          status="error"
          title="Invoice Not Found"
          subTitle={error || "The invoice link is invalid or has expired."}
          extra={
            <Button type="primary" onClick={() => (window.location.href = "/")}>
              Go Home
            </Button>
          }
        />
      </div>
    );
  }

  const getStatusColor = (status: InvoiceStatus) => {
    const colors: Record<InvoiceStatus, string> = {
      UNPAID: "red",
      PARTIAL: "orange",
      PAID: "green",
      OVERDUE: "volcano",
      CANCELLED: "default",
    };
    return colors[status] || "default";
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const packageColumns = [
    {
      title: "Package Details",
      dataIndex: "description",
      key: "description",
      render: (_: string, record: PublicPackage) => (
        <div>
          <div className="font-medium">{record.description || "Package"}</div>
          <Text type="secondary" className="text-sm">
            Tracking: {record.trackingCode}
          </Text>
        </div>
      ),
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      align: "center" as const,
    },
    {
      title: "Weight (kg)",
      dataIndex: "weight",
      key: "weight",
      align: "right" as const,
      render: (weight: number) => weight?.toFixed(2),
    },
    {
      title: "CBM",
      dataIndex: "cbm",
      key: "cbm",
      align: "right" as const,
      render: (cbm: number) => cbm?.toFixed(3),
    },
    {
      title: "Shipping Mode",
      dataIndex: "shippingMode",
      key: "shippingMode",
      render: (mode: "AIR" | "SEA") => (
        <Tag color={mode === "AIR" ? "blue" : "cyan"}>{mode}</Tag>
      ),
    },
  ];

  const paymentColumns = [
    {
      title: "Payment Code",
      dataIndex: "paymentCode",
      key: "paymentCode",
      render: (code: string) => <Text strong>{code}</Text>,
    },
    {
      title: "Amount (USD)",
      dataIndex: "amount",
      key: "amount",
      align: "right" as const,
      render: (amount: number, record: PublicPayment) =>
        formatCurrency(amount, record.currency),
    },
    {
      title: "Local Amount",
      dataIndex: "localAmount",
      key: "localAmount",
      align: "right" as const,
      render: (amount: number) =>
        amount ? `GHS ${amount.toLocaleString()}` : "-",
    },
    {
      title: "Payment Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      render: (method: string) => (
        <Tag color="blue">{method?.replace(/_/g, " ")}</Tag>
      ),
    },
    {
      title: "Date",
      dataIndex: "processedAt",
      key: "processedAt",
      render: (date: string) =>
        date ? dayjs(date).format("MMM DD, YYYY HH:mm") : "-",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-t-4 border-t-blue-500">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
            <div className="flex items-center gap-3">
              <FileTextOutlined className="text-3xl text-blue-500" />
              <div>
                <Title level={2} className="!mb-1">
                  Invoice {invoice.invoiceNumber}
                </Title>
                <Text type="secondary">
                  Issued on {dayjs(invoice.createdAt).format("MMMM DD, YYYY")}
                </Text>
              </div>
            </div>
            <div className="flex gap-2 print:hidden">
              <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                Print
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleDownloadPDF}
                loading={downloadingPdf}
              >
                Download PDF
              </Button>
            </div>
          </div>

          {/* Invoice Status & Due Date */}
          <div className="flex flex-wrap items-center gap-4">
            <Tag
              color={getStatusColor(invoice.status)}
              className="text-base px-4 py-1"
            >
              {invoice.status?.replace(/_/g, " ")}
            </Tag>
            <Text>
              Due Date:{" "}
              <Text strong>{dayjs(invoice.dueDate).format("MMMM DD, YYYY")}</Text>
            </Text>
          </div>
        </Card>

        {/* Customer & Invoice Details */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card title="Customer Information" className="h-full">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Customer Code">
                  <Text code>{invoice.customer.customerCode}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Name">
                  {invoice.customer.firstName} {invoice.customer.lastName || ""}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {invoice.customer.email || "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Phone">
                  {invoice.customer.phoneNumber || "-"}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Invoice Details" className="h-full">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Invoice Number">
                  <Text strong>{invoice.invoiceNumber}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Invoice Date">
                  {dayjs(invoice.createdAt).format("MMMM DD, YYYY")}
                </Descriptions.Item>
                <Descriptions.Item label="Due Date">
                  <Text
                    type={
                      dayjs(invoice.dueDate).isBefore(dayjs()) &&
                      invoice.status !== "PAID"
                        ? "danger"
                        : undefined
                    }
                  >
                    {dayjs(invoice.dueDate).format("MMMM DD, YYYY")}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Currency">
                  {invoice.currency}
                </Descriptions.Item>
                {invoice.exchangeRate && (
                  <Descriptions.Item label="Exchange Rate">
                    1 USD = {invoice.exchangeRate} GHS
                  </Descriptions.Item>
                )}
                {invoice.packingList && (
                  <Descriptions.Item label="Packing List">
                    {invoice.packingList.name}
                    {invoice.packingList.eta && (
                      <Text type="secondary" className="ml-2">
                        (ETA: {dayjs(invoice.packingList.eta).format("MMM DD, YYYY")})
                      </Text>
                    )}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          </Col>
        </Row>

        {/* Financial Summary */}
        <Card title="Amount Summary">
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Statistic
                title="Total Amount (USD)"
                value={invoice.totalAmount}
                prefix="$"
                precision={2}
              />
            </Col>
            {invoice.localAmount > 0 && (
              <Col xs={12} sm={6}>
                <Statistic
                  title="Local Amount (GHS)"
                  value={invoice.localAmount}
                  prefix="GHS "
                  precision={2}
                />
              </Col>
            )}
            <Col xs={12} sm={6}>
              <Statistic
                title="Amount Paid"
                value={invoice.paidAmount || 0}
                prefix="$"
                precision={2}
                valueStyle={{ color: "#3f8600" }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Balance Due"
                value={invoice.balance}
                prefix="$"
                precision={2}
                valueStyle={{
                  color: invoice.balance > 0 ? "#cf1322" : "#3f8600",
                }}
              />
            </Col>
          </Row>

          {invoice.balance > 0 && (
            <>
              <Divider />
              <div className="text-center">
                <Text type="secondary">
                  Please make payment to complete this invoice
                </Text>
              </div>
            </>
          )}
        </Card>

        {/* Package Details */}
        <Card title="Package Details">
          {invoice.package ? (
            <Table
              columns={packageColumns}
              dataSource={[invoice.package]}
              rowKey="trackingCode"
              pagination={false}
              size="small"
              scroll={{ x: 600 }}
            />
          ) : (
            <Empty description="No package linked to this invoice" />
          )}
        </Card>

        {/* Payment History */}
        {invoice.payments && invoice.payments.length > 0 && (
          <Card title="Payment History">
            <Table
              columns={paymentColumns}
              dataSource={invoice.payments}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ x: 600 }}
            />
          </Card>
        )}

        {/* Footer */}
        <Card className="bg-gray-50 print:bg-white">
          <div className="text-center space-y-2">
            <Text type="secondary">
              This invoice was generated by AOSTP Logistics Management System
            </Text>
            <br />
            <Text type="secondary">
              For questions or support, please contact our customer service team.
            </Text>
            <div className="mt-4 print:hidden">
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleDownloadPDF}
                loading={downloadingPdf}
              >
                Download Invoice PDF
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
