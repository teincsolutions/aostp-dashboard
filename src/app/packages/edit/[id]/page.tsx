"use client";

import React, { useState } from "react";
import {
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  Button,
  DatePicker,
  Typography,
  Card,
  message,
  Modal,
  Image,
  Spin,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { CustomerModal } from "@/components/CustomerModal";
import { Form as AntdForm } from "antd";
import { useGetPackage, usePackageIntake } from "@/hooks/usePackageIntake";
import { useCustomers, useCreateCustomer } from "@/hooks/useCustomers";
import { CreatePackagePayload } from "@/types/package";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import type { RcFile, UploadFile } from "antd/es/upload/interface";
import { CustomerCreatePayload, CustomerUpdatePayload } from "@/types/customer";
import { UploadProps } from "antd/lib";
import { useRouter } from "next/navigation";

const { Option } = Select;
const { Title } = Typography;

const rolesAllowed = ["OPERATIONS_CLERK", "SUPER_ADMIN"];

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
  description: "",
  weight: 0,
  cbm: 0,
  quantity: 1,
  value: 0,
  shippingMode: "SEA",
  airShippingType: "",
  warehouseId: "W1",
  notes: "",
  photos: [],
};

interface PackageEditPageProps {
  params: {
    id: string;
  };
}

export default function PackageEditPage({ params }: PackageEditPageProps) {
  const { id } = params;
  const router = useRouter();
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
  const [customerModalForm] = AntdForm.useForm();
  const [customerModalLoading, setCustomerModalLoading] = useState(false);
  const { data: customers, isLoading: customersLoading } = useCustomers({});

  // Fetch package data
  const { data: packageData, isLoading: packageLoading } = useGetPackage(id);

  // Hook functions
  const { mutateAsync: createCustomerMutation } = useCreateCustomer();
  const {
    updatePackage: updatePackageMutation,
    updatePackagePending,
    uploadPackageFile,
    uploadFilePending,
  } = usePackageIntake();

  // Handler to open modal from select
  const handleAddCustomerClick = () => {
    setCustomerModalVisible(true);
  };

  // Handler for customer creation (backend)
  const handleCreateCustomer = async (
    values: any
  ) => {
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
          message.success("Customer added");
        }
      } else {
        message.error("Invalid customer payload");
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
        response.data.errors.forEach((e: string) => message.error(e));
        // Keep modal open for correction
      } else if (response?.data?.message) {
        message.error(response.data.message);
      } else {
        message.error("Failed to add customer");
      }
    } finally {
      setCustomerModalLoading(false);
    }
  };

  // Upload validation and mapping
  const beforeUpload = (file: import("antd").UploadFile) => {
    if (!["image/jpeg", "image/png"].includes(file.type || "")) {
      message.error("Only JPG/PNG files allowed");
      return Upload.LIST_IGNORE;
    }
    if ((file.size || 0) > 5 * 1024 * 1024) {
      message.error("Max file size is 5MB");
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
    options: Parameters<
      NonNullable<UploadProps["customRequest"]>
    >[0]
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
      message.error("Photo upload failed on selection");
      if (options.onError) options.onError(new Error("Photo upload failed"));
    }
  };

  // Populate form when package data is loaded
  React.useEffect(() => {
    if (packageData) {
      // Load existing photos
      setPhotoList(
        packageData.photos.map((photo, index) => ({
          uid: `existing-${index}`,
          name: `Photo ${index + 1}`,
          url: photo.url,
          customKey: photo.key,
          status: "done",
        })) as UploadFile[]
      );

      const formValues = {
        trackingCode: packageData.trackingCode,
        customerId: packageData.customerId,
        description: packageData.description,
        weight: packageData.weight,
        cbm: packageData.cbm,
        quantity: packageData.quantity,
        value: 0, // Default since not in package data
        shippingMode: packageData.shippingMode,
        airShippingType: packageData.airShippingType || "",
        warehouseId: packageData.warehouseId,
        notes: packageData.notes,
      };

      form.setFieldsValue(formValues);
    }
  }, [packageData, form]);

  const onFinish = async (values: CreatePackagePayload) => {
    try {
      // Prepare uploaded photos for payload (include both existing and new uploaded photos)
      const uploadedPhotos = photoList.map((photo) => ({
        url: photo.url!,
        key: photo.customKey!,
      }));

      // Create payload
      const payload: CreatePackagePayload = {
        trackingCode: values.trackingCode,
        customerId: values.customerId,
        description: values.description,
        weight: values.weight,
        cbm: values.cbm,
        quantity: values.quantity,
        value: values.value,
        shippingMode: values.shippingMode,
        warehouseId: values.warehouseId || "W1",
        notes: values.notes,
        photos: uploadedPhotos,
      };

      // Only add airShippingType if shippingMode is AIR and value exists
      if (values.shippingMode === "AIR" && values.airShippingType) {
        payload.airShippingType = values.airShippingType;
      }

      await updatePackageMutation({ id, payload });

      message.success("Package updated successfully");
      router.push("/packages");
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
        response.data.errors.forEach((e: string) => message.error(e));
      } else if (response?.data?.message) {
        message.error(response.data.message);
      } else {
        message.error("Package update failed");
      }
    }
  };

  const onFinishFailed = () => {
    message.error("Please fix validation errors");
  };

  if (packageLoading) {
    return (
      <AuthGuard requiredRoles={rolesAllowed}>
        <AppLayout>
          <div className="px-4 md:px-6 lg:px-8 py-4 max-w-7xl mx-auto flex justify-center items-center min-h-96">
            <Spin size="large" />
          </div>
        </AppLayout>
      </AuthGuard>
    );
  }

  if (!packageData) {
    return (
      <AuthGuard requiredRoles={rolesAllowed}>
        <AppLayout>
          <div className="px-4 md:px-6 lg:px-8 py-4 max-w-7xl mx-auto text-center min-h-96">
            <Typography.Title level={4}>Package not found</Typography.Title>
          </div>
        </AppLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRoles={rolesAllowed}>
      <AppLayout>
        <div className="px-4 md:px-6 lg:px-8 py-4 max-w-7xl mx-auto">
          {/* Top Heading + Actions */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <Title level={3} className="!mb-0">
              Edit Package - {packageData.trackingCode}
            </Title>
            <div className="flex gap-2">
              <Button
                onClick={() => router.push("/packages")}
              >
                Back to Packages
              </Button>
              <Button
                type="primary"
                size="middle"
                loading={updatePackagePending || uploadFilePending}
                onClick={() => form.submit()}
              >
                Update Package
              </Button>
            </div>
          </div>

          {/* Main Form Grid */}
          <Form
            form={form}
            layout="vertical"
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
                    label="Tracking Code"
                    name="trackingCode"
                    rules={[
                      { required: true, message: "Tracking code is required" },
                      { min: 3, message: "Tracking code must be at least 3 characters" },
                      { pattern: /^[A-Za-z0-9-]+$/, message: "Only letters, numbers, and hyphens allowed" }
                    ]}
                  >
                    <Input className="w-full" placeholder="Enter tracking code" />
                  </Form.Item>

                  <Form.Item
                    label="Customer"
                    name="customerId"
                    rules={[{ required: true }]}
                  >
                    <Select
                      showSearch
                      placeholder="Select customer"
                      loading={customersLoading}
                      options={[
                        ...(Array.isArray(customers?.data)
                          ? customers.data.map((customer) => ({
                              value: customer.id,
                              label: `${customer.customerCode} - ${customer.firstName} ${customer.lastName}`,
                            }))
                          : []),
                        { value: "__add_new__", label: "+ Add New Customer" },
                      ]}
                      filterOption={(input, option) =>
                        (option?.label ?? "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      className="w-full"
                      onSelect={(value) => {
                        if (value === "__add_new__") {
                          handleAddCustomerClick();
                          form.setFieldsValue({ customerId: "" });
                        }
                      }}
                    />
                  </Form.Item>

                  <Form.Item
                    label="Description"
                    name="description"
                    rules={[{ required: true, message: "Description is required" }, { max: 200 }]}
                  >
                    <Input.TextArea
                      maxLength={200}
                      showCount
                      className="w-full"
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
                    shouldUpdate={(prevValues, currentValues) => prevValues.shippingMode !== currentValues.shippingMode}
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
                              message: "Air shipping type is required for AIR shipping"
                            }
                          ]}
                        >
                          <Select className="w-full" placeholder="Select air shipping type">
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
              {/* Measurements & Warehouse Card */}
              <Card className="shadow-sm rounded-2xl">
                <div className="space-y-4">
                  <Form.Item
                    label="Weight (kg)"
                    name="weight"
                    rules={[{ required: true, type: "number", min: 0.01 }]}
                  >
                    <InputNumber min={0.01} className="w-full" />
                  </Form.Item>
                  <Form.Item
                    label="CBM (m³)"
                    name="cbm"
                    rules={[{ required: true, type: "number", min: 0 }]}
                  >
                    <InputNumber min={0} className="w-full" />
                  </Form.Item>
                  <Form.Item
                    label="Quantity"
                    name="quantity"
                    rules={[{ required: true, type: "number", min: 1 }]}
                  >
                    <InputNumber min={1} className="w-full" />
                  </Form.Item>
                  <Form.Item
                    label="Warehouse"
                    name="warehouseId"
                  >
                    <Input className="w-full" />
                  </Form.Item>
                  <Form.Item
                    label="Value"
                    name="value"
                    rules={[{ required: true, type: "number", min: 0 }]}
                  >
                    <InputNumber min={0} className="w-full" />
                  </Form.Item>
                  <Form.Item label="Notes" name="notes">
                    <Input.TextArea className="w-full" />
                  </Form.Item>
                </div>
              </Card>
              {/* Package Photos Card (Full width) */}
              <div className="md:col-span-2">
                <Card className="shadow-sm rounded-2xl">
                  <Form.Item
                    label="Package Photos"
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
                  </Form.Item>
                </Card>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 bg-white/80 backdrop-blur border-t p-3 flex items-center gap-3 justify-end mt-4 z-10">
              <Button
                onClick={() => router.push("/packages")}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                loading={updatePackagePending || uploadFilePending}
                onClick={() => form.submit()}
              >
                Update Package
              </Button>
            </div>
          </Form>

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
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
