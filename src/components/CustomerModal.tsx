// src/components/CustomerModal.tsx

"use client";

import React from "react";
import { Modal, Row, Col, Input, Select, Space, Button, Form } from "antd";
import { Formik, FormikProps, FormikHelpers } from "formik";
import { message } from "antd";
import * as Yup from "yup";
import { IdType, PreferredChannel, CustomerCreatePayload, CustomerUpdatePayload, Customer } from "@/types/customer";
import { customerCreateSchema, customerUpdateSchema } from "@/utils/forms/customerSchemas";
import { getServerValidationErrors } from "@/utils/forms/errorUtils";

const { Option } = Select;

interface CustomerFormikValues {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  alternatePhone?: string;
  address?: string;
  city: string;
  country: string;
  idType: string;
  idNumber: string;
  preferredChannel?: string;
}

interface CustomerModalProps {
  visible: boolean;
  onCancel: () => void;
  loading?: boolean;
  mode: "create" | "edit";
  initialValues?: Partial<CustomerFormikValues>;
  onSubmit: (values: CustomerFormikValues) => Promise<void>;
}

const idTypeOptions = [
  { label: "National ID", value: IdType.NATIONAL_ID },
  { label: "Passport", value: IdType.PASSPORT },
  { label: "Driver License", value: IdType.DRIVERS_LICENSE },
  { label: "Voter ID", value: IdType.VOTER_ID },
];

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
  const schema = mode === "create" ? customerCreateSchema : customerUpdateSchema;

  return (
    <Formik<CustomerFormikValues>
      initialValues={{
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        alternatePhone: "",
        address: "",
        city: "",
        country: "",
        idType: "",
        idNumber: "",
        preferredChannel: "",
        ...initialValues,
      }}
      validationSchema={schema}
      onSubmit={async (values, { setErrors }) => {
        try {
          await onSubmit(values);
        } catch (error: any) {
          const fieldErrors = getServerValidationErrors(error);
          if (fieldErrors) {
            setErrors(fieldErrors);
          } else {
            message.error(error.response?.data?.message || "Something went wrong");
          }
        }
      }}
    >
      {(formik) => (
        <Modal
          title={mode === "create" ? "Create New Customer" : "Edit Customer"}
          open={visible}
          onCancel={onCancel}
          footer={null}
          width={700}
        >
          <form onSubmit={(formik as any).handleSubmit}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="First Name"
                  help={formik.touched.firstName && formik.errors.firstName}
                  hasFeedback={!!formik.errors.firstName}
                  validateStatus={formik.touched.firstName && formik.errors.firstName ? "error" : ""}
                >
                  <Input
                    placeholder="Enter first name"
                    value={formik.values.firstName}
                    onChange={(e) => formik.setFieldValue("firstName", e.target.value)}
                    onBlur={() => formik.setFieldTouched("firstName", true)}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Last Name"
                  help={formik.touched.lastName && formik.errors.lastName}
                  hasFeedback={!!formik.errors.lastName}
                  validateStatus={formik.touched.lastName && formik.errors.lastName ? "error" : ""}
                >
                  <Input
                    placeholder="Enter last name"
                    value={formik.values.lastName}
                    onChange={(e) => formik.setFieldValue("lastName", e.target.value)}
                    onBlur={() => formik.setFieldTouched("lastName", true)}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Email"
                  help={formik.touched.email && formik.errors.email}
                  hasFeedback={!!formik.errors.email}
                  validateStatus={formik.touched.email && formik.errors.email ? "error" : ""}
                >
                  <Input
                    placeholder="Enter email"
                    value={formik.values.email}
                    onChange={(e) => formik.setFieldValue("email", e.target.value)}
                    onBlur={() => formik.setFieldTouched("email", true)}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Phone Number"
                  help={formik.touched.phoneNumber && formik.errors.phoneNumber}
                  hasFeedback={!!formik.errors.phoneNumber}
                  validateStatus={formik.touched.phoneNumber && formik.errors.phoneNumber ? "error" : ""}
                >
                  <Input
                    placeholder="Enter phone number"
                    value={formik.values.phoneNumber}
                    onChange={(e) => formik.setFieldValue("phoneNumber", e.target.value)}
                    onBlur={() => formik.setFieldTouched("phoneNumber", true)}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Alternate Phone">
              <Input
                placeholder="Enter alternate phone"
                value={formik.values.alternatePhone}
                onChange={(e) => formik.setFieldValue("alternatePhone", e.target.value)}
              />
            </Form.Item>

            <Form.Item label="Address">
              <Input
                placeholder="Enter address"
                value={formik.values.address}
                onChange={(e) => formik.setFieldValue("address", e.target.value)}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="City"
                  help={formik.touched.city && formik.errors.city}
                  hasFeedback={!!formik.errors.city}
                  validateStatus={formik.touched.city && formik.errors.city ? "error" : ""}
                >
                  <Input
                    placeholder="Enter city"
                    value={formik.values.city}
                    onChange={(e) => formik.setFieldValue("city", e.target.value)}
                    onBlur={() => formik.setFieldTouched("city", true)}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Country"
                  help={formik.touched.country && formik.errors.country}
                  hasFeedback={!!formik.errors.country}
                  validateStatus={formik.touched.country && formik.errors.country ? "error" : ""}
                >
                  <Input
                    placeholder="Enter country"
                    value={formik.values.country}
                    onChange={(e) => formik.setFieldValue("country", e.target.value)}
                    onBlur={() => formik.setFieldTouched("country", true)}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="ID Type"
                  help={formik.touched.idType && formik.errors.idType}
                  hasFeedback={!!formik.errors.idType}
                  validateStatus={formik.touched.idType && formik.errors.idType ? "error" : ""}
                >
                  <Select
                    placeholder="Select ID type"
                    value={formik.values.idType}
                    onChange={(value) => formik.setFieldValue("idType", value)}
                    onBlur={() => formik.setFieldTouched("idType", true)}
                    allowClear
                  >
                    {idTypeOptions.map((option) => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="ID Number"
                  help={formik.touched.idNumber && formik.errors.idNumber}
                  hasFeedback={!!formik.errors.idNumber}
                  validateStatus={formik.touched.idNumber && formik.errors.idNumber ? "error" : ""}
                >
                  <Input
                    placeholder="Enter ID number"
                    value={formik.values.idNumber}
                    onChange={(e) => formik.setFieldValue("idNumber", e.target.value)}
                    onBlur={() => formik.setFieldTouched("idNumber", true)}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Preferred Channel">
              <Select
                placeholder="Select preferred channel"
                value={formik.values.preferredChannel}
                onChange={(value) => formik.setFieldValue("preferredChannel", value)}
                allowClear
              >
                {preferredChannelOptions.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <div style={{ marginTop: 24 }}>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {mode === "create" ? "Create Customer" : "Update Customer"}
                </Button>
                <Button onClick={onCancel}>Cancel</Button>
              </Space>
            </div>
          </form>
        </Modal>
      )}
    </Formik>
  );
};
