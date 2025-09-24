"use client";

import React, { useState } from "react";
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
  message,
  Modal,
  Image,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { CustomerModal } from "@/components/CustomerModal";
import { Form as AntdForm } from "antd";
import { packageIntakeColumns } from "@/app/package-intake/columns";
import { usePackageIntake } from "@/hooks/usePackageIntake";
import { useCustomers, useCreateCustomer } from "@/hooks/useCustomers";
import { PackageIntakePayload } from "@/types/package";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import type { RcFile, UploadFile } from "antd/es/upload/interface";
import { CustomerCreatePayload, CustomerUpdatePayload } from "@/types/customer";
import { UploadProps } from "antd/lib";

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

const initialValues: PackageIntakePayload = {
  customerId: "",
  trackingCode: "",
  description: "",
  weight: 0,
  cbm: 0,
  quantity: 1,
  value: 0,
  shippingMode: "SEA",
  airShippingType: "",
  warehouseLocation: "",
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
  const [customerModalForm] = AntdForm.useForm();
  const [customerModalLoading, setCustomerModalLoading] = useState(false);
  const { data: customers, isLoading: customersLoading } = useCustomers({});

  // Handler to open modal from select
  const handleAddCustomerClick = () => {
    setCustomerModalVisible(true);
    customerModalForm.resetFields();
  };

  // Mutation hook for creating customer
  const { mutateAsync: createCustomerMutation } = useCreateCustomer();

  // Handler for customer creation (backend)
  const handleCreateCustomer = async (
    values: CustomerCreatePayload | CustomerUpdatePayload
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
      customerModalForm.resetFields();
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

  const {
    recentIntakes,
    recentIntakesTotal,
    recentIntakesLoading,
    createPackage,
    createPackagePending,
    uploadPackagePhoto,
    uploadPhotoPending,
    generateReceiptPending,
    refetchRecentIntakes,
  } = usePackageIntake();

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
      // Simulate upload, replace with actual packageId after create
      const uploaded = await uploadPackagePhoto({ packageId: "temp-id", file });
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
      message.error("Photo upload failed");
      if (options.onError) options.onError(new Error("Photo upload failed"));
    }
  };

  const onFinish = async (values: PackageIntakePayload) => {
    try {
      const payload: PackageIntakePayload = {
        ...values,
        photos: photoList.map((f) => ({
          url: f.url ?? "",
          key: f.customKey ?? "",
        })),
      };
      const pkg = await createPackage(payload);
      message.success("Package created");
      setPhotoList([]);
      form.resetFields();
      refetchRecentIntakes();
    } catch (err) {
      message.error("Intake failed");
    }
  };

  const onFinishFailed = () => {
    message.error("Please fix validation errors");
  };

  return (
    <AuthGuard requiredRoles={rolesAllowed}>
      <AppLayout>
        <div className="px-4 md:px-6 lg:px-8 py-4 max-w-7xl mx-auto">
          {/* Top Heading + Actions */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <Title level={3} className="!mb-0">
              Package Intake
            </Title>
            <div className="flex gap-2">
              <Button
                size="small"
                onClick={() => {
                  form.resetFields();
                  setPhotoList([]);
                }}
              >
                Reset Form
              </Button>
              <Button
                type="primary"
                size="middle"
                loading={
                  createPackagePending ||
                  uploadPhotoPending ||
                  generateReceiptPending
                }
                disabled={photoList.length < 1}
                onClick={() => form.submit()}
              >
                Save Intake
              </Button>
            </div>
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
              {/* Package Details Card */}
              <Card className="shadow-sm rounded-2xl">
                <div className="space-y-4">
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
                    rules={[{ max: 200 }]}
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
                    <Select className="w-full">
                      <Option value="SEA">SEA</Option>
                      <Option value="AIR">AIR</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item
                    label="Air Shipping Type"
                    name="airShippingType"
                    dependencies={["shippingMode"]}
                    rules={[
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (
                            getFieldValue("shippingMode") === "AIR" &&
                            !value
                          ) {
                            return Promise.reject(
                              new Error("Air shipping type is required")
                            );
                          }
                          return Promise.resolve();
                        },
                      }),
                    ]}
                    hidden={form.getFieldValue("shippingMode") !== "AIR"}
                  >
                    <Select className="w-full">
                      <Option value="NORMAL_AIR">NORMAL AIR</Option>
                      <Option value="EXPRESS_AIR">EXPRESS AIR</Option>
                      <Option value="BATTERY_GOODS">BATTERY GOODS</Option>
                      <Option value="PHONES">PHONES</Option>
                    </Select>
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
                    label="Warehouse Location"
                    name="warehouseLocation"
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
              {/* Intake Photos Card (Full width) */}
              <div className="md:col-span-2">
                <Card className="shadow-sm rounded-2xl">
                  <Form.Item
                    label="Intake Photos"
                    name="photos"
                    rules={[
                      {
                        validator: async (_: unknown, list?: UploadFile[]) => {
                          if (!list || list.length === 0)
                            throw new Error("At least one photo is required");
                        },
                      },
                    ]}
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
                      <Button icon={<UploadOutlined />}>Upload Photo</Button>
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
                onClick={() => {
                  form.resetFields();
                  setPhotoList([]);
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                loading={
                  createPackagePending ||
                  uploadPhotoPending ||
                  generateReceiptPending
                }
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
              dataSource={recentIntakes}
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
              customerModalForm.resetFields();
            }}
            onSubmit={handleCreateCustomer}
            form={customerModalForm}
            loading={customerModalLoading}
            mode="create"
          />
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
