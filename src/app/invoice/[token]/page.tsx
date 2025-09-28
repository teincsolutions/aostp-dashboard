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
  notification,
  Row,
  Col,
  Statistic,
  Tag,
  Divider,
} from "antd";
import { apiService } from "@/services/api";
import { Invoice, Payment } from "@/types/invoice";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface PublicInvoice extends Invoice {
  signedToken: string;
  accessExpiresAt: string;
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
        const response = await apiService.get<PublicInvoice>(`/public/invoices/${token}`);
        setInvoice(response.data);
      } catch (err: any) {
        console.error("Failed to load invoice:", err);
        setError(err.response?.data?.message || "Failed to load invoice");
        notification.error({
          message: "Error",
          description: err.response?.data?.message || "Unable to load invoice",
        });
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

  const handleDownloadPDF = async () => {
    try {
      const response = await apiService.get(`/public/invoices/${token}/pdf`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice-${invoice?.invoiceNumber}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);

      notification.success({ message: "PDF downloaded successfully" });
    } catch (err) {
      notification.error({ message: "Failed to download PDF" });
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

  const invoiceColumns = [
    {
      title: "Package Details",
      dataIndex: "description",
      key: "description",
      render: (_: string, record: any) => (
        <div>
          <div className="font-medium">{record.description || "Package"}</div>
          <Text type="secondary" className="text-sm">
            Tracking: {record.trackingCode}
          </Text>
        </div>
      ),
    },
    {
      title: "Weight (kg)",
      dataIndex: "weight",
      key: "weight",
      align: "right" as const,
    },
    {
      title: "CBM",
      dataIndex: "cbm",
      key: "cbm",
      align: "right" as const,
    },
    {
      title: "Shipping Mode",
      dataIndex: "shippingMode",
      key: "shippingMode",
      render: (mode: string) => <Tag color={mode === "AIR" ? "blue" : "green"}>{mode}</Tag>,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      align: "right" as const,
      render: (amount: number) => `$${amount?.toLocaleString()}`,
    },
  ];

  const paymentColumns = [
    {
      title: "Payment Code",
      dataIndex: "paymentCode",
      key: "paymentCode",
    },
    {
      title: "Amount Paid",
      dataIndex: "amount",
      key: "amount",
      align: "right" as const,
      render: (amount: number) => `$${amount?.toLocaleString()}`,
    },
    {
      title: "Payment Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      render: (method: string) => method?.replace("_", " "),
    },
    {
      title: "Payment Date",
      dataIndex: "processedAt",
      key: "processedAt",
      render: (date: string) => dayjs(date).format("YYYY-MM-DD HH:mm"),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-t-4 border-t-blue-500">
          <div className="flex justify-between items-start mb-4">
            <div>
              <Title level={2} className="!mb-2">
                Invoice #{invoice.invoiceNumber}
              </Title>
              <Text type="secondary">
                Invoice Date: {dayjs(invoice.createdAt).format("MMMM DD, YYYY")}
              </Text>
            </div>
            <div className="text-right">
              <Button type="primary" onClick={handlePrint} className="mb-2">
                Print
              </Button>
              <br />
              <Button onClick={handleDownloadPDF}>Download PDF</Button>
            </div>
          </div>

          {/* Invoice Status */}
          <Tag
            color={
              invoice.status === "PAID"
                ? "green"
                : invoice.status === "PARTIALLY_PAID"
                ? "orange"
                : "red"
            }
            className="mb-4 text-lg px-3 py-1"
          >
            {invoice.status?.replace("_", " ")}
          </Tag>
        </Card>

        {/* Customer & Invoice Details */}
        <Row gutter={24}>
          <Col xs={24} lg={12}>
            <Card title="Ship To">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Customer">
                  {invoice.customer.firstName} {invoice.customer.lastName}
                </Descriptions.Item>
                <Descriptions.Item label="Email">{invoice.customer.email}</Descriptions.Item>
                <Descriptions.Item label="Phone">{invoice.customer.phoneNumber}</Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Invoice Details">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Invoice Number">
                  <strong>{invoice.invoiceNumber}</strong>
                </Descriptions.Item>
                <Descriptions.Item label="Invoice Date">
                  {dayjs(invoice.createdAt).format("MMMM DD, YYYY")}
                </Descriptions.Item>
                <Descriptions.Item label="Due Date">
                  {dayjs(invoice.dueDate).format("MMMM DD, YYYY")}
                </Descriptions.Item>
                <Descriptions.Item label="Currency">{invoice.currency}</Descriptions.Item>
                <Descriptions.Item label="Exchange Rate">{invoice.exchangeRate}</Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>

        {/* Financial Summary */}
        <Card title="Financial Summary">
          <Row gutter={16}>
            <Col xs={12} sm={6}>
              <Statistic
                title="Total Amount"
                value={invoice.totalAmount}
                prefix="$"
                precision={2}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Total Paid"
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
                valueStyle={{ color: invoice.balance > 0 ? "#cf1322" : "#3f8600" }}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic
                title="Total Packages"
                value={invoice.packages?.length || 0}
                prefix="#"
              />
            </Col>
          </Row>
        </Card>

        {/* Package Details */}
        <Card title="Package Details">
          <Table
            columns={invoiceColumns}
            dataSource={invoice.packages || []}
            rowKey="id"
            pagination={false}
            size="small"
            locale={{ emptyText: <Empty description="No packages found" /> }}
          />
        </Card>

        {/* Payment History - Comment out until backend provides payment data */}
        {/*
        {invoice.payments && invoice.payments.length > 0 && (
          <Card title="Payment History">
            <Table
              columns={paymentColumns}
              dataSource={invoice.payments}
              rowKey="id"
              pagination={false}
              size="small"
              locale={{ emptyText: <Empty description="No payments found" /> }}
            />
          </Card>
        )}
        */}

        {/* Footer */}
        <Card className="bg-gray-50">
          <div className="text-center">
            <Text type="secondary">
              This invoice was generated on behalf of AOSTP Logistics Management System
            </Text>
            <br />
            <Text type="secondary">
              If you have any questions, please contact our support team.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
