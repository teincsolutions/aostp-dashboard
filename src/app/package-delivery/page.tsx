"use client";

import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  InputNumber,
  Upload,
  Button,
  Table,
  Typography,
  Card,
  Modal,
  Image,
  Select,
  Space,
  Row,
  Col,
} from "antd";
import { UploadOutlined, EyeOutlined } from "@ant-design/icons";
import { CustomerSearchSelect } from "@/components/CustomerSearchSelect";
import { packageDeliveryColumns } from "@/app/package-delivery/columns";
import {
  usePackageDelivery,
  useDeliveriesByInvoice,
} from "@/hooks/usePackageDelivery";
import { useCustomerInvoices } from "@/hooks/useInvoices";
import { uploadPackageFiles } from "@/services/packageService";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import type { RcFile, UploadFile } from "antd/es/upload/interface";
import { UploadProps } from "antd/lib";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import dayjs from "dayjs";
import { CreatePackageDeliveryPayload, PackageDelivery } from "@/types/package";
import { handleError } from "@/utils/forms/errorUtils";

const { Option } = Select;
const { Title } = Typography;

const rolesAllowed = ["SUPER_ADMIN", "OPERATIONS_CLERK"];

const validateMessages = {
  required: "${label} is required",
  types: {
    number: "${label} is not a valid number",
    string: "${label} is not a valid string",
  },
  number: {
    min: "${label} must be at least ${min}",
  },
};

const initialValues = {
  customerId: "",
  invoiceIds: [],
  receiverName: "",
  quantity: 1, // Default quantity
  notes: "",
  photos: [],
};

export default function PackageDeliveryPage() {
  const [form] = Form.useForm();
  const [photoList, setPhotoList] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [preview, setPreview] = useState<{ visible: boolean; url: string }>({
    visible: false,
    url: "",
  });
  const [tablePage, setTablePage] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [deliveryDetailsModalVisible, setDeliveryDetailsModalVisible] =
    useState(false);
  const [selectedDelivery, setSelectedDelivery] =
    useState<PackageDelivery | null>(null);

  // Get current user
  const { user } = useAuth();

  // Customer invoices - fetch when customer is selected
  const { data: customerInvoices, isLoading: invoicesLoading } =
    useCustomerInvoices(selectedCustomerId, { limit: 100 });

  // Deliveries by selected invoices (use first invoice for display)
  const {
    data: invoiceDeliveries = [],
    isLoading: deliveriesLoading,
    refetch: refetchDeliveries,
  } = useDeliveriesByInvoice(selectedInvoiceIds[0] || null);

  const { createDelivery, isCreating } = usePackageDelivery();

  // Upload validation
  const beforeUpload = (file: import("antd").UploadFile) => {
    if (!["image/jpeg", "image/png"].includes(file.type || "")) {
      toast.error("Only JPG/PNG files allowed");
      return Upload.LIST_IGNORE;
    }
    if ((file.size || 0) > 5 * 1024 * 1024) {
      toast.error("Max file size is 5MB");
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const handlePhotoUpload = async (
    options: Parameters<NonNullable<UploadProps["customRequest"]>>[0]
  ) => {
    try {
      if (typeof options.file === "string") {
        throw new Error("Invalid file type");
      }
      const file = options.file as RcFile;

      setUploadingPhotos(true);
      // Upload using the pictures endpoint
      const uploadedList = await uploadPackageFiles([file], "pictures");
      const uploaded = uploadedList[0];
      setPhotoList((prev) => [...prev, uploaded.url]);
      if (options.onSuccess) options.onSuccess("ok");
    } catch (err) {
      toast.error("Photo upload failed");
      if (options.onError) options.onError(new Error("Photo upload failed"));
    } finally {
      setUploadingPhotos(false);
    }
  };

  const onFinish = async (values: any) => {
    try {
      // Create payload with all required fields
      const payload: CreatePackageDeliveryPayload = {
        invoiceIds: values.invoiceIds || [],
        quantity: values.quantity, // Required field
        receiverName: values.receiverName || undefined,
        notes: values.notes || undefined,
        photos: photoList.length > 0 ? photoList : undefined,
      };

      const result = await createDelivery(payload);
      toast.success(`${result.count} package pickup(s) recorded successfully.`);

      setPhotoList([]);
      form.resetFields();
      refetchDeliveries();
    } catch (err) {
      handleError(err);
    }
  };

  const onFinishFailed = () => {
    toast.error("Please fix validation errors");
  };

  const handleViewDetails = (id: string) => {
    const delivery = invoiceDeliveries.find((d) => d.id === id);
    if (delivery) {
      setSelectedDelivery(delivery);
      setDeliveryDetailsModalVisible(true);
    }
  };

  // Delivery Details Modal
  const DeliveryDetailsModal = ({
    visible,
    onCancel,
    delivery,
  }: {
    visible: boolean;
    onCancel: () => void;
    delivery: PackageDelivery | null;
  }) => {
    if (!delivery) return null;

    return (
      <Modal
        open={visible}
        onCancel={onCancel}
        footer={[
          <Button key="close" onClick={onCancel}>
            Close
          </Button>,
        ]}
        title="Pickup Details"
        width={800}
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Card size="small" title="Pickup Information">
                <Space
                  direction="vertical"
                  size="small"
                  style={{ width: "100%" }}
                >
                  <div>
                    <Typography.Text type="secondary">
                      Pickup ID:
                    </Typography.Text>
                    <Typography.Text strong style={{ marginLeft: 8 }}>
                      {delivery.deliveryId}
                    </Typography.Text>
                  </div>
                  <div>
                    <Typography.Text type="secondary">
                      Release Date:
                    </Typography.Text>
                    <Typography.Text strong style={{ marginLeft: 8 }}>
                      {dayjs(delivery.releaseDate).format("YYYY-MM-DD HH:mm")}
                    </Typography.Text>
                  </div>
                  <div>
                    <Typography.Text type="secondary">
                      Receiver Name:
                    </Typography.Text>
                    <Typography.Text strong style={{ marginLeft: 8 }}>
                      {delivery.receiverName || "N/A"}
                    </Typography.Text>
                  </div>
                  <div>
                    <Typography.Text type="secondary">
                      Quantity:
                    </Typography.Text>
                    <Typography.Text strong style={{ marginLeft: 8 }}>
                      {delivery.quantity}
                    </Typography.Text>
                  </div>
                </Space>
              </Card>

              <Card size="small" title="Customer & Invoice">
                <Space
                  direction="vertical"
                  size="small"
                  style={{ width: "100%" }}
                >
                  <div>
                    <Typography.Text type="secondary">
                      Customer:
                    </Typography.Text>
                    <Typography.Text strong style={{ marginLeft: 8 }}>
                      {delivery.customer
                        ? `${delivery.customer.customerCode} - ${
                            delivery.customer.firstName
                          } ${delivery.customer.lastName || ""}`
                        : "N/A"}
                    </Typography.Text>
                  </div>
                  <div>
                    <Typography.Text type="secondary">Invoice:</Typography.Text>
                    <Typography.Text strong style={{ marginLeft: 8 }}>
                      {delivery.invoice?.invoiceNumber || "N/A"}
                    </Typography.Text>
                  </div>
                </Space>
              </Card>

              <Card size="small" title="Package Details">
                <Space
                  direction="vertical"
                  size="small"
                  style={{ width: "100%" }}
                >
                  <div>
                    <Typography.Text type="secondary">
                      Package Tracking:
                    </Typography.Text>
                    <Typography.Text strong style={{ marginLeft: 8 }}>
                      {delivery.package?.trackingCode || "N/A"}
                    </Typography.Text>
                  </div>
                  <div>
                    <Typography.Text type="secondary">
                      Description:
                    </Typography.Text>
                    <Typography.Text strong style={{ marginLeft: 8 }}>
                      {delivery.package?.description || "N/A"}
                    </Typography.Text>
                  </div>
                  <div>
                    <Typography.Text type="secondary">
                      Warehouse:
                    </Typography.Text>
                    <Typography.Text strong style={{ marginLeft: 8 }}>
                      {delivery.package?.warehouse?.name || "N/A"}
                    </Typography.Text>
                  </div>
                  <div>
                    <Typography.Text type="secondary">
                      Container:
                    </Typography.Text>
                    <Typography.Text strong style={{ marginLeft: 8 }}>
                      {delivery.invoice?.packingList?.container
                        ?.containerNumber || "N/A"}
                    </Typography.Text>
                  </div>
                </Space>
              </Card>

              {delivery.notes && (
                <Card size="small" title="Notes">
                  <Typography.Text>{delivery.notes}</Typography.Text>
                </Card>
              )}

              {delivery.photos && delivery.photos.length > 0 && (
                <Card size="small" title="Pickup Photos">
                  <Image.PreviewGroup>
                    <Space wrap size="small">
                      {delivery.photos.map((url, idx) => (
                        <Image
                          key={idx}
                          src={url}
                          alt={`Delivery photo ${idx + 1}`}
                          width={150}
                          height={120}
                          style={{ objectFit: "cover" }}
                        />
                      ))}
                    </Space>
                  </Image.PreviewGroup>
                </Card>
              )}
            </Space>
          </div>
        </Space>
      </Modal>
    );
  };

  return (
    <AuthGuard requiredRoles={rolesAllowed}>
      <AppLayout>
        <Space
          direction="vertical"
          size="large"
          style={{ width: "100%", padding: 24 }}
        >
          {/* Top Heading */}
          <Space direction="vertical" size="small">
            <Title level={3} style={{ margin: 0 }}>
              Package Pickup
            </Title>
            <Typography.Text type="secondary">
              Record package pickups by customers
            </Typography.Text>
          </Space>
          {/* Main Form */}
          <Form
            form={form}
            layout="vertical"
            initialValues={initialValues}
            validateMessages={validateMessages}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            className="max-w-5xl"
          >
            <Card title="Pickup Details">
              <Row gutter={[16, 16]}>
                <Col xs={24} lg={12}>
                  <Form.Item
                    label="Customer"
                    name="customerId"
                    rules={[{ required: true }]}
                  >
                    <CustomerSearchSelect
                      value={selectedCustomerId}
                      onChange={(value) => {
                        setSelectedCustomerId(value || "");
                        form.setFieldsValue({
                          customerId: value,
                          invoiceIds: [],
                        });
                        setSelectedInvoiceIds([]);
                      }}
                      placeholder="Search customer by name, code, or phone"
                    />
                  </Form.Item>

                  <Form.Item
                    label="Invoices (Select one or more)"
                    name="invoiceIds"
                    rules={[
                      {
                        required: true,
                        message: "Please select at least one invoice",
                      },
                    ]}
                  >
                    <Select
                      mode="multiple"
                      style={{ width: "100%" }}
                      placeholder="Select invoices"
                      loading={invoicesLoading}
                      disabled={!selectedCustomerId}
                      onChange={(values) => setSelectedInvoiceIds(values)}
                      showSearch
                      filterOption={(input, option) =>
                        String(option?.children || "")
                          ?.toLowerCase()
                          .indexOf(input.toLowerCase()) >= 0
                      }
                    >
                      {customerInvoices?.data?.map((invoice: any) => (
                        <Option key={invoice.id} value={invoice.id}>
                          {invoice.invoiceNumber} -{" "}
                          {invoice.status.replace(/_/g, " ")} (
                          {invoice.packingList?.container?.containerNumber ||
                            "N/A"}
                          )
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    label="Receiver Name (Optional)"
                    name="receiverName"
                  >
                    <Input placeholder="Name of person who received the package" />
                  </Form.Item>

                  <Form.Item
                    label="Quantity"
                    name="quantity"
                    rules={[
                      { required: true, message: "Quantity is required" },
                      {
                        type: "number",
                        min: 1,
                        message: "Quantity must be at least 1",
                      },
                    ]}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      min={1}
                      placeholder="Enter quantity"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} lg={12}>
                  <Form.Item label="Pickup Notes (Optional)" name="notes">
                    <Input.TextArea
                      rows={4}
                      placeholder="Additional notes about the pickup"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>

                  <Form.Item label="Pickup Photos (Optional)">
                    <Upload
                      multiple
                      listType="picture-card"
                      customRequest={handlePhotoUpload}
                      beforeUpload={beforeUpload}
                      showUploadList={false}
                      style={{ marginLeft: 30 }}
                    >
                      <Button
                        icon={<UploadOutlined />}
                        loading={uploadingPhotos}
                      >
                        Upload Photos
                      </Button>
                    </Upload>
                    {photoList.length > 0 && (
                      <Space
                        direction="vertical"
                        style={{ width: "100%", marginTop: 16 }}
                      >
                        <Image.PreviewGroup>
                          <Space wrap>
                            {photoList.map((url, idx) => (
                              <Space key={idx} direction="vertical" size={0}>
                                <Image
                                  src={url}
                                  alt={`Photo ${idx + 1}`}
                                  width={100}
                                  height={80}
                                  style={{ objectFit: "cover" }}
                                />
                                <Button
                                  type="link"
                                  danger
                                  size="small"
                                  block
                                  onClick={() =>
                                    setPhotoList((prev) =>
                                      prev.filter((_, i) => i !== idx)
                                    )
                                  }
                                >
                                  Remove
                                </Button>
                              </Space>
                            ))}
                          </Space>
                        </Image.PreviewGroup>
                      </Space>
                    )}
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Form Actions */}
            <Space
              style={{
                width: "100%",
                justifyContent: "flex-end",
                marginTop: 16,
              }}
            >
              <Button
                onClick={() => {
                  form.resetFields();
                  setPhotoList([]);
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                loading={isCreating || uploadingPhotos}
                onClick={() => form.submit()}
              >
                Record Pickup
              </Button>
            </Space>
          </Form>
          {/* Recent Pickups Table */}
          <Card
            title={
              selectedInvoiceIds.length > 0
                ? "Pickups for Selected Invoices"
                : "Recent Pickups"
            }
          >
            <Table
              columns={packageDeliveryColumns}
              dataSource={invoiceDeliveries.map((item) => ({
                ...item,
                onViewDetails: handleViewDetails,
              }))}
              rowKey="id"
              loading={deliveriesLoading}
              pagination={{
                current: tablePage,
                pageSize: 10,
                total: invoiceDeliveries.length,
                showSizeChanger: true,
                onChange: (page) => setTablePage(page),
              }}
              scroll={{ x: 1800 }}
              size="middle"
              locale={{
                emptyText: (
                  <Space
                    direction="vertical"
                    align="center"
                    style={{ padding: "32px 0", width: "100%" }}
                  >
                    <Typography.Text type="secondary">
                      {selectedInvoiceIds.length > 0
                        ? "No pickups found for these invoices"
                        : "Select a customer and invoices to view pickups"}
                    </Typography.Text>
                  </Space>
                ),
              }}
            />
          </Card>
          <DeliveryDetailsModal
            visible={deliveryDetailsModalVisible}
            onCancel={() => {
              setDeliveryDetailsModalVisible(false);
              setSelectedDelivery(null);
            }}
            delivery={selectedDelivery}
          />
        </Space>
      </AppLayout>
    </AuthGuard>
  );
}
