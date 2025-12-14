// src/components/CustomerModal.tsx

"use client";

import React from "react";
import { Modal, Row, Col, Input, Select, Space, Button, Form } from "antd";
import { Formik, FormikProps, FormikHelpers } from "formik";
import { message } from "antd";
import * as Yup from "yup";
import {
  PreferredChannel,
  CustomerCreatePayload,
  CustomerUpdatePayload,
  Customer,
} from "@/types/customer";
import {
  customerCreateSchema,
  customerUpdateSchema,
} from "@/utils/forms/customerSchemas";
import { getServerValidationErrors } from "@/utils/forms/errorUtils";
import { toast } from "sonner";
import { useWarehouses } from "@/hooks/useWarehouse";
import { useCities } from "@/hooks/useCities";

const { Option } = Select;

interface CustomerFormikValues {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address?: string;
  email?: string;
  alternatePhone?: string;
  warehouseId?: string;
  cityId?: string;
  preferredChannel?: string;
}

interface CustomerModalProps {
  visible: boolean;
  onCancel: () => void;
  loading?: boolean;
  mode: "create" | "edit";
  initialValues?: Partial<CustomerFormikValues>;
  onSubmit: (values: any) => Promise<void>;
}

const preferredChannelOptions = [
  { label: "SMS", value: PreferredChannel.SMS },
  { label: "Email", value: PreferredChannel.EMAIL },
  { label: "WhatsApp", value: PreferredChannel.WHATSAPP },
];

export const CustomerModal: React.FC<CustomerModalProps> = ({
  visible,
  onCancel,
  loading,
  mode,
  initialValues = {},
  onSubmit,
}) => {
  const schema =
    mode === "create" ? customerCreateSchema : customerUpdateSchema;

  // Fetch warehouses and cities for select dropdowns
  const { data: warehousesData, isLoading: warehousesLoading } = useWarehouses({
    limit: 100, // Maximum allowed limit
  });
  const { data: citiesData, isLoading: citiesLoading } = useCities({
    limit: 100, // Maximum allowed limit
  });

  return (
    <Modal
      title={mode === "create" ? "Create New Customer" : "Edit Customer"}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={700}
    >
      <Formik<CustomerFormikValues>
        initialValues={{
          firstName: "",
          lastName: "",
          phoneNumber: "",
          address: "",
          email: "",
          alternatePhone: "",
          warehouseId: "",
          cityId: "",
          preferredChannel: "SMS",
          ...initialValues,
        }}
        validationSchema={schema}
        enableReinitialize={true}
        onSubmit={async (values, { setErrors, resetForm }) => {
          try {
            // remove empty strings for optional fields
            Object.keys(values).forEach((key) => {
              if (values[key as keyof CustomerFormikValues] === "") {
                delete values[key as keyof CustomerFormikValues];
              }
            });
            await onSubmit(values);
            resetForm();
          } catch (error: any) {
            const fieldErrors = getServerValidationErrors(error);
            if (fieldErrors) {
              setErrors(fieldErrors);
            } else {
              toast.error(
                error.response?.data?.message || "Something went wrong"
              );
            }
          }
        }}
      >
        {(formik) => (
          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <Input
                    placeholder="Enter first name"
                    value={formik.values.firstName}
                    onChange={(e) =>
                      formik.setFieldValue("firstName", e.target.value)
                    }
                    onBlur={() => formik.setFieldTouched("firstName", true)}
                    status={
                      formik.touched.firstName && formik.errors.firstName
                        ? "error"
                        : ""
                    }
                  />
                  {formik.touched.firstName && formik.errors.firstName && (
                    <div className="text-red-500 text-xs">
                      {formik.errors.firstName}
                    </div>
                  )}
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <Input
                    placeholder="Enter last name"
                    value={formik.values.lastName}
                    onChange={(e) =>
                      formik.setFieldValue("lastName", e.target.value)
                    }
                    onBlur={() => formik.setFieldTouched("lastName", true)}
                    status={
                      formik.touched.lastName && formik.errors.lastName
                        ? "error"
                        : ""
                    }
                  />
                  {formik.touched.lastName && formik.errors.lastName && (
                    <div className="text-red-500 text-xs">
                      {formik.errors.lastName}
                    </div>
                  )}
                </div>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <Input
                    placeholder="Enter email"
                    value={formik.values.email}
                    onChange={(e) =>
                      formik.setFieldValue("email", e.target.value)
                    }
                    onBlur={() => formik.setFieldTouched("email", true)}
                    status={
                      formik.touched.email && formik.errors.email ? "error" : ""
                    }
                  />
                  {formik.touched.email && formik.errors.email && (
                    <div className="text-red-500 text-xs">
                      {formik.errors.email}
                    </div>
                  )}
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Phone Number *
                  </label>
                  <Input
                    placeholder="Enter phone number"
                    value={formik.values.phoneNumber}
                    onChange={(e) =>
                      formik.setFieldValue("phoneNumber", e.target.value)
                    }
                    onBlur={() => formik.setFieldTouched("phoneNumber", true)}
                    status={
                      formik.touched.phoneNumber && formik.errors.phoneNumber
                        ? "error"
                        : ""
                    }
                  />
                  {formik.touched.phoneNumber && formik.errors.phoneNumber && (
                    <div className="text-red-500 text-xs">
                      {formik.errors.phoneNumber}
                    </div>
                  )}
                </div>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Alternate Phone
                  </label>
                  <Input
                    placeholder="Enter alternate phone"
                    value={formik.values.alternatePhone}
                    onChange={(e) =>
                      formik.setFieldValue("alternatePhone", e.target.value)
                    }
                  />
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <Input
                    placeholder="Enter address"
                    value={formik.values.address}
                    onChange={(e) =>
                      formik.setFieldValue("address", e.target.value)
                    }
                    status={
                      formik.touched.address && formik.errors.address
                        ? "error"
                        : ""
                    }
                  />
                  {formik.touched.address && formik.errors.address && (
                    <div className="text-red-500 text-xs">
                      {formik.errors.address}
                    </div>
                  )}
                </div>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Warehouse
                  </label>
                  <Select
                    placeholder="Select warehouse (optional)"
                    value={formik.values.warehouseId}
                    onChange={(value) =>
                      formik.setFieldValue("warehouseId", value)
                    }
                    allowClear
                    loading={warehousesLoading}
                    showSearch
                    className="w-full"
                  >
                    {warehousesData?.data?.map((warehouse: any) => (
                      <Option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} - {warehouse.location || "N/A"}
                      </Option>
                    ))}
                  </Select>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <Select
                    placeholder="Select city (optional)"
                    value={formik.values.cityId}
                    onChange={(value) => formik.setFieldValue("cityId", value)}
                    allowClear
                    loading={citiesLoading}
                    showSearch
                    className="w-full"
                  >
                    {citiesData?.data?.map((city: any) => (
                      <Option key={city.id} value={city.id}>
                        {city.name}, {city.country}
                      </Option>
                    ))}
                  </Select>
                </div>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Preferred Channel
                  </label>
                  <Select
                    placeholder="Select preferred channel"
                    value={formik.values.preferredChannel}
                    onChange={(value) =>
                      formik.setFieldValue("preferredChannel", value)
                    }
                    allowClear
                    className="w-full"
                  >
                    {preferredChannelOptions.map((option) => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </div>
              </Col>
            </Row>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button onClick={onCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {mode === "create" ? "Create Customer" : "Update Customer"}
              </Button>
            </div>
          </form>
        )}
      </Formik>
    </Modal>
  );
};
