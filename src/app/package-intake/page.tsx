"use client";

import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  Button,
  Table,
  Typography,
  Card,
  Modal,
  Image,
  Space,
} from "antd";
import {
  UploadOutlined,
  UserAddOutlined,
  QrcodeOutlined,
} from "@ant-design/icons";
import { CustomerModal } from "@/components/CustomerModal";
import { CustomerSearchSelect } from "@/components/CustomerSearchSelect";
import { packageIntakeColumns } from "@/app/package-intake/columns";
import { usePackageIntake } from "@/hooks/usePackageIntake";
import { useCreateCustomer } from "@/hooks/useCustomers";
import { useCustomerInvoices } from "@/hooks/useInvoices";
import { useWarehouses } from "@/hooks/useWarehouse";
import { useWarehouseStore } from "@/store/warehouseStore";
import { CreatePackagePayload } from "@/types/package";
import { ReceiptModal } from "@/components/ReceiptModal";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import type { RcFile, UploadFile } from "antd/es/upload/interface";
import { CustomerCreatePayload } from "@/types/customer";
import { UploadProps } from "antd/lib";
import { toast } from "sonner";
import { InvoiceStatus } from "@/types/invoice";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useAuth } from "@/hooks/useAuth";
import dayjs from "dayjs";

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
  trackingCode: "",
  customerId: "",
  description: "",
  quantity: 1,
  shippingMode: "SEA",
  airShippingType: "",
  warehouseId: "W1",
  notes: "",
  photos: [],
};

export default function PackageIntakePage() {
  const [form] = Form.useForm();
  const [photoList, setPhotoList] = useState<
    (UploadFile & { customKey?: string })[]
  >([]);
  const [preview, setPreview] = useState<{ visible: boolean; url: string }>({
    visible: false,
    url: "",
  });
  const [tablePage, setTablePage] = useState(1);

  // Customer modal state
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [customerModalLoading, setCustomerModalLoading] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  // Receipt modal
  const [receiptModalPackageId, setReceiptModalPackageId] = useState<
    string | null
  >(null);

  // Scanner modal state
  const [scannerModalVisible, setScannerModalVisible] = useState(false);

  // Get current user, global warehouse selection, and data
  const { user } = useAuth();
  const { selectedWarehouseId } = useWarehouseStore();
  const { data: warehouses } = useWarehouses();

  // Determine if user is admin and get current warehouse details
  const isAdmin = user?.role === "SUPER_ADMIN";

  // Customer invoices - fetch when customer is selected
  const { data: customerInvoices, isLoading: invoicesLoading } =
    useCustomerInvoices(selectedCustomerId, { limit: 5 });

  // Update form field when warehouse selection changes from header
  useEffect(() => {
    if (selectedWarehouseId) {
      form.setFieldsValue({ warehouseId: selectedWarehouseId });
    }
  }, [selectedWarehouseId, form]);

  // Handler to open modal from select
  const handleAddCustomerClick = () => {
    setCustomerModalVisible(true);
  };

  // Handler for QR/Barcode scan simulation
  const handleScanTrackingCode = () => {
    setScannerModalVisible(true);
  };

  // Mutation hook for creating customer
  const { mutateAsync: createCustomerMutation } = useCreateCustomer();

  // Handler for customer creation (backend)
  const handleCreateCustomer = async (values: any) => {
    setCustomerModalLoading(true);
    try {
      // Only handle create payloads (has firstName and lastName as required)
      if (
        "firstName" in values &&
        "lastName" in values &&
        values.firstName &&
        values.lastName
      ) {
        const created = await createCustomerMutation(
          values as CustomerCreatePayload
        );
        if (created?.id) {
          form.setFieldsValue({ customerId: created.id });
          toast.success("Customer added");
        }
      } else {
        toast.error("Invalid customer payload");
      }
      setCustomerModalVisible(false);
    } catch (err) {
      // Robust server validation error handling
      interface ErrorResponse {
        response?: {
          data?: {
            errors?: string[];
            message?: string;
          };
        };
      }
      const response =
        typeof err === "object" && err !== null && "response" in err
          ? (err as ErrorResponse).response
          : undefined;
      if (response?.data?.errors && Array.isArray(response.data.errors)) {
        response.data.errors.forEach((e: string) => toast.error(e));
        // Keep modal open for correction
      } else if (response?.data?.message) {
        toast.error(response.data.message);
      } else {
        toast.error("Failed to add customer");
      }
    } finally {
      setCustomerModalLoading(false);
    }
  };

  const {
    recentIntakes,
    recentIntakesTotal,
    recentIntakesLoading,
    createPackage,
    createPackagePending,
    uploadPackageFile,
    uploadFilePending,
    refetchRecentIntakes,
  } = usePackageIntake();

  // Upload validation and mapping
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

  const normFile = (e: unknown): UploadFile[] => {
    if (Array.isArray(e)) return e as UploadFile[];
    return (e as { fileList?: UploadFile[] })?.fileList || [];
  };

  const handlePreview = async (file: UploadFile) => {
    setPreview({ visible: true, url: file.url || file.thumbUrl || "" });
  };

  const handlePhotoUpload = async (
    options: Parameters<NonNullable<UploadProps["customRequest"]>>[0]
  ) => {
    try {
      if (typeof options.file === "string") {
        throw new Error("Invalid file type");
      }
      const file = options.file as RcFile;

      // Upload using the pictures endpoint
      const uploadedList = await uploadPackageFile({
        folder: "pictures",
        files: [file],
      });
      const uploaded = uploadedList[0]; // Assuming it returns array as in the example
      setPhotoList((prev) => [
        ...prev,
        {
          uid: file.uid,
          name: file.name,
          url: uploaded.url,
          customKey: uploaded.key,
          status: "done",
        } as UploadFile & { customKey?: string },
      ]);
      if (options.onSuccess) options.onSuccess("ok");
    } catch (err) {
      toast.error("Photo upload failed on selection");
      if (options.onError) options.onError(new Error("Photo upload failed"));
    }
  };

  const onFinish = async (values: any) => {
    try {
      // Prepare uploaded photos for payload (already uploaded in handlePhotoUpload)
      const uploadedPhotos = photoList.map((photo) => ({
        url: photo.url!,
        key: photo.customKey!,
      }));

      // Create payload with all required fields
      const payload: CreatePackagePayload = {
        trackingCode: values.trackingCode.trim() || "",
        customerId: values.customerId,
        description: values.description,
        quantity: values.quantity,
        shippingMode: values.shippingMode,
        warehouseId: values.warehouseId || "W1",
        notes: values.notes,
        photos: uploadedPhotos,
        pickupCode: values.pickupCode || undefined,
      };

      // Add weight and cbm based on shipping mode
      if (values.weight !== undefined) {
        payload.weight = values.weight;
      }
      if (values.cbm !== undefined) {
        payload.cbm = values.cbm;
      }

      // Only add airShippingType if shippingMode is AIR and value exists
      if (values.shippingMode === "AIR" && values.airShippingType) {
        payload.airShippingType = values.airShippingType;
      }

      const pkg = await createPackage(payload);
      toast.success("Package created successfully.");

      setReceiptModalPackageId(pkg.id);
      setPhotoList([]);
      form.resetFields();
      refetchRecentIntakes();
    } catch (err) {
      // Handle validation errors from server response
      interface ErrorResponse {
        response?: {
          data?: {
            errors?: string[];
            message?: string;
          };
        };
      }
      const response =
        typeof err === "object" && err !== null && "response" in err
          ? (err as ErrorResponse).response
          : undefined;
      if (response?.data?.errors && Array.isArray(response.data.errors)) {
        response.data.errors.forEach((e: string) => toast.error(e));
      } else if (response?.data?.message) {
        toast.error(response.data.message);
      } else {
        toast.error("Intake failed");
      }
    }
  };

  const onFinishFailed = () => {
    toast.error("Please fix validation errors");
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

  return (
    <AuthGuard requiredRoles={rolesAllowed}>
      <AppLayout>
        <div className="px-4 md:px-6 lg:px-8 py-4 max-w-7xl mx-auto">
          {/* Top Heading */}
          <div className="mb-4 flex items-center justify-between">
            <Title level={3} className="!mb-0">
              Package Intake
            </Title>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={handleAddCustomerClick}
            >
              Add Customer
            </Button>
          </div>
          {/* Main Form Grid */}
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              ...initialValues,
              warehouseId: selectedWarehouseId,
            }}
            validateMessages={validateMessages}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            className="mb-2"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Package Details Card */}
              <Card className="shadow-sm rounded-2xl">
                <div className="space-y-4">
                  <Form.Item
                    label="Customer"
                    name="customerId"
                    rules={[{ required: true }]}
                  >
                    <CustomerSearchSelect
                      placeholder="Select customer"
                      showAddNew={true}
                      onAddNew={handleAddCustomerClick}
                      onSelect={(value) => {
                        if (value === "__add_new__") {
                          handleAddCustomerClick();
                          form.setFieldsValue({ customerId: "" });
                          setSelectedCustomerId("");
                        } else {
                          setSelectedCustomerId(value);
                        }
                      }}
                    />
                  </Form.Item>

                  {/* Recent Invoices Display */}
                  {selectedCustomerId && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                      <Title level={5} className="!mb-3">
                        Recent Invoices
                      </Title>
                      {invoicesLoading ? (
                        <div className="text-center py-4">
                          Loading invoices...
                        </div>
                      ) : (customerInvoices && customerInvoices?.meta?.total) ||
                        0 > 0 ? (
                        <div className="space-y-2">
                          {customerInvoices?.data
                            .slice(0, 5)
                            .map((invoice, index) => (
                              <div
                                key={invoice.id}
                                className="flex justify-between items-center p-2 bg-white rounded border"
                              >
                                <div>
                                  <div className="font-medium">
                                    {invoice.invoiceNumber}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {dayjs(invoice.createdAt).format(
                                      "DD MMM, YYYY"
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">
                                    ${invoice.totalAmount.toFixed(2)}
                                  </div>
                                  <div
                                    className={`text-sm px-2 py-1 rounded ${
                                      invoice.status === InvoiceStatus.PAID
                                        ? "bg-green-100 text-green-800"
                                        : invoice.status ===
                                          InvoiceStatus.UNPAID
                                        ? "bg-red-100 text-red-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {invoice.status}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          No recent invoices found
                        </div>
                      )}
                    </div>
                  )}

                  <Form.Item
                    label="Description"
                    name="description"
                    rules={[
                      { required: true, message: "Description is required" },
                      { max: 200 },
                    ]}
                  >
                    <Input.TextArea
                      maxLength={200}
                      showCount
                      className="w-full"
                      placeholder="Describe the package contents"
                    />
                  </Form.Item>

                  <Form.Item
                    label="Tracking Code (Optional)"
                    name="trackingCode"
                    rules={[
                      {
                        min: 3,
                        message: "Tracking code must be at least 3 characters",
                      },
                      {
                        pattern: /^[A-Za-z0-9-]+$/,
                        message: "Only letters, numbers, and hyphens allowed",
                      },
                    ]}
                  >
                    <Space.Compact className="w-full">
                      <Input
                        placeholder="Scan or enter tracking code"
                        style={{ width: "calc(100% - 100px)" }}
                      />
                      <Button
                        type="primary"
                        icon={<QrcodeOutlined />}
                        onClick={handleScanTrackingCode}
                        style={{ width: "100px" }}
                      >
                        Scan
                      </Button>
                    </Space.Compact>
                  </Form.Item>

                  <Form.Item
                    label="Quantity"
                    name="quantity"
                    rules={[{ required: true, type: "number", min: 1 }]}
                  >
                    <InputNumber
                      min={1}
                      className="w-full"
                      placeholder="Number of items"
                    />
                  </Form.Item>

                  <Form.Item
                    label="Shipping Mode"
                    name="shippingMode"
                    rules={[{ required: true }]}
                  >
                    <Select
                      className="w-full"
                      onChange={(value) => {
                        // Clear airShippingType when switching to SEA
                        if (value === "SEA") {
                          form.setFieldsValue({ airShippingType: "" });
                        }
                      }}
                    >
                      <Option value="SEA">SEA</Option>
                      <Option value="AIR">AIR</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    shouldUpdate={(prevValues, currentValues) =>
                      prevValues.shippingMode !== currentValues.shippingMode
                    }
                    noStyle
                  >
                    {({ getFieldValue }) => {
                      const shippingMode = getFieldValue("shippingMode");
                      return shippingMode === "AIR" ? (
                        <Form.Item
                          label="Air Shipping Type"
                          name="airShippingType"
                          rules={[
                            {
                              required: true,
                              message:
                                "Air shipping type is required for AIR shipping",
                            },
                          ]}
                        >
                          <Select
                            className="w-full"
                            placeholder="Select air shipping type"
                          >
                            <Option value="NORMAL_AIR">NORMAL AIR</Option>
                            <Option value="EXPRESS_AIR">EXPRESS AIR</Option>
                            <Option value="BATTERY_GOODS">BATTERY GOODS</Option>
                            <Option value="PHONES">PHONES</Option>
                          </Select>
                        </Form.Item>
                      ) : null;
                    }}
                  </Form.Item>
                </div>
              </Card>
              {/* Warehouse & Additional Info Card */}
              <Card className="shadow-sm rounded-2xl">
                <div className="space-y-4">
                  <Form.Item
                    label="Warehouse"
                    name="warehouseId"
                    rules={[
                      { required: true, message: "Please select a warehouse" },
                    ]}
                  >
                    <Select
                      className="w-full"
                      placeholder="Select warehouse"
                      disabled={!isAdmin}
                      value={
                        (warehouses?.data?.length || 0) > 0
                          ? selectedWarehouseId
                          : undefined
                      }
                    >
                      {warehouses?.data?.map((warehouse) => (
                        <Select.Option key={warehouse.id} value={warehouse.id}>
                          {warehouse.warehouseId} - {warehouse.name} (
                          {warehouse.location})
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  {isAdmin && (
                    <div className="text-xs text-gray-500">
                      Admins can change warehouses above. Regular clerks use
                      their assigned warehouse.
                    </div>
                  )}

                  <Form.Item label="Pickup Code (Optional)" name="pickupCode">
                    <Input placeholder="Enter pickup code" maxLength={20} />
                  </Form.Item>

                  <Form.Item label="Notes" name="notes">
                    <Input.TextArea
                      className="w-full"
                      rows={4}
                      placeholder="Additional notes about the package"
                    />
                  </Form.Item>
                </div>
              </Card>
              {/* Intake Photos Card (Full width) */}
              <div className="md:col-span-2">
                <Card className="shadow-sm rounded-2xl">
                  <Form.Item
                    label="Intake Photos"
                    name="photos"
                    getValueFromEvent={normFile}
                    valuePropName="fileList"
                  >
                    <Upload
                      multiple
                      listType="picture-card"
                      customRequest={handlePhotoUpload}
                      fileList={photoList}
                      beforeUpload={beforeUpload}
                      onPreview={handlePreview}
                      showUploadList={{
                        showPreviewIcon: true,
                        showRemoveIcon: true,
                      }}
                      onRemove={(file) => {
                        setPhotoList((prev) =>
                          prev.filter((f) => f.uid !== file.uid)
                        );
                      }}
                    >
                      <Button icon={<UploadOutlined />}>Select Photos</Button>
                    </Upload>
                  </Form.Item>
                  <Modal
                    open={preview.visible}
                    footer={null}
                    onCancel={() => setPreview({ visible: false, url: "" })}
                  >
                    <Image
                      alt="Preview"
                      style={{ width: "100%" }}
                      src={preview.url}
                    />
                  </Modal>
                </Card>
              </div>
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
                loading={createPackagePending || uploadFilePending}
                disabled={photoList.length < 1}
                onClick={() => form.submit()}
              >
                Save Intake
              </Button>
            </div>
          </Form>
          {/* Recent Intakes Table */}
          <div className="mt-6 shadow-sm rounded-2xl p-4 bg-white">
            <Title level={4}>Recent Intakes</Title>
            <Table
              columns={packageIntakeColumns}
              dataSource={recentIntakes.map((item) => ({
                ...item,
                onViewReceipt: (id: string) => setReceiptModalPackageId(id),
              }))}
              rowKey="id"
              loading={recentIntakesLoading}
              pagination={{
                current: tablePage,
                pageSize: 10,
                total: recentIntakesTotal,
                showSizeChanger: true,
                onChange: (page) => setTablePage(page),
              }}
              scroll={{ x: true }}
              size="middle"
              locale={{
                emptyText: (
                  <div className="py-8 text-center text-gray-400">No data</div>
                ),
              }}
            />
          </div>
          {/* Customer Modal */}
          <CustomerModal
            visible={customerModalVisible}
            onCancel={() => {
              setCustomerModalVisible(false);
            }}
            onSubmit={handleCreateCustomer}
            loading={customerModalLoading}
            mode="create"
          />
          <ReceiptModal
            visible={!!receiptModalPackageId}
            onClose={() => setReceiptModalPackageId(null)}
            packageId={receiptModalPackageId}
          />
          <ScannerModal
            visible={scannerModalVisible}
            onCancel={() => setScannerModalVisible(false)}
            onScan={(decodedText) => {
              form.setFieldsValue({ trackingCode: decodedText });
              setScannerModalVisible(false);
              toast.success("Tracking code scanned: " + decodedText);
            }}
          />
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
