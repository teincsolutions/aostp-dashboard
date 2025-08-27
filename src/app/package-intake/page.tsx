"use client";

import React, { useState } from "react";
import { Form, Input, InputNumber, Select, Upload, Button, Table, Space, Typography, Card, message, Modal } from "antd";
import { UploadOutlined, EyeOutlined } from "@ant-design/icons";
import { packageIntakeColumns } from "@/app/package-intake/columns";
import { usePackageIntake } from "@/hooks/usePackageIntake";
import { PackageIntakePayload, PackagePhoto } from "@/types/package";
import { AppLayout } from "@/components/AppLayout";
import { AuthGuard } from "@/components/AuthGuard";
import type { RcFile, UploadFile } from "antd/es/upload/interface";

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

const customerOptions = [
  { value: "customer-1", label: "John Doe" },
  { value: "customer-2", label: "Jane Smith" },
];

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
  const [photoList, setPhotoList] = useState<(UploadFile & { customKey?: string })[]>([]);
  const [preview, setPreview] = useState<{ visible: boolean; url: string }>({ visible: false, url: "" });
  const [tablePage, setTablePage] = useState(1);

  const {
    recentIntakes,
    recentIntakesTotal,
    recentIntakesLoading,
    createPackage,
    createPackagePending,
    uploadPackagePhoto,
    uploadPhotoPending,
    generateReceipt,
    generateReceiptPending,
    refetchRecentIntakes,
  } = usePackageIntake();

  // Helper for tracking code generation (stub)
  const handleAutoGenerateTracking = () => {
    const code = "TRK-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    form.setFieldsValue({ trackingCode: code });
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
    options: Parameters<NonNullable<import("antd").UploadProps["customRequest"]>>[0]
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
      await generateReceipt(pkg.id);
      message.success("Receipt generated");
      // TODO: Trigger notifications (email/SMS/WhatsApp)
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
            <Title level={3} className="!mb-0">Package Intake</Title>
            <div className="flex gap-2">
              <Button size="small" onClick={handleAutoGenerateTracking}>Auto-generate Tracking</Button>
              <Button size="small" onClick={() => { form.resetFields(); setPhotoList([]); }}>Reset Form</Button>
              <Button
                type="primary"
                size="middle"
                loading={createPackagePending || uploadPhotoPending || generateReceiptPending}
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
                      options={customerOptions}
                      filterOption={(input, option) =>
                        (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                      }
                      className="w-full"
                    />
                  </Form.Item>
                  <Form.Item
                    label="Tracking Code"
                    name="trackingCode"
                    rules={[{ required: true }]}
                  >
                    <div className="flex gap-2">
                      <Input className="w-full" />
                      <Button size="small" onClick={handleAutoGenerateTracking}>Auto-generate</Button>
                    </div>
                  </Form.Item>
                  <Form.Item
                    label="Description"
                    name="description"
                    rules={[{ max: 200 }]}
                  >
                    <Input.TextArea maxLength={200} showCount className="w-full" />
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
                          if (getFieldValue("shippingMode") === "AIR" && !value) {
                            return Promise.reject(new Error("Air shipping type is required"));
                          }
                          return Promise.resolve();
                        },
                      }),
                    ]}
                    hidden={form.getFieldValue("shippingMode") !== "AIR"}
                  >
                    <Select className="w-full">
                      <Option value="NORMAL_AIR">NORMAL_AIR</Option>
                      <Option value="EXPRESS_AIR">EXPRESS_AIR</Option>
                      <Option value="BATTERY_GOODS">BATTERY_GOODS</Option>
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
                  <Form.Item
                    label="Notes"
                    name="notes"
                  >
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
                        validator: async (_: any, list?: UploadFile[]) => {
                          if (!list || list.length === 0) throw new Error("At least one photo is required");
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
                      showUploadList={{ showPreviewIcon: true, showRemoveIcon: true }}
                      onRemove={(file) => {
                        setPhotoList((prev) => prev.filter((f) => f.uid !== file.uid));
                      }}
                    >
                      <Button icon={<UploadOutlined />}>Upload Photo</Button>
                    </Upload>
                    <Modal
                      open={preview.visible}
                      footer={null}
                      onCancel={() => setPreview({ visible: false, url: "" })}
                    >
                      <img alt="Preview" style={{ width: "100%" }} src={preview.url} />
                    </Modal>
                  </Form.Item>
                </Card>
              </div>
            </div>
            {/* Sticky Footer */}
            <div className="sticky bottom-0 bg-white/80 backdrop-blur border-t p-3 flex items-center gap-3 justify-end mt-4 z-10">
              <Button onClick={() => { form.resetFields(); setPhotoList([]); }}>Cancel</Button>
              <Button
                type="primary"
                loading={createPackagePending || uploadPhotoPending || generateReceiptPending}
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
              locale={{ emptyText: <div className="py-8 text-center text-gray-400">No data</div> }}
            />
          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
