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
} from "antd";
import { UploadOutlined, QrcodeOutlined, EyeOutlined } from "@ant-design/icons";
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
import { Html5QrcodeScanner } from "html5-qrcode";
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
  invoiceId: "",
  packageItemIntakeTrackingCode: "",
  receiverName: "",
  quantity: undefined,
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
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>("");
  const [deliveryDetailsModalVisible, setDeliveryDetailsModalVisible] =
    useState(false);
  const [selectedDelivery, setSelectedDelivery] =
    useState<PackageDelivery | null>(null);

  // Scanner modal state
  const [scannerModalVisible, setScannerModalVisible] = useState(false);

  // Get current user
  const { user } = useAuth();

  // Customer invoices - fetch when customer is selected
  const { data: customerInvoices, isLoading: invoicesLoading } =
    useCustomerInvoices(selectedCustomerId, { limit: 100 });

  // Deliveries by selected invoice
  const {
    data: invoiceDeliveries = [],
    isLoading: deliveriesLoading,
    refetch: refetchDeliveries,
  } = useDeliveriesByInvoice(selectedInvoiceId);

  // Handler for QR/Barcode scan
  const handleScanTrackingCode = () => {
    setScannerModalVisible(true);
  };

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
      const uploadedList = await uploadPackageFiles(
        [file],
        "pictures",
        "packages"
      );
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
        invoiceId: values.invoiceId,
        packageItemIntakeTrackingCode:
          values.packageItemIntakeTrackingCode.trim(),
        receiverName: values.receiverName || undefined,
        quantity: values.quantity || undefined,
        notes: values.notes || undefined,
        photos: photoList.length > 0 ? photoList : undefined,
      };

      await createDelivery(payload);
      toast.success("Package delivery recorded successfully.");

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

  // Scanner modal component
  const ScannerModal = ({
    visible,
    onCancel,
    onScan,
  }: {
    visible: boolean;
    onCancel: () => void;
    onScan: (decodedText: string) => void;
  }) => {
    useEffect(() => {
      let scanner: Html5QrcodeScanner | null = null;
      if (visible) {
        scanner = new Html5QrcodeScanner(
          "reader",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          /* verbose= */ false
        );
        scanner.render(
          (decodedText) => {
            onScan(decodedText);
            scanner?.clear();
          },
          (error) => {
            // console.warn(error);
          }
        );
      }

      return () => {
        if (scanner) {
          scanner.clear().catch((error) => {
            console.error("Failed to clear html5-qrcode scanner. ", error);
          });
        }
      };
    }, [visible, onScan]);

    return (
      <Modal
        open={visible}
        onCancel={onCancel}
        footer={null}
        title="Scan QR/Barcode"
        destroyOnClose
        width={400}
      >
        <div id="reader" style={{ width: "100%" }}></div>
      </Modal>
    );
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
        title="Delivery Details"
        width={800}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Delivery ID</div>
              <div className="font-semibold">{delivery.deliveryId}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Release Date</div>
              <div className="font-semibold">
                {dayjs(delivery.releaseDate).format("YYYY-MM-DD HH:mm")}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Customer</div>
              <div className="font-semibold">
                {delivery.customer
                  ? `${delivery.customer.customerCode} - ${delivery.customer.firstName} ${delivery.customer.lastName}`
                  : "N/A"}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Invoice</div>
              <div className="font-semibold">
                {delivery.invoice?.invoiceNumber || "N/A"}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Package Item</div>
              <div className="font-semibold">
                {delivery.packageItem?.intakeTrackingCode || "N/A"}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Package Tracking</div>
              <div className="font-semibold">
                {delivery.packageItem?.package?.trackingCode || "N/A"}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Receiver Name</div>
              <div className="font-semibold">
                {delivery.receiverName || "N/A"}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Quantity</div>
              <div className="font-semibold">{delivery.quantity}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Warehouse</div>
              <div className="font-semibold">
                {delivery.packageItem?.warehouse?.name || "N/A"}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Container</div>
              <div className="font-semibold">
                {delivery.invoice?.packingList?.container?.containerNumber ||
                  "N/A"}
              </div>
            </div>
          </div>
          {delivery.notes && (
            <div>
              <div className="text-sm text-gray-500">Notes</div>
              <div className="font-semibold">{delivery.notes}</div>
            </div>
          )}
          {delivery.photos && delivery.photos.length > 0 && (
            <div>
              <div className="text-sm text-gray-500 mb-2">Delivery Photos</div>
              <Image.PreviewGroup>
                <div className="grid grid-cols-4 gap-2">
                  {delivery.photos.map((url, idx) => (
                    <Image
                      key={idx}
                      src={url}
                      alt={`Delivery photo ${idx + 1}`}
                      style={{ width: "100%", height: 120, objectFit: "cover" }}
                    />
                  ))}
                </div>
              </Image.PreviewGroup>
            </div>
          )}
        </div>
      </Modal>
    );
  };

  return (
    <AuthGuard requiredRoles={rolesAllowed}>
      <AppLayout>
        <div className="px-4 md:px-6 lg:px-8 py-4 max-w-7xl mx-auto">
          {/* Top Heading */}
          <div className="mb-4">
            <Title level={3} className="!mb-0">
              Package Delivery
            </Title>
            <p className="text-gray-500 text-sm mt-1">
              Record package item deliveries to customers
            </p>
          </div>
          {/* Main Form Grid */}
          <Form
            form={form}
            layout="vertical"
            initialValues={initialValues}
            validateMessages={validateMessages}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            className="mb-2"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Delivery Details Card */}
              <Card className="shadow-sm rounded-2xl">
                <div className="space-y-4">
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
                          invoiceId: undefined,
                        });
                        setSelectedInvoiceId("");
                      }}
                      placeholder="Search customer by name, code, or phone"
                    />
                  </Form.Item>

                  <Form.Item
                    label="Invoice"
                    name="invoiceId"
                    rules={[{ required: true }]}
                  >
                    <Select
                      className="w-full"
                      placeholder="Select invoice"
                      loading={invoicesLoading}
                      disabled={!selectedCustomerId}
                      onChange={(value) => setSelectedInvoiceId(value)}
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
                    label="Package Tracking Code"
                    name="packageItemIntakeTrackingCode"
                    rules={[{ required: true }]}
                  >
                    <Input
                      placeholder="Enter or scan tracking code"
                      suffix={
                        <Button
                          type="text"
                          icon={<QrcodeOutlined />}
                          onClick={handleScanTrackingCode}
                          size="small"
                        />
                      }
                    />
                  </Form.Item>

                  <Form.Item
                    label="Receiver Name (Optional)"
                    name="receiverName"
                  >
                    <Input placeholder="Name of person who received the package" />
                  </Form.Item>

                  <Form.Item
                    label="Quantity (Optional)"
                    name="quantity"
                    help="Leave empty to release full quantity"
                  >
                    <InputNumber
                      className="w-full"
                      min={1}
                      placeholder="Quantity released"
                    />
                  </Form.Item>
                </div>
              </Card>
              {/* Notes & Photos Card */}
              <Card className="shadow-sm rounded-2xl">
                <div className="space-y-4">
                  <Form.Item label="Delivery Notes (Optional)" name="notes">
                    <Input.TextArea
                      className="w-full"
                      rows={4}
                      placeholder="Additional notes about the delivery"
                    />
                  </Form.Item>

                  <Form.Item label="Delivery Photos (Optional)">
                    <Upload
                      multiple
                      listType="picture-card"
                      customRequest={handlePhotoUpload}
                      beforeUpload={beforeUpload}
                      showUploadList={false}
                    >
                      <Button
                        icon={<UploadOutlined />}
                        loading={uploadingPhotos}
                      >
                        Upload Photos
                      </Button>
                    </Upload>
                    {photoList.length > 0 && (
                      <div className="mt-2">
                        <Image.PreviewGroup>
                          <div className="grid grid-cols-3 gap-2">
                            {photoList.map((url, idx) => (
                              <div key={idx} className="relative">
                                <Image
                                  src={url}
                                  alt={`Photo ${idx + 1}`}
                                  style={{
                                    width: "100%",
                                    height: 80,
                                    objectFit: "cover",
                                  }}
                                />
                                <Button
                                  type="text"
                                  danger
                                  size="small"
                                  className="absolute top-0 right-0"
                                  onClick={() =>
                                    setPhotoList((prev) =>
                                      prev.filter((_, i) => i !== idx)
                                    )
                                  }
                                >
                                  ×
                                </Button>
                              </div>
                            ))}
                          </div>
                        </Image.PreviewGroup>
                      </div>
                    )}
                  </Form.Item>
                </div>
              </Card>
            </div>
            {/* Sticky Footer */}
            <div className="sticky bottom-0 bg-white/80 backdrop-blur border-t p-3 flex items-center gap-3 justify-end mt-4 z-10">
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
                Record Delivery
              </Button>
            </div>
          </Form>
          {/* Recent Deliveries Table */}
          <div className="mt-6 shadow-sm rounded-2xl p-4 bg-white">
            <Title level={4}>
              {selectedInvoiceId
                ? "Deliveries for Selected Invoice"
                : "Recent Deliveries"}
            </Title>
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
                  <div className="py-8 text-center text-gray-400">
                    {selectedInvoiceId
                      ? "No deliveries found for this invoice"
                      : "Select a customer and invoice to view deliveries"}
                  </div>
                ),
              }}
            />
          </div>
          <ScannerModal
            visible={scannerModalVisible}
            onCancel={() => setScannerModalVisible(false)}
            onScan={(decodedText) => {
              form.setFieldsValue({
                packageItemIntakeTrackingCode: decodedText,
              });
              setScannerModalVisible(false);
              toast.success("Tracking code scanned: " + decodedText);
            }}
          />
          <DeliveryDetailsModal
            visible={deliveryDetailsModalVisible}
            onCancel={() => {
              setDeliveryDetailsModalVisible(false);
              setSelectedDelivery(null);
            }}
            delivery={selectedDelivery}
          />
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
