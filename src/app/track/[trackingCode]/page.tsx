// src/app/track/[trackingCode]/page.tsx

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
  Image,
  Divider,
  Badge,
} from "antd";
import { publicApiService } from "@/services/api";
import { Package } from "@/types/package";
import dayjs from "dayjs";
import { toast } from "sonner";
import { ArrowLeftOutlined, PrinterOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

const { Title, Text, Paragraph } = Typography;

// Status color mappings
const statusColors = {
  IN_WAREHOUSE: "orange",
  ASSIGNED: "blue",
  SHIPPED: "blue",
  ARRIVED: "purple",
  RELEASED: "green",
} as const;

const containerStatusColors = {
  PLANNED: "orange",
  LOADED: "blue",
  SHIPPED: "blue",
  ARRIVED: "purple",
  CLOSED: "green",
} as const;

const packingListStatusColors = {
  DRAFT: "grey",
  FINALIZED: "blue",
  POSTED: "green",
} as const;

export default function TrackingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const trackingCode = params.trackingCode as string;

  const [packageData, setPackageData] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPackage = async () => {
      try {
        const response = await publicApiService.get<Package>(`/packages/tracking/${trackingCode}`);
        setPackageData(response.data);
      } catch (err: any) {
        console.error("Failed to load package:", err);
        setError(
          err.response?.data?.message || "Failed to load package details"
        );
        toast.error(
          err.response?.data?.message || "Unable to load package details"
        );
      } finally {
        setLoading(false);
      }
    };

    if (trackingCode) {
      fetchPackage();
    }
  }, [trackingCode]);

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    router.push("/track");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spin size="large" />
      </div>
    );
  }

  if (error || !packageData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Result
          status="error"
          title="Package Not Found"
          subTitle={
            error ||
            "The tracking code is invalid or package information is not available."
          }
          extra={
            <div className="space-x-2">
              <Button onClick={handleBack}>Try Another Code</Button>
              <Button type="primary" onClick={handlePrint}>
                Print Page
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  // Package items table columns
  const itemsColumns = [
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (description: string) => description || "No description",
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Weight (kg)",
      dataIndex: "weight",
      key: "weight",
    },
    {
      title: "CBM",
      dataIndex: "cbm",
      key: "cbm",
    },
    {
      title: "Shipping Mode",
      dataIndex: "shippingMode",
      key: "shippingMode",
      render: (mode: string) => (
        <Tag color={mode === "AIR" ? "blue" : "green"}>{mode}</Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag
          color={statusColors[status as keyof typeof statusColors] || "default"}
        >
          {status?.replace("_", " ")}
        </Tag>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 print:bg-white print:px-2">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-t-4 border-t-blue-500 print:shadow-none print:border-none">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={handleBack}
                  className="print:hidden"
                >
                  Back
                </Button>
                <Title level={2} className="!mb-0">
                  Package Tracking
                </Title>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <Paragraph copyable={{ text: trackingCode }} className="!mb-0">
                  <Text strong>Tracking Code: {trackingCode}</Text>
                </Paragraph>
                <Badge
                  color={statusColors[packageData.status] || "default"}
                  text={packageData.status?.replace("_", " ")}
                  className="text-lg"
                />
              </div>
            </div>
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              onClick={handlePrint}
              className="print:hidden"
            >
              Print
            </Button>
          </div>
        </Card>

        {/* Package Overview */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card title="Package Details">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Description">
                  {packageData.description || "No description"}
                </Descriptions.Item>
                <Descriptions.Item label="Weight (kg)">
                  {packageData.weight?.toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="CBM">
                  {packageData.cbm?.toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Quantity">
                  {packageData.quantity}
                </Descriptions.Item>
                <Descriptions.Item label="Shipping Mode">
                  <Tag
                    color={
                      packageData.shippingMode === "AIR" ? "blue" : "green"
                    }
                  >
                    {packageData.shippingMode}
                  </Tag>
                </Descriptions.Item>
                {packageData.airShippingType && (
                  <Descriptions.Item label="Air Shipping Type">
                    <Tag>{packageData.airShippingType.replace("_", " ")}</Tag>
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Received Date">
                  {dayjs(packageData.receivedDate).format("MMMM DD, YYYY")}
                </Descriptions.Item>
                <Descriptions.Item label="Days in Warehouse">
                  <Text
                    strong
                    className={
                      packageData.daysInWarehouse > 30 ? "text-orange-500" : ""
                    }
                  >
                    {packageData.daysInWarehouse} days
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Notes">
                  {packageData.notes || "No notes"}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card title="Customer Information">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Name">
                  {packageData.customer?.firstName}{" "}
                  {packageData.customer?.lastName}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {packageData.customer?.email}
                </Descriptions.Item>
                <Descriptions.Item label="Phone">
                  {packageData.customer?.phoneNumber ||
                    packageData.customer?.alternatePhone}
                </Descriptions.Item>
                <Descriptions.Item label="Address">
                  {packageData.customer?.address}, {packageData.customer?.city},{" "}
                  {packageData.customer?.country}
                </Descriptions.Item>
                <Descriptions.Item label="Customer Code">
                  {packageData.customer?.customerCode}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>

        {/* Warehouse & Logistics */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={8}>
            <Card title="Warehouse Information">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Warehouse">
                  {packageData.warehouse?.name}
                </Descriptions.Item>
                <Descriptions.Item label="Location">
                  {packageData.warehouse?.location}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="Packing List Status">
              {packageData.packingList ? (
                <div>
                  <div className="mb-3">
                    <Text strong>Name: </Text>
                    {packageData.packingList.name}
                  </div>
                  <div className="mb-3">
                    <Badge
                      color={
                        packingListStatusColors[
                          packageData.packingList
                            .status as keyof typeof packingListStatusColors
                        ] || "default"
                      }
                      text={packageData.packingList.status}
                    />
                  </div>
                  <div className="mb-3">
                    <Text strong>Loading Date: </Text>
                    {dayjs(packageData.packingList.loadingDate).format(
                      "MM/DD/YYYY"
                    )}
                  </div>
                  <div>
                    <Text strong>ETA: </Text>
                    {dayjs(packageData.packingList.eta).format("MM/DD/YYYY")}
                  </div>
                </div>
              ) : (
                <Text type="secondary">Not assigned to a packing list</Text>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="Container Status">
              {packageData.packingList?.container ? (
                <div>
                  <div className="mb-3">
                    <Text strong>Container Number: </Text>
                    {packageData.packingList.container.containerNumber}
                  </div>
                  <div className="mb-3">
                    <Badge
                      color={
                        containerStatusColors[
                          packageData.packingList.container
                            .status as keyof typeof containerStatusColors
                        ] || "default"
                      }
                      text={packageData.packingList.container.status.replace(
                        "_",
                        " "
                      )}
                    />
                  </div>
                  <div className="mb-3">
                    <Text strong>Vessel/Flight: </Text>
                    {packageData.packingList.container.vesselFlight || "N/A"}
                  </div>
                  <div>
                    <Text strong>ETA: </Text>
                    {dayjs(packageData.packingList.container.eta).format(
                      "MM/DD/YYYY"
                    )}
                  </div>
                </div>
              ) : (
                <Text type="secondary">Not assigned to a container</Text>
              )}
            </Card>
          </Col>
        </Row>

        {/* Financial Information */}
        <Card title="Financial Status">
          <Row gutter={16}>
            <Col xs={12} sm={6}>
              <Statistic
                title="Payment Status"
                value={
                  packageData.paymentStatus?.replace("_", " ") || "PENDING"
                }
                valueStyle={{
                  color:
                    packageData.paymentStatus === "PAID"
                      ? "#3f8600"
                      : "#cf1322",
                }}
              />
            </Col>
          </Row>
        </Card>

        {/* Package Items */}
        {packageData.items && packageData.items.length > 0 && (
          <Card title="Package Items">
            <Table
              columns={itemsColumns}
              dataSource={packageData.items}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ x: true }}
              locale={{ emptyText: <Empty description="No items found" /> }}
            />
          </Card>
        )}

        {/* Package Photos */}
        {packageData.photos && packageData.photos.length > 0 && (
          <Card title="Package Photos">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {packageData.photos.map((photo) => (
                <div key={photo.id} className="text-center">
                  <Image
                    src={photo.url}
                    alt="Package photo"
                    width={200}
                    height={150}
                    className="rounded-lg shadow-sm"
                    placeholder={
                      <div className="bg-gray-200 rounded-lg animate-pulse w-full h-32" />
                    }
                  />
                  <div className="mt-2 text-xs text-gray-500">
                    {dayjs(photo.uploadedAt).format("MM/DD/YYYY")}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Footer */}
        <Card className="bg-gray-50 print:shadow-none print:border-none">
          <div className="text-center">
            <Text type="secondary">
              Package data last updated:{" "}
              {dayjs(packageData.updatedAt || packageData.createdAt).format(
                "MMMM DD, YYYY HH:mm"
              )}
            </Text>
            <br />
            <Text type="secondary">
              For questions about your package, please contact AOSTP customer
              service.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
